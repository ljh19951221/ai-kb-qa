/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/chat": ["./content/**/*.md"]
    }
  }
}

module.exports = nextConfig
