import {
  BASE_TYPES,
  SCORE,
  cellKey,
  cloneBoard,
  comboMultiplier,
  inBounds,
  matchColor,
  parseKey,
} from './constants.js'
import { pickType } from './rng.js'

function neighbors(row, col) {
  return [
    [row, col + 1],
    [row + 1, col],
  ]
}

export function findMatchGroups(board) {
  const groups = []
  const { rows, cols, cells } = board

  for (let row = 0; row < rows; row += 1) {
    let col = 0
    while (col < cols) {
      const color = matchColor(cells[row][col])
      if (!color) {
        col += 1
        continue
      }
      let end = col + 1
      while (end < cols && matchColor(cells[row][end]) === color) end += 1
      if (end - col >= 3) {
        groups.push({
          dir: 'row',
          color,
          cells: Array.from({ length: end - col }, (_, i) => [row, col + i]),
        })
      }
      col = end
    }
  }

  for (let col = 0; col < cols; col += 1) {
    let row = 0
    while (row < rows) {
      const color = matchColor(cells[row][col])
      if (!color) {
        row += 1
        continue
      }
      let end = row + 1
      while (end < rows && matchColor(cells[end][col]) === color) end += 1
      if (end - row >= 3) {
        groups.push({
          dir: 'col',
          color,
          cells: Array.from({ length: end - row }, (_, i) => [row + i, col]),
        })
      }
      row = end
    }
  }

  return groups
}

export function hasMatch(board) {
  return findMatchGroups(board).length > 0
}

function isRainbowSwap(a, b) {
  return a?.type === 'rainbow' || b?.type === 'rainbow'
}

function wouldMatch(board, y1, x1, y2, x2) {
  const next = cloneBoard(board)
  swapCells(next, y1, x1, y2, x2)
  const a = next.cells[y1][x1]
  const b = next.cells[y2][x2]
  if (isRainbowSwap(a, b)) return true
  return hasMatch(next)
}

export function findLegalMoves(board) {
  const moves = []
  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      for (const [nrow, ncol] of neighbors(row, col)) {
        if (!inBounds(board, nrow, ncol)) continue
        if (wouldMatch(board, row, col, nrow, ncol)) {
          moves.push({ y1: row, x1: col, y2: nrow, x2: ncol })
        }
      }
    }
  }
  return moves
}

function swapCells(board, y1, x1, y2, x2) {
  const tmp = board.cells[y1][x1]
  board.cells[y1][x1] = board.cells[y2][x2]
  board.cells[y2][x2] = tmp
}

function adjacent(y1, x1, y2, x2) {
  return Math.abs(y1 - y2) + Math.abs(x1 - x2) === 1
}

function runLengths(groups) {
  const horizontal = new Map()
  const vertical = new Map()
  for (const group of groups) {
    for (const [row, col] of group.cells) {
      const key = cellKey(row, col)
      if (group.dir === 'row') {
        horizontal.set(key, Math.max(horizontal.get(key) ?? 0, group.cells.length))
      } else {
        vertical.set(key, Math.max(vertical.get(key) ?? 0, group.cells.length))
      }
    }
  }
  return { horizontal, vertical }
}

function specialFromRuns(board, key, horizontal, vertical) {
  const [row, col] = parseKey(key)
  const tile = board.cells[row][col]
  if (!tile || tile.type === 'rainbow' || tile.type === 'rocket' || tile.type === 'bomb') {
    return null
  }
  const hLen = horizontal.get(key) ?? 0
  const vLen = vertical.get(key) ?? 0
  const color = matchColor(tile)
  if (hLen >= 5 || vLen >= 5) return { type: 'rainbow' }
  if (hLen >= 3 && vLen >= 3) return { type: 'bomb', color }
  if (hLen >= 4) return { type: 'rocket', dir: 'row', color }
  if (vLen >= 4) return { type: 'rocket', dir: 'col', color }
  return null
}

