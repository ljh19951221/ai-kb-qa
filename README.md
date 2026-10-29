# 知识库问答（Next.js / Node.js）

把 `content/` 里的 Markdown 做成问答页。接口在 `app/api/chat/route.js`。

- 没配密钥：只做检索，返回相关段落
- 配了 `OPENAI_API_KEY`：用检索结果让模型组织回答，资料没有的内容要求说转人工

## 本地运行

```bash
cd D:\object\ai-kb-qa
npm install
copy .env.example .env.local
npm run dev
```

浏览器打开 http://localhost:3000

## 部署到 Vercel（免费）

1. 把本目录推到 GitHub / Gitee（不要提交 `.env.local`）
2. 打开 https://vercel.com ，用 GitHub 登录，Import 这个仓库
3. Framework 选 Next.js，构建命令默认 `next build` 即可
4. 若要用模型回答，在 Vercel → Settings → Environment Variables 里加 `OPENAI_API_KEY`（可选 `OPENAI_BASE_URL`、`OPENAI_MODEL`）
5. Deploy 完成后会给 `https://xxx.vercel.app`

Netlify 也能跑 Next，但 Serverless 函数配置比 Vercel 麻烦，这个项目优先 Vercel。

## 改知识库

直接改 `content/*.md`。按 `## 小标题` 分段，检索会按段打分。不要把公司未公开的内部表结构、密钥写进来。
