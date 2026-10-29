export const LEVELS = [
  { id: 1, name: '初入森林', rows: 8, cols: 8, colorCount: 6, moveLimit: 20, goalType: 'score', goalPayload: { score: 1450 }, twoStarMoves: 6, threeStarMoves: 9 },
  { id: 2, name: '小试牛刀', rows: 8, cols: 8, colorCount: 6, moveLimit: 24, goalType: 'score', goalPayload: { score: 2050 }, twoStarMoves: 7, threeStarMoves: 12 },
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

export const MAX_LEVEL_ID = Math.max(...LEVELS.map((level) => level.id))

export function getLevelConfig(id) {
  return LEVELS.find((level) => level.id === Number(id)) ?? null
}

export function emptyGoalProgress(level) {
  if (level.goalType === 'score') return { score: 0 }
  const progress = {}
  for (const key of Object.keys(level.goalPayload)) progress[key] = 0
  return progress
}

export function isGoalMet(level, score, collected) {
  if (level.goalType === 'score') return score >= level.goalPayload.score
  return Object.entries(level.goalPayload).every(
    ([type, need]) => (collected[type] ?? 0) >= need,
  )
}

export function buildGoalProgress(level, score, collected) {
  if (level.goalType === 'score') return { score }
  const progress = {}
  for (const key of Object.keys(level.goalPayload)) {
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
