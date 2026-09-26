import { GoogleGenAI, type ThinkingConfig, ThinkingLevel } from "@google/genai";
import { type AIProvider, type GenerateRequest, ProviderError, toProviderError } from "./provider";

/** Default model when GEMINI_MODEL is unset. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
/** Low temperature: extraction and classification, not creative writing. */
const TEMPERATURE = 0.2;
/**
 * Thinking is kept to the minimum: the tasks are extraction and classification against a
 * strict schema, hidden reasoning roughly doubles latency, and grounding is checked
 * independently by the evidence verifier. Gemini 2.5 takes a token budget; later models take
 * a level.
 */
function minimalThinking(model: string): ThinkingConfig {
  return model.startsWith("gemini-2.5")
    ? { thinkingBudget: 0 }
    : { thinkingLevel: ThinkingLevel.MINIMAL };
}

/**
 * Google Gemini via the official SDK, using JSON mode with a response schema. Output is
 * streamed so the manager's idle timeout measures silence, not total generation time.
 */
export class GeminiProvider implements AIProvider {
  readonly id: string;
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    readonly model: string = DEFAULT_GEMINI_MODEL,
  ) {
    this.id = `gemini:${model}`;
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * @returns raw JSON text from the model.
   * @throws ProviderError, classified from the HTTP status or abort state.
   */
  async generateJson({
    system,
    prompt,
    jsonSchema,
    signal,
    onActivity,
  }: GenerateRequest): Promise<string> {
    try {
      const stream = await this.client.models.generateContentStream({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          temperature: TEMPERATURE,
          thinkingConfig: minimalThinking(this.model),
          abortSignal: signal,
        },
      });
      let text = "";
      for await (const chunk of stream) {
        text += chunk.text ?? "";
        onActivity?.();
      }
      if (!text) throw new ProviderError("server", "Gemini returned an empty response");
      return text;
    } catch (error) {
      throw toProviderError(error, signal);
    }
  }

  /** Fetches model metadata, which confirms the key and model without generating. */
  async ping(signal: AbortSignal): Promise<void> {
    try {
      await this.client.models.get({ model: this.model, config: { abortSignal: signal } });
    } catch (error) {
      throw toProviderError(error, signal);
    }
  }
}
