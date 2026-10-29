export const MODELS = [
  {
    id: "gpt-4o-mini",
    label: "OpenAI GPT-4o mini",
    baseUrl: "https://api.openai.com/v1"
  },
  {
    id: "gpt-4o",
    label: "OpenAI GPT-4o",
    baseUrl: "https://api.openai.com/v1"
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Groq Llama 3.1 8B",
    baseUrl: "https://api.groq.com/openai/v1"
  }
]

export function resolveModel(modelId) {
  return MODELS.find((item) => item.id === modelId) || MODELS[0]
}

export function sanitizeError(text) {
  return String(text || "")
    .replace(/sk-[a-zA-Z0-9_-]+/g, "sk-***")
    .replace(/gsk_[a-zA-Z0-9_-]+/g, "gsk_***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***")
    .slice(0, 240)
}
