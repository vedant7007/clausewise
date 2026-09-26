import "server-only";
import { AIManager } from "./ai-manager";
import { GeminiProvider } from "./gemini-provider";
import { GroqProvider } from "./groq-provider";
import type { AIProvider } from "./provider";

/**
 * Builds providers from whichever keys are set. Gemini is primary when present; any second
 * configured provider becomes the fallback.
 * @param env - environment variables, injectable for tests.
 * @returns providers in fallback order; empty when no key is configured.
 */
export function providersFromEnv(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AIProvider[] {
  const providers: AIProvider[] = [];
  if (env.GEMINI_API_KEY) {
    providers.push(new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL || undefined));
  }
  if (env.GROQ_API_KEY) {
    providers.push(new GroqProvider(env.GROQ_API_KEY, env.GROQ_MODEL || undefined));
  }
  return providers;
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
