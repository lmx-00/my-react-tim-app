import { api } from './client.js'

export function notifyWallet() {
  window.dispatchEvent(new Event('hm-wallet'))
}

export function listLevels() {
  return api('/levels')
}

export function getLevel(levelId) {
  return api(`/levels/${levelId}`)
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

export function undoMove(sessionId) {
  return api(`/game/sessions/${sessionId}/undo`, { method: 'POST' })
}

export function useHammer(sessionId, point) {
  return api(`/game/sessions/${sessionId}/hammer`, { method: 'POST', body: point })
}

export function useShuffle(sessionId) {
  return api(`/game/sessions/${sessionId}/shuffle`, { method: 'POST' })
}

export function useSwap(sessionId, move) {
  return api(`/game/sessions/${sessionId}/swap`, { method: 'POST', body: move })
}

export function usePlus(sessionId) {
  return api(`/game/sessions/${sessionId}/plus`, { method: 'POST' })
}

export function getLeaderboard({ page = 1, pageSize = 50, scope = 'all', levelId } = {}) {
  const params = { page, pageSize, scope }
  if (levelId) params.levelId = String(levelId)
  return api(`/leaderboard?${new URLSearchParams(params)}`)
}

export function addFriend(username) {
  return api('/friends', { method: 'POST', body: { username } })
}

export function removeFriend(username) {
  return api('/friends', { method: 'DELETE', body: { username } })
}

export function getTheme() {
  return api('/settings')
}

export function saveSettings(settings) {
  return api('/admin/settings', { method: 'PUT', body: settings })
}

export function saveTheme(theme) {
  return saveSettings({ theme })
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

export function getWallet() {
  return api('/wallet')
}

export function getShop() {
  return api('/shop')
}

export function buyShopItem(id) {
  return api(`/shop/${id}`, { method: 'POST' })
}

export function getBag() {
  return api('/bag')
}

export function listMail() {
  return api('/mail')
}

export function claimMail(id) {
  return api(`/mail/${id}/claim`, { method: 'POST' })
}

export function claimAllMail() {
  return api('/mail/claim-all', { method: 'POST' })
}

export function checkIn() {
  return api('/activity/check-in', { method: 'POST' })
}

export function getActivity() {
  return api('/activity')
}

export function claimEvent(id) {
  return api(`/activity/${id}/claim`, { method: 'POST' })
}

export function claimTask(id) {
  return api(`/activity/tasks/${id}/claim`, { method: 'POST' })
}

export function createRecharge(productId) {
  return api('/recharge', { method: 'POST', body: { productId } })
}

export function payRecharge(id, channel) {
  return api(`/recharge/${id}/pay`, { method: 'POST', body: { channel } })
}
