import { app } from './app.js'
import { config } from './config.js'
import { prisma } from './lib/prisma.js'

const server = app.listen(config.port, () => {
  console.log(`开心消消乐 API 已启动: http://localhost:${config.port}`)
})

async function shutdown() {
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
