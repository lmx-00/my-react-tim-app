import { api } from './client.js'

export function loginRequest(username, password) {
  return api('/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export function registerRequest(username, password) {
  return api('/auth/register', {
    method: 'POST',
    body: { username, password },
  })
}

export function refreshRequest() {
  return api('/auth/refresh', { method: 'POST' })
}

export function logoutRequest() {
  return api('/auth/logout', { method: 'POST' })
}
