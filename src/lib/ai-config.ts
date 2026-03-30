function normalizeModelName(model: string): string {
  if (model.startsWith("openrouter/")) {
    return model.slice("openrouter/".length);
  }
  if (model.startsWith("OpenRouter/")) {
    return model.slice("OpenRouter/".length);
  }
  return model;
}

const rawApiKey =
  process.env.OPENAI_API_KEY ||
  process.env.OPENROUTER_API_KEY ||
  process.env.AI_API_KEY ||
  "";

const rawBaseUrl =
  process.env.OPENAI_BASE_URL ||
  process.env.OPENROUTER_BASE_URL ||
  process.env.AI_BASE_URL ||
  "https://api.openai.com/v1";

const rawModel =
  process.env.OPENAI_MODEL ||
  process.env.OPENROUTER_MODEL ||
  process.env.AI_MODEL ||
  "gpt-4o-mini";

export const AI_CONFIG = {
  apiKey: rawApiKey,
  baseUrl: rawBaseUrl,
  model: normalizeModelName(rawModel),
};

export function isAIEnabled(): boolean {
  return AI_CONFIG.apiKey.length > 0;
}
