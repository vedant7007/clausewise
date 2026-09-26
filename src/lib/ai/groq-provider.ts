import {
  type AIProvider,
  type GenerateRequest,
  kindFromStatus,
  ProviderError,
  toProviderError,
} from "./provider";

/**
 * Default when GROQ_MODEL is unset, chosen from the models the deployment key can use. Its free
 * tier suits Q&A and negotiation; production sets GROQ_MODEL to a larger model for full analyses.
 */
export const DEFAULT_GROQ_MODEL = "qwen/qwen3.8-27b";
const GROQ_API_URL = "https://api.groq.com/openai/v1";
const GROQ_CHAT_URL = `${GROQ_API_URL}/chat/completions`;
const TEMPERATURE = 0.2;
/**
 * Room for a full analysis. Groq defaults to about 3,000 completion tokens, which truncates it;
 * with a typical 3,000-token prompt this also stays under the free tier's 8,000 tokens per minute.
 */
const MAX_COMPLETION_TOKENS = 5_000;

interface ChatCompletion {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/** Groq's code for a generation that did not match the schema; a retry can succeed. */
const JSON_VALIDATE_FAILED = "json_validate_failed";

/**
 * Groq's OpenAI-compatible chat API with structured outputs: the response JSON Schema is sent
 * as `response_format.json_schema`, and the manager still validates the result with Zod.
 */
export class GroqProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    readonly model: string = DEFAULT_GROQ_MODEL,
    private readonly fetchImpl: typeof fetch = fetch,
    /** Optional `reasoning_effort` for reasoning models; lower effort leaves room for the answer. */
    private readonly reasoningEffort?: string,
  ) {}

  /** Log identifier naming the model, for example "groq:qwen/qwen3.8-27b". */
  get id(): string {
    return `groq:${this.model}`;
  }

  /**
   * @returns raw JSON text from the model.
   * @throws ProviderError, classified from the HTTP status or abort state.
   */
  async generateJson({ system, prompt, jsonSchema, signal }: GenerateRequest): Promise<string> {
    try {
      const response = await this.fetchImpl(GROQ_CHAT_URL, {
        method: "POST",
        signal,
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          temperature: TEMPERATURE,
          max_completion_tokens: MAX_COMPLETION_TOKENS,
          ...(this.reasoningEffort ? { reasoning_effort: this.reasoningEffort } : {}),
          response_format: {
            type: "json_schema",
            json_schema: { name: "clausewise_output", schema: jsonSchema, strict: false },
          },
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        const kind = body.includes(JSON_VALIDATE_FAILED)
          ? "server"
          : kindFromStatus(response.status, body);
        throw new ProviderError(kind, `Groq returned ${response.status}: ${body}`);
      }
      const data = (await response.json()) as ChatCompletion;
      const choice = data.choices?.[0];
      if (choice?.finish_reason && choice.finish_reason !== "stop") {
        console.warn(
          `[ai] ${this.id} stopped early: ${choice.finish_reason}`,
          JSON.stringify(data.usage),
        );
      }
      const content = choice?.message?.content;
      if (!content) throw new ProviderError("server", "Groq returned an empty response");
      return content;
    } catch (error) {
      throw toProviderError(error, signal);
    }
  }

  /** Fetches model metadata, which confirms the key and model without generating. */
  async ping(signal: AbortSignal): Promise<void> {
    try {
      const response = await this.fetchImpl(
        `${GROQ_API_URL}/models/${encodeURIComponent(this.model)}`,
        {
          signal,
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );
      if (!response.ok) {
        throw new ProviderError(
          kindFromStatus(response.status),
          `Groq returned ${response.status}`,
        );
      }
    } catch (error) {
      throw toProviderError(error, signal);
    }
  }
}
