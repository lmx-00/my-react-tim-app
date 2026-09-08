export const TILE_EMOJI = {
  bear: '🐻',
  cat: '🐱',
  fox: '🦊',
  frog: '🐸',
  chick: '🐥',
  owl: '🦉',
  rocket: '🚀',
  bomb: '💣',
  rainbow: '🌈',
}

export const TILE_NAME = {
  bear: '小熊',
  cat: '小猫',
  fox: '狐狸',
  frog: '青蛙',
  chick: '小鸡',
  owl: '猫头鹰',
}

export function tileEmoji(tile) {
  if (!tile) return ''
  return TILE_EMOJI[tile.type] ?? '❓'
}

export function tileLabel(tile) {
  if (!tile) return '空格'
  if (tile.type === 'rocket') return tile.dir === 'row' ? '横火箭' : '竖火箭'
  if (tile.type === 'bomb') return '炸弹'
  if (tile.type === 'rainbow') return '彩虹鸟'
  return TILE_NAME[tile.type] ?? tile.type
}

export function goalText(level) {
  if (!level) return ''
  if (level.goalType === 'score') return `得分 ${level.goalPayload.score}`
  return Object.entries(level.goalPayload)
    .map(([type, count]) => `${TILE_NAME[type] ?? type} ${count}`)
    .join('、')
}

export function goalProgressText(level, score, goalProgress) {
  if (!level) return ''
  if (level.goalType === 'score') {
    return `${score} / ${level.goalPayload.score}`
  }
  return Object.entries(level.goalPayload)
    .map(([type, need]) => `${TILE_NAME[type] ?? type} ${goalProgress?.[type] ?? 0}/${need}`)
    .join('  ')
}
