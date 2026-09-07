import bcrypt from 'bcryptjs'
import { BCRYPT_COST } from '../game/constants.js'

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST)
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}
