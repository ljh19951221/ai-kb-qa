import fs from "fs"
import path from "path"

const CONTENT_DIR = path.join(process.cwd(), "content")

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    const title = (raw.match(/^#\s+(.+)$/m) || [null, ""])[1]
    return { meta: { title, type: "text", cover: "", coverAlt: "" }, body: raw }
  }
  const meta = { title: "", type: "text", cover: "", coverAlt: "" }
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":")
    if (idx < 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "")
    if (key in meta) meta[key] = value
  }
  return { meta, body: match[2] }
}

export function loadDocs() {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, name), "utf8")
      const { meta, body } = parseFrontmatter(raw)
      const title = meta.title || (body.match(/^#\s+(.+)$/m) || [null, name])[1]
      return {
        id: name,
        name,
        title,
        type: meta.type === "article" ? "article" : "text",
        cover: meta.cover || "",
        coverAlt: meta.coverAlt || "",
        raw: body
      }
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

function splitParts(raw) {
  const parts = String(raw || "").split(/\n(?=##\s)/)
  return parts.map((part) => part.trim()).filter((part) => part.length >= 12)
}

export function retrieve(query, extraDocs = [], limit = 4) {
  const queryTokens = tokenize(query)
  if (!queryTokens.length) return []

  const docs = [
    ...loadDocs(),
    ...extraDocs.map((doc, index) => ({
      id: doc.id || `import-${index}`,
      name: doc.id || `import-${index}`,
      title: String(doc.title || "导入资料").slice(0, 80),
      type: doc.type === "article" ? "article" : "text",
      cover: "",
      coverAlt: String(doc.coverAlt || "").slice(0, 80),
      raw: String(doc.text || "").slice(0, 8000)
    }))
  ]

  const scored = []
  for (const doc of docs) {
    for (const part of splitParts(doc.raw)) {
      const score = scoreChunk(`${doc.title}\n${doc.coverAlt}\n${part}`, queryTokens)
      if (score > 0) {
        scored.push({
          file: doc.name,
          title: doc.title,
          type: doc.type,
          cover: doc.cover,
          coverAlt: doc.coverAlt,
          score,
          text: part.slice(0, 1200)
        })
      }
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

export function listArticles() {
  return loadDocs().map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    cover: doc.cover,
    coverAlt: doc.coverAlt,
    summary: splitParts(doc.raw)[0]?.replace(/^#.+\n/, "").slice(0, 80) || ""
  }))
}
