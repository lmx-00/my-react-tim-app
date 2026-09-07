import jwt from 'jsonwebtoken'
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_DAYS } from '../game/constants.js'
import { config } from '../config.js'

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    config.jwtAccessSecret,
    { expiresIn: ACCESS_TOKEN_TTL },
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtAccessSecret)
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  }
}
