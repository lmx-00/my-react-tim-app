import { PrismaClient } from '@prisma/client'
import { LEVELS } from '../src/game/levels.js'

const prisma = new PrismaClient()

async function main() {
  const size = 40
  for (let start = 0; start < LEVELS.length; start += size) {
    const chunk = LEVELS.slice(start, start + size)
    await prisma.$transaction(
      chunk.map((level) =>
        prisma.level.upsert({
          where: { id: level.id },
          update: level,
          create: level,
        }),
      ),
    )
  }
  console.log(`已写入 ${LEVELS.length} 个关卡`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
