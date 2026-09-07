import { AppError } from '../lib/errors.js'
import { verifyAccessToken } from '../lib/jwt.js'

export function authRequired(req, res, next) {
  const header = req.headers.authorization ?? ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) {
    next(new AppError(401, 'UNAUTHORIZED', '请先登录'))
    return
  }
  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, username: payload.username }
    next()
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', '登录已过期，请重新登录'))
  }
}