function decideSpecials(board, groups, swapCells) {
  const { horizontal, vertical } = runLengths(groups)
  const spawns = {}
  const matched = new Set(groups.flatMap((g) => g.cells.map(([r, c]) => cellKey(r, c))))

  const trySpawn = (row, col) => {
    const key = cellKey(row, col)
    if (!matched.has(key) || spawns[key]) return
    const special = specialFromRuns(board, key, horizontal, vertical)
    if (special) spawns[key] = special
  }

  if (swapCells) {
    for (const [row, col] of swapCells) trySpawn(row, col)
  }

  for (const group of groups) {
    const deserves = group.cells.length >= 4 || group.cells.some(([r, c]) => {
      const key = cellKey(r, c)
      return (horizontal.get(key) ?? 0) >= 3 && (vertical.get(key) ?? 0) >= 3
    })
    if (!deserves) continue
    if (group.cells.some(([r, c]) => spawns[cellKey(r, c)])) continue
    const [row, col] = group.cells[Math.floor(group.cells.length / 2)]
    trySpawn(row, col)
  }

  return spawns
}

function collectBlast(board, startCells, rainbowColor) {
  const toClear = new Set()
  const extraScores = { rocket: 0, bomb: 0, rainbow: 0 }
  const queue = startCells.map(([row, col]) => ({ row, col, reason: 'match' }))
  const activated = new Set()

  if (rainbowColor) {
    for (let row = 0; row < board.rows; row += 1) {
      for (let col = 0; col < board.cols; col += 1) {
        if (matchColor(board.cells[row][col]) === rainbowColor) {
          queue.push({ row, col, reason: 'rainbow' })
          extraScores.rainbow += SCORE.rainbow
        }
      }
    }
  }

  while (queue.length) {
    const { row, col, reason } = queue.pop()
    if (!inBounds(board, row, col)) continue
    const key = cellKey(row, col)
    const firstVisit = !toClear.has(key)
    if (firstVisit) toClear.add(key)
    const tile = board.cells[row][col]
    if (!tile || activated.has(key)) continue

    if (reason === 'rocket' && firstVisit) extraScores.rocket += SCORE.rocket
    if (reason === 'bomb' && firstVisit) extraScores.bomb += SCORE.bomb

    if (tile.type === 'rocket') {
      activated.add(key)
      if (tile.dir === 'row') {
        for (let c = 0; c < board.cols; c += 1) queue.push({ row, col: c, reason: 'rocket' })
      } else {
        for (let r = 0; r < board.rows; r += 1) queue.push({ row: r, col, reason: 'rocket' })
      }
    } else if (tile.type === 'bomb') {
      activated.add(key)
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          queue.push({ row: row + dr, col: col + dc, reason: 'bomb' })
        }
      }
    } else if (tile.type === 'rainbow' && !rainbowColor) {
      activated.add(key)
    }
  }

  return { toClear, extraScores }
}

function scoreGroups(groups) {
  let total = 0
  const seenLT = new Set()
  const { horizontal, vertical } = runLengths(groups)

  for (const group of groups) {
    const len = group.cells.length
    if (len >= 5) total += SCORE.match5
    else if (len === 4) total += SCORE.match4
    else total += SCORE.match3
  }

  for (const group of groups) {
    for (const [row, col] of group.cells) {
      const key = cellKey(row, col)
      if ((horizontal.get(key) ?? 0) >= 3 && (vertical.get(key) ?? 0) >= 3 && !seenLT.has(key)) {
        seenLT.add(key)
        total += SCORE.el
      }
    }
  }

  return total
}

function tallyCleared(board, toClear, collected) {
  for (const key of toClear) {
    const [row, col] = parseKey(key)
    const color = matchColor(board.cells[row][col])
    if (color && BASE_TYPES.includes(color)) {
      collected[color] = (collected[color] ?? 0) + 1
    }
  }
}

function applyClears(board, toClear, spawns) {
  for (const key of toClear) {
    if (spawns[key]) continue
    const [row, col] = parseKey(key)
    board.cells[row][col] = null
  }
  for (const [key, tile] of Object.entries(spawns)) {
    const [row, col] = parseKey(key)
    board.cells[row][col] = { ...tile }
  }
}

function applyGravity(board) {
  const moves = []
  for (let col = 0; col < board.cols; col += 1) {
    let write = board.rows - 1
    for (let row = board.rows - 1; row >= 0; row -= 1) {
      const tile = board.cells[row][col]
      if (!tile) continue
      if (write !== row) {
        board.cells[write][col] = tile
        board.cells[row][col] = null
        moves.push({ from: [row, col], to: [write, col] })
      }
      write -= 1
    }
  }
  return moves
}

