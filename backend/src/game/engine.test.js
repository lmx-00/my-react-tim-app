import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SCORE, cloneBoard } from './constants.js'
import {
  applySwap,
  createBoard,
  findLegalMoves,
  findMatchGroups,
  hasMatch,
} from './engine.js'
import { createRng } from './rng.js'

function boardFrom(rows) {
  return {
    rows: rows.length,
    cols: rows[0].length,
    cells: rows.map((row) => row.map((type) => (typeof type === 'string' ? { type } : { ...type }))),
  }
}

describe('match-3 engine', () => {
  it('detects a horizontal 3-match', () => {
    const board = boardFrom([
      ['bear', 'bear', 'bear', 'cat'],
      ['cat', 'fox', 'frog', 'owl'],
      ['fox', 'owl', 'cat', 'frog'],
      ['owl', 'frog', 'fox', 'cat'],
    ])
    const groups = findMatchGroups(board)
    assert.equal(groups.length, 1)
    assert.equal(groups[0].dir, 'row')
    assert.equal(groups[0].cells.length, 3)
  })

  it('rejects a swap that does not match', () => {
    const board = boardFrom([
      ['bear', 'cat', 'fox', 'frog'],
      ['cat', 'fox', 'frog', 'owl'],
      ['fox', 'frog', 'owl', 'bear'],
      ['frog', 'owl', 'bear', 'cat'],
    ])
    const rng = createRng(1)
    const result = applySwap(board, { x1: 0, y1: 0, x2: 1, y2: 0 }, { colorCount: 6 }, rng)
    assert.equal(result.valid, false)
    assert.equal(result.scoreDelta, 0)
    assert.deepEqual(result.board.cells[0][0].type, 'bear')
  })

  it('clears a horizontal 3-match after a valid swap and scores 50', () => {
    const board = boardFrom([
      ['bear', 'cat', 'bear', 'bear'],
      ['fox', 'frog', 'owl', 'chick'],
      ['frog', 'owl', 'chick', 'fox'],
      ['owl', 'chick', 'fox', 'frog'],
    ])
    const rng = createRng(42)
    const result = applySwap(board, { x1: 0, y1: 0, x2: 1, y2: 0 }, { colorCount: 6 }, rng)
    assert.equal(result.valid, true)
    assert.equal(result.events[0].type, 'swap')
    const matchEvent = result.events.find((event) => event.type === 'match')
    assert.ok(matchEvent)
    assert.equal(matchEvent.cells.length, 3)
    assert.ok(result.scoreDelta >= SCORE.match3)
    assert.equal(result.collected.bear, 3)
  })

  it('creates a row rocket from a 4-match', () => {
    const board = boardFrom([
      ['bear', 'bear', 'bear', 'cat'],
      ['fox', 'frog', 'owl', 'bear'],
      ['frog', 'owl', 'chick', 'fox'],
      ['owl', 'chick', 'fox', 'frog'],
    ])
    const rng = createRng(7)
    const result = applySwap(board, { x1: 3, y1: 0, x2: 3, y2: 1 }, { colorCount: 6 }, rng)
    assert.equal(result.valid, true)
    const spawn = result.events.find((event) => event.type === 'spawnSpecial')
    assert.ok(spawn, 'expected a special spawn')
    assert.equal(spawn.tiles[0].tile.type, 'rocket')
    assert.equal(spawn.tiles[0].tile.dir, 'row')
  })

  it('generates a playable board with no opening match', () => {
    const rng = createRng(99)
    const board = createBoard({ id: 1, rows: 8, cols: 8, colorCount: 5 }, rng)
    assert.equal(hasMatch(board), false)
    assert.ok(findLegalMoves(board).length > 0)
    assert.equal(board.cells.flat().filter((tile) => tile?.type === 'rainbow').length, 0)
  })

  it('plants one rainbow bomb from level 2', () => {
    const rng = createRng(99)
    const board = createBoard({ id: 2, rows: 8, cols: 8, colorCount: 6 }, rng)
    assert.equal(board.cells.flat().filter((tile) => tile?.type === 'rainbow').length, 1)
  })

  it('plants two rainbow bombs from level 12', () => {
    const rng = createRng(21)
    const board = createBoard({ id: 12, rows: 8, cols: 8, colorCount: 6 }, rng)
    assert.equal(board.cells.flat().filter((tile) => tile?.type === 'rainbow').length, 2)
  })

  it('creates a rainbow bird from a straight 5-match', () => {
    const board = boardFrom([
      ['bear', 'bear', 'bear', 'bear', 'cat'],
      ['fox', 'owl', 'frog', 'chick', 'bear'],
      ['owl', 'frog', 'chick', 'fox', 'cat'],
      ['frog', 'chick', 'fox', 'owl', 'fox'],
      ['chick', 'fox', 'owl', 'frog', 'owl'],
    ])
    const result = applySwap(board, { x1: 4, y1: 0, x2: 4, y2: 1 }, { colorCount: 6 }, createRng(3))
    assert.equal(result.valid, true)
    const spawn = result.events.find((event) => event.type === 'spawnSpecial')
    assert.ok(spawn)
    assert.equal(spawn.tiles[0].tile.type, 'rainbow')
  })

  it('creates a bomb from an L or T match', () => {
    const board = boardFrom([
      ['bear', 'fox', 'bear', 'bear'],
      ['cat', 'bear', 'chick', 'frog'],
      ['owl', 'bear', 'owl', 'chick'],
      ['frog', 'cat', 'fox', 'owl'],
    ])
    const result = applySwap(board, { x1: 0, y1: 0, x2: 1, y2: 0 }, { colorCount: 6 }, createRng(5))
    assert.equal(result.valid, true)
    const spawn = result.events.find((event) => event.type === 'spawnSpecial')
    assert.ok(spawn)
    assert.equal(spawn.tiles[0].tile.type, 'bomb')
  })

  it('fires a column rocket when swapped beside any tile', () => {
    const board = boardFrom([
      ['fox', 'owl', 'chick', 'frog'],
      ['owl', 'frog', 'fox', 'chick'],
      ['bear', { type: 'rocket', dir: 'col', color: 'cat' }, 'owl', 'fox'],
      ['chick', 'bear', 'frog', 'owl'],
    ])
    const result = applySwap(board, { x1: 1, y1: 2, x2: 0, y2: 2 }, { colorCount: 6 }, createRng(1))
    assert.equal(result.valid, true)
    const match = result.events.find((event) => event.type === 'match')
    const keys = new Set(match.cells.map(([y, x]) => `${y},${x}`))
    assert.equal(match.effect, 'line')
    for (const key of ['0,0', '1,0', '2,0', '3,0']) assert.equal(keys.has(key), true, key)
    assert.equal(keys.has('0,1'), false)
  })

  it('clears the whole row when a row rocket is matched', () => {
    const board = boardFrom([
      ['bear', { type: 'rocket', dir: 'row', color: 'bear' }, 'cat', 'fox'],
      ['owl', 'frog', 'bear', 'chick'],
      ['chick', 'owl', 'fox', 'frog'],
      ['frog', 'chick', 'owl', 'fox'],
    ])
    const result = applySwap(board, { x1: 2, y1: 0, x2: 2, y2: 1 }, { colorCount: 6 }, createRng(1))
    const match = result.events.find((event) => event.type === 'match')
    const keys = new Set(match.cells.map(([y, x]) => `${y},${x}`))
    assert.equal(match.effect, 'line')
    assert.equal(keys.has('0,3'), true)
    assert.equal(keys.has('0,0'), true)
  })

  it('clears every tile of the swapped color when a rainbow is used', () => {
    const board = boardFrom([
      ['cat', 'fox', 'cat', 'frog'],
      ['owl', 'rainbow', 'frog', 'owl'],
      ['fox', 'chick', 'cat', 'frog'],
      ['owl', 'frog', 'fox', 'chick'],
    ])
    const result = applySwap(board, { x1: 1, y1: 1, x2: 1, y2: 0 }, { colorCount: 6 }, createRng(1))
    assert.equal(result.valid, true)
    const blast = result.events.find((event) => event.type === 'rainbow')
    assert.equal(blast.color, 'fox')
    assert.equal(blast.effect, 'color')
    const keys = new Set(blast.cells.map(([y, x]) => `${y},${x}`))
    for (const key of ['0,1', '2,0', '3,2', '1,1']) {
      assert.equal(keys.has(key), true, key)
    }
    assert.equal(keys.has('0,0'), false)
  })

  it('keeps the original board intact on invalid moves', () => {
    const board = boardFrom([
      ['bear', 'cat', 'fox'],
      ['cat', 'fox', 'frog'],
      ['fox', 'frog', 'owl'],
    ])
    const snapshot = cloneBoard(board)
    const rng = createRng(3)
    applySwap(board, { x1: 0, y1: 0, x2: 1, y2: 0 }, { colorCount: 5 }, rng)
    assert.deepEqual(board, snapshot)
  })

  it('refuses to drag a frozen animal', () => {
    const board = boardFrom([
      [{ type: 'bear', ice: 1 }, 'cat', 'fox', 'frog'],
      ['cat', 'fox', 'frog', 'owl'],
      ['fox', 'frog', 'owl', 'bear'],
      ['frog', 'owl', 'bear', 'cat'],
    ])
    const result = applySwap(board, { x1: 0, y1: 0, x2: 1, y2: 0 }, { colorCount: 6 }, createRng(1))
    assert.equal(result.valid, false)
    assert.equal(board.cells[0][0].type, 'bear')
    assert.equal(board.cells[0][0].ice, 1)
  })

  it('cracks one ice layer beside a match and leaves the animal in place', () => {
    const board = boardFrom([
      ['fox', { type: 'owl', ice: 2 }, 'chick', 'frog'],
      ['bear', 'cat', 'bear', 'bear'],
    ])
    const rng = () => 0.2
    rng.getState = () => '1'
    const result = applySwap(board, { x1: 0, y1: 1, x2: 1, y2: 1 }, { colorCount: 6 }, rng)
    assert.equal(result.valid, true)
    assert.equal(result.board.cells[0][1].type, 'owl')
    assert.equal(result.board.cells[0][1].ice, 1)
  })
})
