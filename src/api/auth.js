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

export function logoutRequest() {
  return api('/auth/logout', { method: 'POST' })
}

export function changePasswordRequest(oldPassword, newPassword) {
  return api('/auth/password', {
    method: 'POST',
    body: { oldPassword, newPassword },
  })
}

export function saveAvatarRequest(avatarUrl) {
  return api('/me/avatar', { method: 'POST', body: { avatarUrl } })
}