function fillBoard(board, rng, colorCount) {
  const cells = []
  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      if (!board.cells[row][col]) {
        const tile = { type: pickType(rng, colorCount) }
        board.cells[row][col] = tile
        cells.push({ at: [row, col], tile: { ...tile } })
      }
    }
  }
  return cells
}

function resolveWaves(board, rng, colorCount, swapCells) {
  const events = []
  const collected = {}
  let scoreDelta = 0
  let wave = 1
  let first = true

  while (true) {
    const groups = findMatchGroups(board)
    if (groups.length === 0) break

    const matchedCells = groups.flatMap((g) => g.cells)
    const spawns = decideSpecials(board, groups, first ? swapCells : null)
    const { toClear, extraScores } = collectBlast(board, matchedCells, null)
    const waveScore = Math.round(
      (scoreGroups(groups) + extraScores.rocket + extraScores.bomb + extraScores.rainbow)
        * comboMultiplier(wave),
    )
    scoreDelta += waveScore
    tallyCleared(board, toClear, collected)

    events.push({
      type: 'match',
      cells: matchedCells,
      wave,
      score: waveScore,
    })
    if (Object.keys(spawns).length) {
      events.push({
        type: 'spawnSpecial',
        tiles: Object.entries(spawns).map(([key, tile]) => {
          const [row, col] = parseKey(key)
          return { at: [row, col], tile }
        }),
      })
    }

    applyClears(board, toClear, spawns)
    const drops = applyGravity(board)
    if (drops.length) events.push({ type: 'drop', moves: drops })
    const fills = fillBoard(board, rng, colorCount)
    if (fills.length) events.push({ type: 'fill', cells: fills })

    first = false
    wave += 1
    if (wave > 40) break
  }

  return { events, scoreDelta, collected, waves: wave - 1 }
}

function resolveRainbowSwap(board, rng, colorCount, y1, x1, y2, x2) {
  const a = board.cells[y1][x1]
  const b = board.cells[y2][x2]
  const rainbowPos = a.type === 'rainbow' ? [y1, x1] : [y2, x2]
  const other = a.type === 'rainbow' ? b : a
  const otherPos = a.type === 'rainbow' ? [y2, x2] : [y1, x1]
  const color = other.type === 'rainbow' ? null : matchColor(other)

  const start = [rainbowPos, otherPos]
  const { toClear, extraScores } = collectBlast(
    board,
    start,
    color,
  )

  if (other.type === 'rainbow') {
    for (let row = 0; row < board.rows; row += 1) {
      for (let col = 0; col < board.cols; col += 1) {
        toClear.add(cellKey(row, col))
        extraScores.rainbow += SCORE.rainbow
      }
    }
  }

  const collected = {}
  tallyCleared(board, toClear, collected)
  const waveScore = Math.round(
    (extraScores.rocket + extraScores.bomb + extraScores.rainbow) * comboMultiplier(1),
  )

  const events = [
    {
      type: 'rainbow',
      color,
      cells: [...toClear].map(parseKey),
      wave: 1,
      score: waveScore,
    },
  ]

  applyClears(board, toClear, {})
  const drops = applyGravity(board)
  if (drops.length) events.push({ type: 'drop', moves: drops })
  const fills = fillBoard(board, rng, colorCount)
  if (fills.length) events.push({ type: 'fill', cells: fills })

  const rest = resolveWaves(board, rng, colorCount, null)
  mergeCollected(collected, rest.collected)

  return {
    events: [...events, ...rest.events],
    scoreDelta: waveScore + rest.scoreDelta,
    collected,
  }
}

function mergeCollected(target, extra) {
  for (const [key, value] of Object.entries(extra)) {
    target[key] = (target[key] ?? 0) + value
  }
}

export function shuffleBoard(board, rng, colorCount) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const tiles = []
    for (let row = 0; row < board.rows; row += 1) {
      for (let col = 0; col < board.cols; col += 1) {
        tiles.push(board.cells[row][col])
      }
    }
    for (let i = tiles.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1))
      ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
    }
    let index = 0
    for (let row = 0; row < board.rows; row += 1) {
      for (let col = 0; col < board.cols; col += 1) {
        board.cells[row][col] = tiles[index] ? { ...tiles[index] } : { type: pickType(rng, colorCount) }
        index += 1
      }
    }
    breakExistingMatches(board, rng, colorCount)
    if (!hasMatch(board) && findLegalMoves(board).length > 0) return true
  }
  plantGuaranteedMove(board, rng, colorCount)
  breakExistingMatches(board, rng, colorCount)
  return !hasMatch(board) && findLegalMoves(board).length > 0
}

