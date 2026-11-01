import { AppError } from '../lib/errors.js'
import { verifyAccessToken } from '../lib/jwt.js'
import { prisma } from '../lib/prisma.js'

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

export async function adminRequired(req, res, next) {
  const header = req.headers.authorization ?? ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) {
    next(new AppError(401, 'UNAUTHORIZED', '请先登录'))
    return
  }
  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.role !== 'admin') {
      next(new AppError(403, 'FORBIDDEN', '没有后台权限'))
      return
    }
    req.user = { id: user.id, username: user.username, role: user.role }
    next()
  } catch (err) {
    if (err instanceof AppError) {
      next(err)
      return
    }
    next(new AppError(401, 'UNAUTHORIZED', '登录已过期，请重新登录'))
  }
}
