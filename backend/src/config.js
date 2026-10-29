import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'

// 密钥有默认值是为了本地跑得起来；生产再用默认值等于谁都能伪造登录，所以直接拒绝启动
function secret(name, devFallback) {
  const value = process.env[name]
  if (value) return value
  if (isProd) {
    throw new Error(`生产环境缺少环境变量 ${name}`)
  }
  return devFallback
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: secret('JWT_ACCESS_SECRET', 'dev-access-secret'),
  jwtRefreshSecret: secret('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  // 前后端不同域名部署时设成 none，浏览器才会带上 refresh cookie（none 必须配 secure）
  cookieSameSite: process.env.COOKIE_SAMESITE ?? 'lax',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd,
}
