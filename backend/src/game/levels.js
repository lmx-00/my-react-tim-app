const CRAFTED = [
  { id: 1, name: '初入森林', rows: 8, cols: 8, colorCount: 4, moveLimit: 22, goalType: 'score', goalPayload: { score: 900 }, twoStarMoves: 8, threeStarMoves: 12 },
  { id: 2, name: '小试牛刀', rows: 8, cols: 8, colorCount: 5, moveLimit: 24, goalType: 'score', goalPayload: { score: 1600 }, twoStarMoves: 7, threeStarMoves: 12 },
  { id: 3, name: '收集小熊', rows: 8, cols: 8, colorCount: 6, moveLimit: 20, goalType: 'collect', goalPayload: { bear: 10 }, twoStarMoves: 7, threeStarMoves: 12 },
  { id: 4, name: '双色收集', rows: 8, cols: 8, colorCount: 6, moveLimit: 22, goalType: 'collect', goalPayload: { bear: 13, cat: 11 }, twoStarMoves: 6, threeStarMoves: 9 },
  { id: 5, name: '步数压力', rows: 8, cols: 8, colorCount: 6, moveLimit: 16, goalType: 'score', goalPayload: { score: 1350 }, twoStarMoves: 4, threeStarMoves: 8 },
  { id: 6, name: '七乘七', rows: 7, cols: 7, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 1450 }, twoStarMoves: 4, threeStarMoves: 9 },
  { id: 7, name: '青蛙派对', rows: 8, cols: 8, colorCount: 6, moveLimit: 20, goalType: 'collect', goalPayload: { frog: 13 }, twoStarMoves: 6, threeStarMoves: 10 },
  { id: 8, name: '连锁高手', rows: 8, cols: 8, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 1650 }, twoStarMoves: 3, threeStarMoves: 10 },
  { id: 9, name: '彩虹入门', rows: 8, cols: 8, colorCount: 6, moveLimit: 22, goalType: 'score', goalPayload: { score: 1950 }, twoStarMoves: 6, threeStarMoves: 11 },
  { id: 10, name: '十关挑战', rows: 8, cols: 8, colorCount: 6, moveLimit: 16, goalType: 'collect', goalPayload: { fox: 8, chick: 8 }, twoStarMoves: 5, threeStarMoves: 9 },
  { id: 11, name: '密林深处', rows: 8, cols: 8, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 1650 }, twoStarMoves: 5, threeStarMoves: 8 },
  { id: 12, name: '猫头鹰夜', rows: 8, cols: 8, colorCount: 6, moveLimit: 20, goalType: 'collect', goalPayload: { owl: 13 }, twoStarMoves: 6, threeStarMoves: 10 },
  { id: 13, name: '步步惊心', rows: 8, cols: 8, colorCount: 6, moveLimit: 16, goalType: 'score', goalPayload: { score: 1700 }, twoStarMoves: 3, threeStarMoves: 7 },
  { id: 14, name: '猫狐同盟', rows: 8, cols: 8, colorCount: 6, moveLimit: 20, goalType: 'collect', goalPayload: { cat: 11, fox: 13 }, twoStarMoves: 4, threeStarMoves: 8 },
  { id: 15, name: '分数冲刺', rows: 8, cols: 8, colorCount: 6, moveLimit: 16, goalType: 'score', goalPayload: { score: 1750 }, twoStarMoves: 3, threeStarMoves: 6 },
  { id: 16, name: '小鸡快跑', rows: 7, cols: 7, colorCount: 6, moveLimit: 16, goalType: 'collect', goalPayload: { chick: 12 }, twoStarMoves: 4, threeStarMoves: 7 },
  { id: 17, name: '连锁风暴', rows: 8, cols: 8, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 2100 }, twoStarMoves: 3, threeStarMoves: 8 },
  { id: 18, name: '熊蛙同行', rows: 8, cols: 8, colorCount: 6, moveLimit: 16, goalType: 'collect', goalPayload: { frog: 10, bear: 10 }, twoStarMoves: 4, threeStarMoves: 7 },
  { id: 19, name: '高压得分', rows: 8, cols: 8, colorCount: 6, moveLimit: 16, goalType: 'score', goalPayload: { score: 1850 }, twoStarMoves: 3, threeStarMoves: 7 },
  { id: 20, name: '二十关试炼', rows: 8, cols: 8, colorCount: 6, moveLimit: 18, goalType: 'collect', goalPayload: { fox: 11, chick: 12 }, twoStarMoves: 5, threeStarMoves: 8 },
  { id: 21, name: '宽棋盘', rows: 8, cols: 9, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 2050 }, twoStarMoves: 3, threeStarMoves: 8 },
  { id: 22, name: '夜猫双重', rows: 8, cols: 9, colorCount: 6, moveLimit: 18, goalType: 'collect', goalPayload: { owl: 11, cat: 11 }, twoStarMoves: 4, threeStarMoves: 8 },
  { id: 23, name: '极限得分', rows: 8, cols: 8, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 2200 }, twoStarMoves: 3, threeStarMoves: 8 },
  { id: 24, name: '熊口夺食', rows: 8, cols: 9, colorCount: 6, moveLimit: 18, goalType: 'collect', goalPayload: { bear: 15 }, twoStarMoves: 4, threeStarMoves: 8 },
  { id: 25, name: '高难冲分', rows: 8, cols: 8, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 2150 }, twoStarMoves: 3, threeStarMoves: 7 },
  { id: 26, name: '三色收集', rows: 8, cols: 9, colorCount: 6, moveLimit: 18, goalType: 'collect', goalPayload: { frog: 12, fox: 12, chick: 12 }, twoStarMoves: 2, threeStarMoves: 7 },
  { id: 27, name: '十八步决', rows: 8, cols: 8, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 2150 }, twoStarMoves: 3, threeStarMoves: 8 },
  { id: 28, name: '宽屏高压', rows: 8, cols: 9, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 2250 }, twoStarMoves: 3, threeStarMoves: 7 },
  { id: 29, name: '三军集结', rows: 8, cols: 9, colorCount: 6, moveLimit: 18, goalType: 'collect', goalPayload: { bear: 12, cat: 13, fox: 11 }, twoStarMoves: 3, threeStarMoves: 6 },
  { id: 30, name: '最终挑战', rows: 8, cols: 9, colorCount: 6, moveLimit: 18, goalType: 'score', goalPayload: { score: 2250 }, twoStarMoves: 3, threeStarMoves: 8 },
]

