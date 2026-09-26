import "server-only";
import { AIManager } from "./ai-manager";
import { DEFAULT_GEMINI_MODEL, GeminiProvider } from "./gemini-provider";
import { GroqProvider } from "./groq-provider";
import type { AIProvider } from "./provider";

/** Health checks are cached so the endpoint cannot be used to hammer the provider. */
const HEALTH_CACHE_MS = 60_000;
const HEALTH_TIMEOUT_MS = 5_000;

/** Splits a comma-separated env value into trimmed, non-empty entries. */
function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Reachability of the analysis model, as reported by the health check. */
export type AIReachability = "reachable" | "unreachable" | "not_configured";

/**
 * Builds providers from whichever keys are set. Gemini is primary when present, followed by
 * any GEMINI_FALLBACK_MODELS (each model has its own free-tier quota), then Groq if its key
 * is set. Whichever provider is configured first is primary.
 * @param env - environment variables, injectable for tests.
 * @returns providers in fallback order; empty when no key is configured.
 */
export function providersFromEnv(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AIProvider[] {
  const providers: AIProvider[] = [];
  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    const models = [
      env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      ...splitList(env.GEMINI_FALLBACK_MODELS),
    ];
    for (const model of new Set(models)) providers.push(new GeminiProvider(geminiKey, model));
  }
  if (env.GROQ_API_KEY) {
    providers.push(new GroqProvider(env.GROQ_API_KEY, env.GROQ_MODEL || undefined));
  }
  return providers;
}

/** Whether at least one provider key is configured. */
export function isAIConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
}

let shared: AIManager | undefined;

/**
 * Returns the process-wide AI manager, created on first use.
 * @throws AppError SERVICE_MISCONFIGURED when no provider key is set.
 */
export function getAIManager(): AIManager {
  shared ??= new AIManager(providersFromEnv());
  return shared;
}

let lastHealth: { at: number; value: AIReachability } | undefined;

/**
 * Checks whether any configured provider answers a metadata request. Cached for a minute.
 * @returns reachability without any provider name or error detail.
 */
export async function checkAIReachability(): Promise<AIReachability> {
  if (lastHealth && Date.now() - lastHealth.at < HEALTH_CACHE_MS) return lastHealth.value;
  const providers = providersFromEnv();
  let value: AIReachability = providers.length === 0 ? "not_configured" : "unreachable";
  for (const provider of providers) {
    try {
      await provider.ping(AbortSignal.timeout(HEALTH_TIMEOUT_MS));
      value = "reachable";
      break;
    } catch {
      continue;
    }
  }
  lastHealth = { at: Date.now(), value };
  return value;
}
