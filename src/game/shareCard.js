import { levelIcon } from './levelIcon.js'
import { MONSTER_RECIPES } from './monsters.js'

const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif'
const TILE = {
  bear: '#f3e0c8',
  cat: '#ffd6e8',
  fox: '#ffe0a8',
  frog: '#d4f5b0',
  chick: '#fff4b8',
  owl: '#ccecff',
}
const ANIMALS = ['bear', 'cat', 'fox', 'frog', 'chick', 'owl']
const images = new Map()

function loadImage(src) {
  const hit = images.get(src)
  if (hit) return hit
  const pending = new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图没加载出来'))
    image.src = src
  })
  images.set(src, pending)
  return pending
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

async function drawMonster(ctx, type, x, y, size) {
  const recipe = MONSTER_RECIPES[type]
  if (!recipe) return
  const parts = [...recipe].sort((a, b) => (a.z ?? 3) - (b.z ?? 3))
  ctx.save()
  ctx.translate(x, y)
  for (const part of parts) {
    try {
      const image = await loadImage(`/monsters/${part.src}.png`)
      const w = (part.w / 100) * size
      const h = image.height * (w / image.width)
      const px = (part.x / 100) * size
      const py = (part.y / 100) * size
      ctx.save()
      ctx.translate(px + w / 2, py + h / 2)
      if (part.flip) ctx.scale(-1, 1)
      if (part.rotate) ctx.rotate((part.rotate * Math.PI) / 180)
      ctx.drawImage(image, -w / 2, -h / 2, w, h)
      ctx.restore()
    } catch {
      // 缺一张零件就跳过，整只小动物还是能看
    }
  }
  ctx.restore()
}

function blobFromCanvas(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('图没生成出来'))
      else resolve(blob)
    }, 'image/jpeg', quality)
  })
}

function facesFor(level) {
  const main = levelIcon(level)
  const index = Math.max(0, ANIMALS.indexOf(main))
  return [
    ANIMALS[(index + ANIMALS.length - 1) % ANIMALS.length],
    ANIMALS[index],
    ANIMALS[(index + 1) % ANIMALS.length],
  ]
}

export async function makeShareCard(session, playerName = '') {
  const scale = 2
  const width = 720
  const height = 900
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)
  ctx.textBaseline = 'alphabetic'

  const won = session.status === 'won'
  const daily = Number(session.level?.id) === 0
  const where = daily ? '每日挑战' : `第 ${session.level.id} 关`
  const title = won ? '过关成功' : '差一点点'
  const stars = won ? Number(session.stars ?? 0) : 0

  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#ffd0ea')
  sky.addColorStop(0.5, '#ffb7df')
  sky.addColorStop(1, '#ffe7c4')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  for (const [x, y, r, color] of [
    [90, 70, 86, 'rgba(255,255,255,0.38)'],
    [640, 110, 64, 'rgba(255,255,255,0.28)'],
    [70, 830, 100, 'rgba(255,142,196,0.26)'],
    [660, 790, 88, 'rgba(255,231,196,0.5)'],
  ]) {
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.save()
  ctx.shadowColor = 'rgba(190, 70, 120, 0.16)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 10
  roundRect(ctx, 48, 48, 624, 804, 40)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#e24b93'
  ctx.font = `800 20px ${FONT}`
  ctx.fillText('开心消消乐', width / 2, 104)

  ctx.fillStyle = '#5c2a42'
  ctx.font = `800 46px ${FONT}`
  ctx.fillText(title, width / 2, 164)

  ctx.fillStyle = '#a56d86'
  ctx.font = `700 22px ${FONT}`
  ctx.fillText(where, width / 2, 206)

  ctx.fillStyle = '#5c2a42'
  ctx.font = `800 28px ${FONT}`
  ctx.fillText(session.level?.name || '', width / 2, 246)

  const faces = facesFor(session.level)
  const tileSize = 132
  const gap = 18
  const rowW = faces.length * tileSize + (faces.length - 1) * gap
  const startX = (width - rowW) / 2
  const tileY = 286
  for (let i = 0; i < faces.length; i += 1) {
    const type = faces[i]
    const x = startX + i * (tileSize + gap)
    roundRect(ctx, x, tileY, tileSize, tileSize, 28)
    ctx.fillStyle = TILE[type] ?? '#fff0f7'
    ctx.fill()
    await drawMonster(ctx, type, x + 8, tileY + 4, tileSize - 16)
  }

  ctx.fillStyle = '#5c2a42'
  ctx.font = `800 92px ${FONT}`
  ctx.fillText(String(session.score ?? 0), width / 2, 560)
  ctx.fillStyle = '#a56d86'
  ctx.font = `800 22px ${FONT}`
  ctx.fillText('分', width / 2, 598)

  ctx.font = `800 44px ${FONT}`
  const starGap = 58
  const starStart = width / 2 - starGap
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < stars ? '#f5b301' : '#f3d0e0'
    ctx.fillText('★', starStart + i * starGap, 670)
  }

  if (playerName) {
    ctx.fillStyle = '#a56d86'
    ctx.font = `700 20px ${FONT}`
    ctx.fillText(`${playerName} 的战绩`, width / 2, 740)
  }

  ctx.fillStyle = '#e24b93'
  ctx.font = `800 16px ${FONT}`
  ctx.fillText('开心消消乐', width / 2, 804)

  let blob = await blobFromCanvas(canvas, 0.86)
  if (blob.size > 1.4 * 1024 * 1024) blob = await blobFromCanvas(canvas, 0.7)
  if (blob.size > 1.4 * 1024 * 1024) throw new Error('照片太大了')
  return blob
}
