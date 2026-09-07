import { createHash, randomBytes } from 'node:crypto'

export function createRefreshTokenValue() {
  return randomBytes(32).toString('hex')
}

export function hashToken(value) {
  return createHash('sha256').update(value).digest('hex')
}
