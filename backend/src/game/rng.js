import { BASE_TYPES } from './constants.js'

export function createRng(seed) {
  let state = seed >>> 0

  function rng() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  rng.getState = () => String(state >>> 0)
  return rng
}

export function rngFromState(stateStr) {
  return createRng(Number(stateStr) >>> 0)
}

export function randomSeed() {
  return String((Math.random() * 0xffffffff) >>> 0)
}

export function pickType(rng, colorCount) {
  const count = Math.min(colorCount, BASE_TYPES.length)
  return BASE_TYPES[Math.floor(rng() * count)]
}
