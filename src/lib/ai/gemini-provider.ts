import { GoogleGenAI } from "@google/genai";
import { type AIProvider, type GenerateRequest, ProviderError, toProviderError } from "./provider";

/** Default model when GEMINI_MODEL is unset. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
/** Low temperature: extraction and classification, not creative writing. */
const TEMPERATURE = 0.2;

/** Google Gemini via the official SDK, using JSON mode with a response schema. */
export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    readonly model: string = DEFAULT_GEMINI_MODEL,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * @returns raw JSON text from the model.
   * @throws ProviderError, classified from the HTTP status or abort state.
   */
  async generateJson({ system, prompt, jsonSchema, signal }: GenerateRequest): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          temperature: TEMPERATURE,
          abortSignal: signal,
        },
      });
      const text = response.text;
      if (!text) throw new ProviderError("server", "Gemini returned an empty response");
      return text;
    } catch (error) {
      throw toProviderError(error, signal);
    }
  }
}