function differentSafeType(board, row, col, rng, colorCount) {
  for (let i = 0; i < 12; i += 1) {
    const type = pickType(rng, colorCount)
    const left1 = col > 0 ? matchColor(board.cells[row][col - 1]) : null
    const left2 = col > 1 ? matchColor(board.cells[row][col - 2]) : null
    const up1 = row > 0 ? matchColor(board.cells[row - 1][col]) : null
    const up2 = row > 1 ? matchColor(board.cells[row - 2][col]) : null
    if (type === left1 && type === left2) continue
    if (type === up1 && type === up2) continue
    return type
  }
  return pickType(rng, colorCount)
}

function breakExistingMatches(board, rng, colorCount) {
  for (let guard = 0; guard < 40; guard += 1) {
    const groups = findMatchGroups(board)
    if (!groups.length) return
    for (const group of groups) {
      const [row, col] = group.cells[group.cells.length - 1]
      board.cells[row][col] = { type: differentSafeType(board, row, col, rng, colorCount) }
    }
  }
}

function plantGuaranteedMove(board, rng, colorCount) {
  const a = BASE_TYPES[0]
  const b = BASE_TYPES[Math.min(1, colorCount - 1)]
  board.cells[0][0] = { type: a }
  board.cells[0][1] = { type: a }
  board.cells[0][2] = { type: b }
  board.cells[0][3] = { type: a }
}

export function createBoard(levelConfig, rng) {
  const { rows, cols, colorCount } = levelConfig
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ type: pickType(rng, colorCount) })),
    )
    const board = { rows, cols, cells }
    breakExistingMatches(board, rng, colorCount)
    if (!hasMatch(board) && findLegalMoves(board).length > 0) return board
  }
  const cells = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: pickType(rng, colorCount) })),
  )
  const board = { rows, cols, cells }
  plantGuaranteedMove(board, rng, colorCount)
  breakExistingMatches(board, rng, colorCount)
  if (hasMatch(board) || findLegalMoves(board).length === 0) {
    shuffleBoard(board, rng, colorCount)
  }
  return board
}

export function applySwap(board, move, levelConfig, rng) {
  const { x1, y1, x2, y2 } = move
  if (!inBounds(board, y1, x1) || !inBounds(board, y2, x2) || !adjacent(y1, x1, y2, x2)) {
    return { valid: false, events: [], board, scoreDelta: 0, collected: {} }
  }

  const next = cloneBoard(board)
  swapCells(next, y1, x1, y2, x2)
  const a = next.cells[y1][x1]
  const b = next.cells[y2][x2]
  const events = [{ type: 'swap', from: [y1, x1], to: [y2, x2] }]

  if (isRainbowSwap(a, b)) {
    const result = resolveRainbowSwap(next, rng, levelConfig.colorCount, y1, x1, y2, x2)
    maybeShuffle(next, rng, levelConfig.colorCount, result.events)
    return {
      valid: true,
      events: [...events, ...result.events],
      board: next,
      scoreDelta: result.scoreDelta,
      collected: result.collected,
    }
  }

  if (!hasMatch(next)) {
    return { valid: false, events: [], board, scoreDelta: 0, collected: {} }
  }

  const result = resolveWaves(next, rng, levelConfig.colorCount, [
    [y1, x1],
    [y2, x2],
  ])
  maybeShuffle(next, rng, levelConfig.colorCount, result.events)
  return {
    valid: true,
    events: [...events, ...result.events],
    board: next,
    scoreDelta: result.scoreDelta,
    collected: result.collected,
  }
}

function maybeShuffle(board, rng, colorCount, events) {
  if (hasMatch(board)) return
  if (findLegalMoves(board).length > 0) return
  shuffleBoard(board, rng, colorCount)
  events.push({ type: 'shuffle', board: cloneBoard(board) })
}

export function ensurePlayable(board, rng, colorCount) {
  const events = []
  maybeShuffle(board, rng, colorCount, events)
  return events
}
