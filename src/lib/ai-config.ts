export const AI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
}

export function isAIEnabled(): boolean {
  return AI_CONFIG.apiKey.length > 0
}
