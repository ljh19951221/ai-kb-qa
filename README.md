# 羽毛球知识库问答

Next.js + Node.js API。内置羽毛球图文资料；可导入 md / txt / 图片；可临时选择模型并粘贴自己的 Key。

线上：https://ai-kb-qa.vercel.app/

## 安全说明（Key）

- Key 放在请求头 `x-user-api-key`，服务端不落库、不写日志。
- 前端只放在内存，刷新页面即消失，不写 localStorage。
- 模型地址写死在服务端白名单，前端不能指定任意 URL（避免 SSRF）。
- 导入文件只存在浏览器 IndexedDB，不上传原文件到服务器；问答时只传文本摘要。
- 请用可随时作废的个人密钥，不要用公司生产密钥。

## 本地运行

```bash
cd D:\object\ai-kb-qa
npm install
npm run dev
```

打开 http://localhost:3000
