import "./globals.css"

export const metadata = {
  title: "羽毛球知识库",
  description: "检索羽毛球资料，可临时使用自己的模型密钥"
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
