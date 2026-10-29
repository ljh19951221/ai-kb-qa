import "./globals.css"

export const metadata = {
  title: "知识库问答",
  description: "把 Markdown 知识库做成可检索的问答页"
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
