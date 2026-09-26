import type { z } from "zod";
import {
  MAX_PROVIDER_RETRIES,
  PROVIDER_MAX_CALL_MS,
  PROVIDER_TIMEOUT_MS,
  RETRY_BASE_DELAY_MS,
} from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { type AIProvider, ProviderError, toProviderError } from "./provider";
import { toJsonSchema, validateOutput } from "./structured-output";

/** How much of an invalid response is echoed back in the repair prompt. */
const REPAIR_ECHO_CHARS = 4_000;
/** How much of a provider error message is written to server logs. */
const LOG_DETAIL_CHARS = 300;

/** A model task: instructions, content and the schema its output must satisfy. */
export interface ModelTask<T> {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
}

/** Tunables, overridable in tests. */
export interface AIManagerOptions {
  maxRetries?: number;
  timeoutMs?: number;
  maxCallMs?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Server-log detail for a provider failure; truncated and never sent to the client. */
function describeCause(error: ProviderError): string {
  const detail = error.cause instanceof Error ? error.cause.message : error.message;
  return detail.slice(0, LOG_DETAIL_CHARS);
}

/**
 * Runs model tasks with a per-call timeout, retry with exponential backoff and jitter,
 * provider fallback, and one schema-repair attempt. Callers only ever see validated data or
 * an AppError.
 */
export class AIManager {
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly maxCallMs: number;
  private readonly baseDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly random: () => number;

  constructor(
    private readonly providers: readonly AIProvider[],
    options: AIManagerOptions = {},
  ) {
    if (providers.length === 0) {
      throw new AppError("SERVICE_MISCONFIGURED", "The analysis service is not configured.");
    }
    this.maxRetries = options.maxRetries ?? MAX_PROVIDER_RETRIES;
    this.timeoutMs = options.timeoutMs ?? PROVIDER_TIMEOUT_MS;
    this.maxCallMs = options.maxCallMs ?? PROVIDER_MAX_CALL_MS;
    this.baseDelayMs = options.baseDelayMs ?? RETRY_BASE_DELAY_MS;
    this.sleep = options.sleep ?? defaultSleep;
    this.random = options.random ?? Math.random;
  }

  /** Model names in fallback order. */
  get models(): string[] {
    return this.providers.map((provider) => provider.model);
  }

  /**
   * Generates and validates structured output.
   * @param task - instructions, content and output schema.
   * @returns data that passed schema validation.
   * @throws AppError AI_UNAVAILABLE when every provider fails, AI_INVALID_OUTPUT when the
   *   output still fails validation after one repair attempt.
   */
  async generate<T>(task: ModelTask<T>): Promise<T> {
    const jsonSchema = toJsonSchema(task.schema);
    let lastError: ProviderError | undefined;

    for (const provider of this.providers) {
      try {
        const raw = await this.callWithRetry(provider, task.system, task.prompt, jsonSchema);
        const data = await this.validateOrRepair(provider, task, jsonSchema, raw);
        if (provider !== this.providers[0]) console.warn(`[ai] served by fallback ${provider.id}`);
        return data;
      } catch (error) {
        if (!(error instanceof ProviderError)) throw error;
        lastError = error;
        console.warn(`[ai] provider ${provider.id} failed: ${error.kind}`, describeCause(error));
      }
    }
    throw new AppError(
      "AI_UNAVAILABLE",
      "The analysis service is temporarily unavailable. Please try again in a minute.",
      { cause: lastError },
    );
  }

  private async validateOrRepair<T>(
    provider: AIProvider,
    task: ModelTask<T>,
    jsonSchema: Record<string, unknown>,
    raw: string,
  ): Promise<T> {
    const first = validateOutput(task.schema, raw);
    if (first.success) return first.data;
    console.warn(
      `[ai] ${provider.id} output failed validation; repairing`,
      first.problem.slice(0, LOG_DETAIL_CHARS),
    );

    const repairPrompt = [
      task.prompt,
      "Your previous response did not match the required JSON schema.",
      `Validation errors:\n${first.problem}`,
      `Previous response (truncated):\n${raw.slice(0, REPAIR_ECHO_CHARS)}`,
      "Return the complete corrected JSON object only.",
    ].join("\n\n");
    const repairedRaw = await this.callWithRetry(provider, task.system, repairPrompt, jsonSchema);
    const repaired = validateOutput(task.schema, repairedRaw);
    if (repaired.success) return repaired.data;

    throw new AppError(
      "AI_INVALID_OUTPUT",
      "The analysis came back in an unexpected format. Please try again.",
    );
  }

  private async callWithRetry(
    provider: AIProvider,
    system: string,
    prompt: string,
    jsonSchema: Record<string, unknown>,
  ): Promise<string> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.callOnce(provider, system, prompt, jsonSchema);
      } catch (error) {
        if (!(error instanceof ProviderError) || !error.retryable || attempt >= this.maxRetries) {
          throw error;
        }
        const backoff = this.baseDelayMs * 2 ** attempt;
        await this.sleep(backoff + this.random() * backoff);
      }
    }
  }

  /**
   * One provider call under two timers: an idle timer that aborts when the provider sends
   * nothing for `timeoutMs` (reset on each streamed chunk), and a hard cap of `maxCallMs`.
   */
  private async callOnce(
    provider: AIProvider,
    system: string,
    prompt: string,
    jsonSchema: Record<string, unknown>,
  ): Promise<string> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    let idleTimer = setTimeout(abort, this.timeoutMs);
    const hardTimer = setTimeout(abort, this.maxCallMs);
    const onActivity = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(abort, this.timeoutMs);
    };
    try {
      return await provider.generateJson({
        system,
        prompt,
        jsonSchema,
        signal: controller.signal,
        onActivity,
      });
    } catch (error) {
      throw toProviderError(error, controller.signal);
    } finally {
      clearTimeout(idleTimer);
      clearTimeout(hardTimer);
    }
  }
}
