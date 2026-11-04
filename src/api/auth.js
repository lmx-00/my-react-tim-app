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

export function registerPhoneRequest(phone, password) {
  return api('/auth/register/phone', { method: 'POST', body: { phone, password } })
}

export function loginPhoneRequest(phone, password) {
  return api('/auth/login/phone', { method: 'POST', body: { phone, password } })
}

export function sendPhoneCodeRequest(phone) {
  return api('/auth/sms/send', { method: 'POST', body: { phone } })
}

export function loginPhoneCodeRequest(phone, code) {
  return api('/auth/login/phone-code', { method: 'POST', body: { phone, code } })
}

export function guestLoginRequest() {
  return api('/auth/guest', { method: 'POST' })
}

export function wechatLoginRequest(body) {
  return api('/auth/wechat', { method: 'POST', body })
}

export function bindPhoneRequest(phone, password) {
  return api('/auth/bind/phone', { method: 'POST', body: { phone, password } })
}

export function bindWechatRequest(body) {
  return api('/auth/bind/wechat', { method: 'POST', body })
}
