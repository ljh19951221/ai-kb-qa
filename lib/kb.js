import fs from "fs"
import path from "path"

const CONTENT_DIR = path.join(process.cwd(), "content")

export function loadDocs() {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, name), "utf8")
      const title = (raw.match(/^#\s+(.+)$/m) || [null, name])[1]
      return { name, title, raw }
    })
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/i)
    .filter((w) => w.length >= 2)
}

function scoreChunk(chunk, queryTokens) {
  const hay = chunk.toLowerCase()
  let score = 0
  for (const token of queryTokens) {
    if (hay.includes(token)) score += token.length > 3 ? 2 : 1
  }
  return score
}

export function retrieve(query, limit = 4) {
  const docs = loadDocs()
  const queryTokens = tokenize(query)
  if (!queryTokens.length) return []

  const scored = []
  for (const doc of docs) {
    const parts = doc.raw.split(/\n(?=##\s)/)
    for (const part of parts) {
      const chunk = part.trim()
      if (chunk.length < 20) continue
      const score = scoreChunk(chunk, queryTokens)
      if (score > 0) {
        scored.push({
          file: doc.name,
          title: doc.title,
          score,
          text: chunk.slice(0, 1200)
        })
      }
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
