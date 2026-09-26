import {
  type AIProvider,
  type GenerateRequest,
  kindFromStatus,
  ProviderError,
  toProviderError,
} from "./provider";

/** Default model when GROQ_MODEL is unset. */
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEMPERATURE = 0.2;

interface ChatCompletion {
  choices?: { message?: { content?: string | null } }[];
}

/**
 * Groq's OpenAI-compatible chat API in JSON-object mode. Groq's JSON mode does not take a
 * schema, so the schema is embedded in the system message; the manager validates the result.
 */
export class GroqProvider implements AIProvider {
  readonly id = "groq";

  constructor(
    private readonly apiKey: string,
    readonly model: string = DEFAULT_GROQ_MODEL,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

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
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `${system}\n\nRespond with one JSON object that satisfies this JSON Schema:\n${JSON.stringify(jsonSchema)}`,
            },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new ProviderError(
          kindFromStatus(response.status, body),
          `Groq returned ${response.status}`,
        );
      }
      const data = (await response.json()) as ChatCompletion;
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new ProviderError("server", "Groq returned an empty response");
      return content;
    } catch (error) {
      throw toProviderError(error, signal);
    }
  }
}
