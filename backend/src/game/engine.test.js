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
    const board = createBoard({ rows: 8, cols: 8, colorCount: 5 }, rng)
    assert.equal(hasMatch(board), false)
    assert.ok(findLegalMoves(board).length > 0)
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
})
