export const BASE_TYPES = ['bear', 'cat', 'fox', 'frog', 'chick', 'owl']

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000
export const ACCESS_TOKEN_TTL = '15m'
export const REFRESH_TOKEN_DAYS = 7
export const BCRYPT_COST = 12
export const MAX_LOGIN_ATTEMPTS = 5
export const LOGIN_LOCK_MS = 10 * 60 * 1000

export const SCORE = {
  match3: 50,
  match4: 120,
  match5: 300,
  el: 200,
  rocket: 40,
  bomb: 50,
  rainbow: 60,
}

export const RAINBOW_BLAST_RADIUS = 1

export function rainbowCountForLevel(levelConfig) {
  const id = Number(levelConfig?.id ?? 0)
  if (id < 2) return 0
  if (id >= 12) return 2
  return 1
}

export function comboMultiplier(wave) {
  if (wave <= 1) return 1
  if (wave === 2) return 1.2
  if (wave === 3) return 1.5
  return 2
}

export function cellKey(row, col) {
  return `${row},${col}`
}

export function parseKey(key) {
  const [row, col] = key.split(',').map(Number)
  return [row, col]
}

export function inBounds(board, row, col) {
  return row >= 0 && col >= 0 && row < board.rows && col < board.cols
}

export function matchColor(cell) {
  if (!cell) return null
  if (cell.type === 'rainbow') return null
  if (cell.type === 'rocket' || cell.type === 'bomb') return cell.color
  return cell.type
}

export function cloneBoard(board) {
  return {
    rows: board.rows,
    cols: board.cols,
    cells: board.cells.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
  }
}

export function cloneTile(tile) {
  return tile ? { ...tile } : null
}
