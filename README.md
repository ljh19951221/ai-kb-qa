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

## 部署到 Vercel（按控制台菜单）

仓库已在 GitHub：https://github.com/ljh19951221/ai-kb-qa

你截图里点的是右上角 **Create New / 创建新项**。这里要选 **Project / 项目**，不要选 Domain / 域名（域名是给已经上线的项目绑自己的域名用的）。

1. 点 **Project / 项目**
2. 若提示连接 GitHub，选 Authorize / 授权，并确保能看到账号 `ljh19951221`
3. Import 仓库 **ai-kb-qa**（找不到就点 Adjust GitHub App Permissions，把这个仓库勾上）
4. 确认：
   - Framework Preset：Next.js
   - Root Directory：`./`（不要改成别的文件夹）
   - Build Command：`next build`（默认即可）
   - Output：Next 不用填静态目录
   - Node.js Version：选 **20.x 或 24.x**（团队已提示 2026-10-01 起低于 20 会构建失败）
5. 先不要填环境变量也可以点 **Deploy**。部署成功后会得到类似 `https://ai-kb-qa-xxx.vercel.app` 的地址，打开能提问即成功。
6. 若要用模型组织回答：项目页 → **Settings / 设置** → **Environment Variables / 环境变量**，增加 `OPENAI_API_KEY`，然后 Redeploy 一次。不填密钥时页面仍可用，只返回知识库原文。

之后每次往 `master` 推代码，Vercel 会自动再部署。

Netlify 也能跑 Next，但函数配置更麻烦，这个项目优先 Vercel。

## 改知识库

直接改 `content/*.md`。按 `## 小标题` 分段，检索会按段打分。不要把公司未公开的内部表结构、密钥写进来。
