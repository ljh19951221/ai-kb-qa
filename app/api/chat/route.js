import { retrieve } from "../../../lib/kb"

export const runtime = "nodejs"

function buildPrompt(question, hits) {
  const context = hits
    .map((h, i) => `【资料${i + 1}｜${h.title}】\n${h.text}`)
    .join("\n\n")
  return `你是知识库客服。只根据下面资料回答，不要编资料里没有的政策、价格、到账时间。
资料不够就说「知识库里没写到，建议转人工」。用口语短句，不要用「首先/其次/综上所述」。

资料：
${context}

用户问题：${question}`
}

async function askModel(prompt) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "按用户给的资料回答，不编造。" },
        { role: "user", content: prompt }
      ]
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`模型接口 ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ""
}

export async function POST(request) {
  try {
    const body = await request.json()
    const question = String(body.question || "").trim()
    if (!question) {
      return Response.json({ ok: false, error: "请输入问题" }, { status: 400 })
    }

    const hits = retrieve(question, 4)
    if (!hits.length) {
      return Response.json({
        ok: true,
        mode: "empty",
        answer: "知识库里没有搜到相关段落。可以换个说法，比如「怎么退款」「套餐怎么买」「实名失败」。",
        sources: []
      })
    }

    let answer = ""
    let mode = "extract"
    try {
      const generated = await askModel(buildPrompt(question, hits))
      if (generated) {
        answer = generated
        mode = "model"
      }
    } catch (err) {
      answer = `模型暂时不可用（${err.message}）。下面是知识库原文摘录，请人工核对。\n\n${hits
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
      sources: hits.map((h) => ({ title: h.title, file: h.file, score: h.score }))
    })
  } catch (err) {
    return Response.json({ ok: false, error: err.message || "服务异常" }, { status: 500 })
  }
}
