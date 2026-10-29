"use client"

import { useEffect, useState } from "react"
import { MODELS } from "../lib/models"
import { importFiles, listImported, removeDoc, toExtraDocs } from "../lib/clientStore"

const HINTS = ["21分怎么算", "正手怎么握拍", "球拍打多少磅", "上网步伐注意什么"]

export default function Page() {
  const [articles, setArticles] = useState([])
  const [imported, setImported] = useState([])
  const [question, setQuestion] = useState("")
  const [model, setModel] = useState(MODELS[0].id)
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  async function refreshImported() {
    setImported(await listImported())
  }

  useEffect(() => {
    fetch("/api/kb")
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []))
      .catch(() => setArticles([]))
    refreshImported()
  }, [])

  async function onImport(event) {
    const files = event.target.files
    if (!files?.length) return
    setImporting(true)
    setError("")
    try {
      await importFiles(files)
      await refreshImported()
    } catch (err) {
      setError(err.message || "导入失败")
    } finally {
      setImporting(false)
      event.target.value = ""
    }
  }

  async function ask(text) {
    const q = (text || question).trim()
    if (!q || loading) return
    setQuestion(q)
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const headers = { "Content-Type": "application/json" }
      if (apiKey.trim()) headers["x-user-api-key"] = apiKey.trim()
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          question: q,
          model,
          extraDocs: toExtraDocs(imported)
        })
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
    extract: "未填密钥，返回知识库原文",
    fallback: "模型失败，已回退到原文",
    empty: "没有命中资料"
  }

  return (
    <div className="wrap">
      <h1>羽毛球知识库</h1>
      <p className="desc">
        内置规则、握拍、步伐、器材。也可以导入自己的 md、txt 或图片。不填密钥只检索原文；填了密钥才调用模型，密钥只用于这一次请求。
      </p>
      <div className="layout">
        <aside className="panel">
          <h2>图文资料</h2>
          {articles.map((item) => (
            <div className="article" key={item.id}>
              {item.cover ? <img src={item.cover} alt={item.coverAlt || item.title} /> : <span className="muted">文本</span>}
              <div>
                <strong>{item.title}</strong>
                <div className="muted">{item.summary}</div>
              </div>
            </div>
          ))}
          <h2>导入文件</h2>
          <p className="muted">支持 md / txt / 图片。文件只存在你这台浏览器，不会写进服务器。</p>
          <input type="file" multiple accept=".md,.txt,image/*" onChange={onImport} disabled={importing} />
          <ul className="import-list">
            {imported.map((item) => (
              <li key={item.id}>
                <span>
                  {item.type === "article" ? "图文" : "文本"} · {item.title}
                </span>
                <button
                  className="ghost"
                  type="button"
                  onClick={async () => {
                    await removeDoc(item.id)
                    await refreshImported()
                  }}
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="box">
          <div className="warn">
            密钥不要填进地址栏，也不要存到笔记或截图里。本页只放在内存，刷新即消失。请求会经过本站服务器再转给模型，请用可随时作废的密钥，不要用公司生产密钥。
          </div>
          <div className="field">
            <label>临时模型</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {MODELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>自己的 API Key（可选）</label>
            <input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="只用于本次问答，不保存"
            />
          </div>
          <div className="hints">
            {HINTS.map((item) => (
              <button key={item} type="button" onClick={() => ask(item)}>
                {item}
              </button>
            ))}
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="问规则、握拍、步伐、球拍磅数，或针对你导入的资料提问"
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
                  {result.sources.map((s) => (
                    <div className="source-card" key={`${s.file}-${s.title}`}>
                      {s.cover ? <img src={s.cover} alt={s.coverAlt || s.title} /> : <span>文本</span>}
                      <div>来源：{s.title}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </div>
  )
}
