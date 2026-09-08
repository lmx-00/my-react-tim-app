import { api } from './client.js'

export function listLevels() {
  return api('/levels')
}

export function createSession(levelId) {
  return api('/game/sessions', {
    method: 'POST',
    body: { levelId: Number(levelId) },
  })
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
