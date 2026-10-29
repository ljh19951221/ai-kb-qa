import { retrieve } from "../../../lib/kb"
import { resolveModel, sanitizeError } from "../../../lib/models"

export const runtime = "nodejs"

const MAX_EXTRAS = 8
const MAX_QUESTION = 500

function buildPrompt(question, hits) {
  const context = hits
    .map((h, i) => {
      const imageNote = h.coverAlt ? `\n配图说明：${h.coverAlt}` : ""
      return `【资料${i + 1}｜${h.title}】${imageNote}\n${h.text}`
    })
    .join("\n\n")
  return `你是羽毛球知识库助教。只根据下面资料回答。
资料不够就说「知识库里没写到」。用口语短句，不要用「首先/其次/综上所述」。

资料：
${context}

用户问题：${question}`
}

function readUserKey(request) {
  const header = request.headers.get("x-user-api-key") || ""
  const key = header.trim()
  if (!key) return ""
  if (key.length < 20 || key.length > 200) return ""
  return key
}

async function askModel(prompt, { apiKey, modelId }) {
  if (!apiKey) return null
  const model = resolveModel(modelId)
  const res = await fetch(`${model.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model.id,
      temperature: 0.2,
      messages: [
        { role: "system", content: "按资料回答羽毛球问题，不编造。" },
        { role: "user", content: prompt }
      ]
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`模型接口 ${res.status}: ${sanitizeError(errText)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ""
}

export async function POST(request) {
  try {
    const apiKey = readUserKey(request)
    const body = await request.json()
    const question = String(body.question || "").trim().slice(0, MAX_QUESTION)
    const modelId = String(body.model || "")
    const extraDocs = Array.isArray(body.extraDocs) ? body.extraDocs.slice(0, MAX_EXTRAS) : []

    if (!question) {
      return Response.json({ ok: false, error: "请输入问题" }, { status: 400 })
    }

    const hits = retrieve(question, extraDocs, 4)
    if (!hits.length) {
      return Response.json({
        ok: true,
        mode: "empty",
        answer: "知识库里没有搜到相关段落。可以换个说法，比如「21分怎么算」「正手怎么握拍」「球拍磅数」。",
        sources: []
      })
    }

    let answer = ""
    let mode = "extract"
    try {
      const generated = await askModel(buildPrompt(question, hits), { apiKey, modelId })
      if (generated) {
        answer = generated
        mode = "model"
      }
    } catch (err) {
      answer = `模型暂时不可用（${sanitizeError(err.message)}）。下面是知识库原文，请自己对照。\n\n${hits
        .map((h, i) => `${i + 1}. ${h.text}`)
        .join("\n\n")}`
      mode = "fallback"
    }

    if (!answer) {
      answer = hits.map((h, i) => `${i + 1}. ${h.text}`).join("\n\n")
    }

    return Response.json({
      ok: true,
      mode,
      answer,
      sources: hits.map((h) => ({
        title: h.title,
        file: h.file,
        type: h.type,
        cover: h.cover,
        coverAlt: h.coverAlt,
        score: h.score
      }))
    })
  } catch (err) {
    return Response.json({ ok: false, error: sanitizeError(err.message) || "服务异常" }, { status: 500 })
  }
}
