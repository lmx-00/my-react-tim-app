export const TILE_NAME = {
  bear: '小熊',
  cat: '小猫',
  fox: '狐狸',
  frog: '青蛙',
  chick: '小鸡',
  owl: '猫头鹰',
}

export function tileLabel(tile) {
  if (!tile) return '空格'
  if (tile.type === 'rocket') return tile.dir === 'row' ? '横火箭' : '竖火箭'
  if (tile.type === 'bomb') return '炸弹'
  if (tile.type === 'rainbow') return '彩虹鸟'
  if (tile.type === 'crate') return (tile.layers ?? 1) > 1 ? '两层木箱' : '木箱'
  return `${TILE_NAME[tile.type] ?? tile.type}${tile.ice || tile.snow ? '，结冰' : ''}`
}

export function goalText(level) {
  if (!level) return ''
  if (level.goalType === 'score') return `得分 ${level.goalPayload.score}`
  if (level.goalType === 'ice') return '清除所有冰块'
  if (level.goalType === 'crate') return '清除所有木箱'
  return Object.entries(level.goalPayload)
    .map(([type, count]) => `${TILE_NAME[type] ?? type} ${count}`)
    .join('、')
}

export function goalProgressText(level, score, goalProgress) {
  if (!level) return ''
  if (level.goalType === 'score') {
    return `${score} / ${level.goalPayload.score}`
  }
  if (level.goalType === 'ice') return `冰还剩 ${goalProgress?.ice ?? 0} 层`
  if (level.goalType === 'crate') return `木箱还剩 ${goalProgress?.crate ?? 0} 层`
  return Object.entries(level.goalPayload)
    .map(([type, need]) => `${TILE_NAME[type] ?? type} ${goalProgress?.[type] ?? 0}/${need}`)
    .join('  ')
}
