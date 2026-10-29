"use client"

import { useState } from "react"

const HINTS = ["怎么退款", "提现多久到账", "实名失败怎么办", "完成率怎么算"]

export default function Page() {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  async function ask(text) {
    const q = (text || question).trim()
    if (!q || loading) return
    setQuestion(q)
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || "请求失败")
        return
      }
      setResult(data)
    } catch (err) {
      setError(err.message || "网络异常")
    } finally {
      setLoading(false)
    }
  }

  const modeText = {
    model: "模型根据资料组织回答",
    extract: "未配置密钥，返回知识库原文",
    fallback: "模型失败，已回退到原文",
    empty: "没有命中资料"
  }

  return (
    <div className="wrap">
      <h1>知识库问答</h1>
      <p className="desc">
        先在本地 Markdown 里检索，再视情况调用模型。资料没有的内容不会硬编。可以用来做客服口径或项目说明查询。
      </p>
      <div className="hints">
        {HINTS.map((item) => (
          <button key={item} type="button" onClick={() => ask(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="box">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="输入问题，例如：未激活的套餐怎么退？"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              ask()
            }
          }}
        />
        <div className="row">
          <span className="mode">{result ? modeText[result.mode] || "" : "Enter 发送"}</span>
          <button className="send" type="button" disabled={loading} onClick={() => ask()}>
            {loading ? "查询中" : "发送"}
          </button>
        </div>
        {error ? <div className="answer">{error}</div> : null}
        {result ? (
          <>
            <div className="answer">{result.answer}</div>
            {result.sources?.length ? (
              <div className="sources">
                来源：{result.sources.map((s) => s.title).join("、")}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