export const CHAPTER_SIZE = 20
export const LEVEL_COUNT = 1000
export const DAILY_LEVEL_ID = 0

export function isDailyLevel(id) {
  return Number(id) === DAILY_LEVEL_ID
}

export function localDayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const ANIMALS = ['bear', 'cat', 'fox', 'frog', 'chick', 'owl']
const CHAPTERS = [
  '森林', '溪谷', '花园', '果园', '雪山', '沙漠', '海边', '星空',
  '城堡', '迷宫', '云端', '熔岩', '竹林', '月夜', '彩虹', '龙巢',
]
const SPOTS = [
  '小径', '木桥', '花田', '泉眼', '石阶', '树屋', '风车', '灯塔',
  '码头', '洞窟', '草原', '瀑布', '钟楼', '集市', '温室', '驿站',
  '浅滩', '哨所', '果岭', '终点',
]

function otherAnimal(id, first) {
  const next = ANIMALS[(id + 2) % ANIMALS.length]
  return next === first ? ANIMALS[(id + 3) % ANIMALS.length] : next
}

function buildLevel(id) {
  const chapter = Math.floor((id - 1) / CHAPTER_SIZE)
  const spot = (id - 1) % CHAPTER_SIZE
  const theme = CHAPTERS[chapter % CHAPTERS.length]
  const round = Math.floor(chapter / CHAPTERS.length) + 1
  const breath = spot % 5 === 4
  const boss = spot === CHAPTER_SIZE - 1
  const wide = boss || spot % 7 === 6
  const small = !wide && spot % 11 === 10

  let rows = 8
  let cols = 8
  if (small) {
    rows = 7
    cols = 7
  } else if (wide && id > 200) {
    cols = 9
  }
  if (boss && id > 600) {
    rows = 9
    cols = 9
  }

  const animal = ANIMALS[id % ANIMALS.length]
  const extra = Math.min(6, Math.floor(id / 160))
  const pattern = id % 5
  let goalType = 'score'
  let goalPayload
  let moveLimit = breath ? 24 : boss ? 20 : 22

  if (id >= 40 && pattern === 2) {
    goalType = 'ice'
    goalPayload = { ice: true }
    moveLimit += 2
  } else if (id >= 50 && pattern === 4) {
    goalType = 'crate'
    goalPayload = { crate: true }
    moveLimit += 2
  } else if (pattern === 1 || pattern === 3) {
    goalType = 'collect'
    const count = Math.min(16, (breath ? 8 : 10) + extra + (boss ? 2 : 0))
    if (pattern === 3) {
      const each = Math.max(6, count - 4)
      goalPayload = { [animal]: each, [otherAnimal(id, animal)]: each }
      moveLimit += 2
    } else {
      goalPayload = { [animal]: count }
    }
  } else {
    const score = Math.min(2800, 1500 + Math.floor(id / 10) * 12 + (boss ? 180 : 0) - (breath ? 220 : 0))
    goalPayload = { score: Math.max(1300, score) }
  }

  if (cols >= 9 || rows >= 9) moveLimit += 2
  moveLimit = Math.max(16, moveLimit - Math.min(4, Math.floor((id - 30) / 250)))

  const threeStarMoves = Math.max(4, Math.round(moveLimit * 0.38))
  const twoStarMoves = Math.max(2, Math.min(threeStarMoves - 2, Math.round(moveLimit * 0.2)))
  const prefix = round === 1 ? theme : `${theme}${round}`

  return {
    id,
    name: `${prefix}${SPOTS[spot]}`,
    rows,
    cols,
    colorCount: 6,
    moveLimit,
    goalType,
    goalPayload,
    twoStarMoves,
    threeStarMoves,
  }
}

