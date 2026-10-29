import { api } from './client.js'

export function listLevels() {
  return api('/levels')
}

let creating = null

// StrictMode 下 effect 会跑两次，同一关的并发请求共用一次，免得开出两局
export function createSession(levelId) {
  const id = Number(levelId)
  if (!creating || creating.levelId !== id) {
    creating = {
      levelId: id,
      promise: api('/game/sessions', { method: 'POST', body: { levelId: id } }).finally(() => {
        creating = null
      }),
    }
  }
  return creating.promise
}

export function getSession(sessionId) {
  return api(`/game/sessions/${sessionId}`)
}

export function playMove(sessionId, move) {
  return api(`/game/sessions/${sessionId}/move`, {
    method: 'POST',
    body: move,
  })
}

export function quitSession(sessionId) {
  return api(`/game/sessions/${sessionId}/quit`, { method: 'POST' })
}

export function getStats() {
  return api('/stats')
}

export function listRecords({ page = 1, pageSize = 10, result, levelId } = {}) {
  const query = new URLSearchParams({ page, pageSize })
  if (result) query.set('result', result)
  if (levelId) query.set('levelId', levelId)
  return api(`/records?${query}`)
}
