import { LOGIN_LOCK_MS, MAX_LOGIN_ATTEMPTS, REFRESH_TOKEN_DAYS } from '../game/constants.js'
import { AppError } from '../lib/errors.js'
import { signAccessToken, refreshCookieOptions } from '../lib/jwt.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import { createRefreshTokenValue, hashToken } from '../lib/tokens.js'

function publicUser(user) {
  return { id: user.id, username: user.username, createdAt: user.createdAt }
}

export async function issueAuth(res, user) {
  const accessToken = signAccessToken(user)
  const refreshValue = createRefreshTokenValue()
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshValue),
      expiresAt,
    },
  })

  res.cookie('refreshToken', refreshValue, refreshCookieOptions())
  return { user: publicUser(user), accessToken }
}

export async function registerUser({ username, password }) {
  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) {
    throw new AppError(409, 'USERNAME_TAKEN', '用户名已被使用')
  }

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      progress: { create: {} },
    },
  })

  return user
}

export async function loginUser({ username, password }) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', '用户名或密码错误')
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(429, 'ACCOUNT_LOCKED', '登录失败次数过多，请 10 分钟后再试')
  }

  const good = await verifyPassword(password, user.passwordHash)
  if (!good) {
    const failedLogins = user.failedLogins + 1
    const lockedUntil = failedLogins >= MAX_LOGIN_ATTEMPTS
      ? new Date(Date.now() + LOGIN_LOCK_MS)
      : null
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins, lockedUntil },
    })
    throw new AppError(401, 'INVALID_CREDENTIALS', '用户名或密码错误')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null },
  })

  return user
}

export async function rotateRefreshToken(refreshValue) {
  if (!refreshValue) {
    throw new AppError(401, 'UNAUTHORIZED', '请先登录')
  }

  const tokenHash = hashToken(refreshValue)
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, revoked: false },
    include: { user: true },
  })

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'UNAUTHORIZED', '登录已过期，请重新登录')
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  })

  return stored.user
}

export async function logoutRefreshToken(refreshValue) {
  if (!refreshValue) return
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshValue), revoked: false },
    data: { revoked: true },
  })
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { progress: true },
  })
  if (!user) throw new AppError(401, 'UNAUTHORIZED', '请先登录')

  const ended = await prisma.gameSession.findMany({
    where: { userId, status: { not: 'playing' } },
    select: { status: true, score: true, stars: true, levelId: true },
  })

  const stats = {
    totalGames: ended.length,
    wins: ended.filter((s) => s.status === 'won').length,
    maxCleared: user.progress?.maxCleared ?? 0,
    bestScore: ended.reduce((max, s) => Math.max(max, s.score), 0),
    totalStars: Object.values(user.progress?.levelStars ?? {}).reduce(
      (sum, stars) => sum + Number(stars ?? 0),
      0,
    ),
  }

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    progress: {
      maxCleared: user.progress?.maxCleared ?? 0,
      stats,
    },
  }
}