export const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, index) => {
  const id = index + 1
  return id <= CRAFTED.length ? CRAFTED[index] : buildLevel(id)
})

const BY_ID = new Map(LEVELS.map((level) => [level.id, level]))

export const MAX_LEVEL_ID = LEVEL_COUNT

function hashDay(key) {
  let n = 2166136261
  for (let i = 0; i < key.length; i += 1) n = Math.imul(n ^ key.charCodeAt(i), 16777619)
  return n >>> 0
}

export function dailyLevel(now = new Date()) {
  const dailyKey = localDayKey(now)
  const seed = hashDay(dailyKey)
  const templateId = 50 + (seed % 120)
  const base = buildLevel(templateId)
  return {
    ...base,
    id: DAILY_LEVEL_ID,
    name: '每日挑战',
    obstacleLevel: templateId,
    dailyKey,
  }
}

export function getLevelConfig(id) {
  if (isDailyLevel(id)) return dailyLevel()
  return BY_ID.get(Number(id)) ?? null
}

export function countIceLayers(board) {
  if (!board?.cells) return 0
  let total = 0
  for (const row of board.cells) {
    for (const cell of row) {
      total += Number(cell?.ice || (cell?.snow ? 1 : 0) || 0)
    }
  }
  return total
}

export function countCrateLayers(board) {
  if (!board?.cells) return 0
  let total = 0
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell?.type === 'crate') total += Number(cell.layers ?? 1)
    }
  }
  return total
}

export function emptyGoalProgress(level, board) {
  if (level.goalType === 'score') return { score: 0 }
  if (level.goalType === 'ice') return { ice: countIceLayers(board) }
  if (level.goalType === 'crate') return { crate: countCrateLayers(board) }
  const progress = {}
  for (const key of Object.keys(level.goalPayload ?? {})) progress[key] = 0
  return progress
}

export function isGoalMet(level, score, collected, board) {
  if (level.goalType === 'score') return score >= level.goalPayload.score
  if (level.goalType === 'ice') return countIceLayers(board) === 0
  if (level.goalType === 'crate') return countCrateLayers(board) === 0
  return Object.entries(level.goalPayload).every(
    ([type, need]) => type !== 'ice' && type !== 'crate' && (collected[type] ?? 0) >= need,
  )
}

export function buildGoalProgress(level, score, collected, board) {
  if (level.goalType === 'score') return { score }
  if (level.goalType === 'ice') return { ice: countIceLayers(board) }
  if (level.goalType === 'crate') return { crate: countCrateLayers(board) }
  const progress = {}
  for (const key of Object.keys(level.goalPayload ?? {})) {
    progress[key] = collected[key] ?? 0
  }
  return progress
}

export function starsFor(won, movesLeft, level) {
  if (!won) return 0
  if (movesLeft >= level.threeStarMoves) return 3
  if (movesLeft >= level.twoStarMoves) return 2
  return 1
}
