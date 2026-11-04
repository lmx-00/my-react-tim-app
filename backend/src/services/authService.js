import { LOGIN_LOCK_MS, MAX_LOGIN_ATTEMPTS, REFRESH_TOKEN_DAYS } from '../game/constants.js'
import { config } from '../config.js'
import { AppError } from '../lib/errors.js'
import { signAccessToken, refreshCookieOptions } from '../lib/jwt.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import { createRefreshTokenValue, hashToken } from '../lib/tokens.js'
import crypto from 'crypto'

function maskPhone(phone) {
  if (!phone) return null
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname ?? null,
    phone: maskPhone(user.phone),
    hasPhone: Boolean(user.phone),
    hasOpenid: Boolean(user.openid),
    hasPassword: Boolean(user.passwordHash),
    isGuest: Boolean(user.isGuest),
    createdAt: user.createdAt,
    role: user.role ?? 'player',
    avatarUrl: user.avatarUrl ?? null,
  }
}

export async function issueAuth(res, user) {
  const accessToken = signAccessToken(user)
  const refreshValue = createRefreshTokenValue()
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)

  // 每次刷新都会作废一张旧的，顺手把这个用户用不上的清掉，别让表一直涨
  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id,
      OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }],
    },
  })

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

  const good = user.passwordHash ? await verifyPassword(password, user.passwordHash) : false
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

export async function changePassword(userId, { oldPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(401, 'UNAUTHORIZED', '请先登录')
  const good = user.passwordHash ? await verifyPassword(oldPassword, user.passwordHash) : false
  if (!good) {
    throw new AppError(401, 'INVALID_CREDENTIALS', user.passwordHash ? '当前密码不正确' : '当前账号还没有密码，请先绑定手机号')
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  })
  return { success: true }
}

export async function updateAvatar(userId, avatarUrl) {
  let parsed
  try {
    parsed = new URL(avatarUrl)
  } catch {
    throw new AppError(400, 'INVALID_AVATAR', '头像地址不正确')
  }
  if (parsed.protocol !== 'https:' || avatarUrl.length > 500) {
    throw new AppError(400, 'INVALID_AVATAR', '头像地址不正确')
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  })
  return publicUser(user)
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
    username: user.nickname || user.username,
    avatarUrl: user.avatarUrl ?? null,
    phone: maskPhone(user.phone),
    hasPhone: Boolean(user.phone),
    hasOpenid: Boolean(user.openid),
    isGuest: Boolean(user.isGuest),
    createdAt: user.createdAt,
    progress: {
      maxCleared: user.progress?.maxCleared ?? 0,
      stats,
    },
  }
}

function cleanNickname(value) {
  const nickname = String(value ?? '').trim().slice(0, 32)
  return nickname || null
}

function cleanAvatar(value) {
  const avatarUrl = String(value ?? '').trim()
  if (!avatarUrl || avatarUrl.length > 500) return null
  try {
    if (new URL(avatarUrl).protocol !== 'https:') return null
  } catch {
    return null
  }
  return avatarUrl
}

async function createPlayer(data) {
  return prisma.user.create({
    data: {
      ...data,
      progress: { create: {} },
    },
  })
}

async function createNamedPlayer(prefix, data) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const username = `${prefix}${crypto.randomBytes(4).toString('hex')}`.slice(0, 16)
    try {
      return await createPlayer({ username, ...data })
    } catch (err) {
      if (err?.code !== 'P2002') throw err
    }
  }
  throw new AppError(500, 'ACCOUNT_CREATE_FAILED', '创建账号失败，请再试一次')
}

async function clearLoginLock(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLogins: 0, lockedUntil: null },
  })
}

async function rejectBadPassword(user) {
  const failedLogins = user.failedLogins + 1
  const lockedUntil = failedLogins >= MAX_LOGIN_ATTEMPTS
    ? new Date(Date.now() + LOGIN_LOCK_MS)
    : null
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins, lockedUntil },
  })
}

export async function registerPhone({ phone, password }) {
  const existing = await prisma.user.findUnique({ where: { phone } })
  if (existing) throw new AppError(409, 'PHONE_TAKEN', '这个手机号已经注册')
  return createPlayer({
    username: `p${phone}`,
    phone,
    passwordHash: await hashPassword(password),
    isGuest: false,
  })
}

export async function loginPhone({ phone, password }) {
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user?.passwordHash) {
    throw new AppError(401, 'INVALID_CREDENTIALS', '手机号或密码错误')
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(429, 'ACCOUNT_LOCKED', '登录失败次数过多，请 10 分钟后再试')
  }
  const good = await verifyPassword(password, user.passwordHash)
  if (!good) {
    await rejectBadPassword(user)
    throw new AppError(401, 'INVALID_CREDENTIALS', '手机号或密码错误')
  }
  await clearLoginLock(user.id)
  return prisma.user.findUnique({ where: { id: user.id } })
}

export async function sendPhoneCode(phone) {
  const recent = await prisma.smsCode.findFirst({
    where: { phone, createdAt: { gt: new Date(Date.now() - 60 * 1000) } },
    orderBy: { createdAt: 'desc' },
  })
  if (recent) throw new AppError(429, 'SMS_COOLDOWN', '验证码刚发过，请 1 分钟后再试')
  const code = String(Math.floor(100000 + Math.random() * 900000))
  await prisma.smsCode.create({
    data: {
      phone,
      codeHash: crypto.createHash('sha256').update(code).digest('hex'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  })
  if (process.env.SMS_WEBHOOK_URL) {
    await fetch(process.env.SMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })
    return { sent: true }
  }
  return { sent: false, devCode: code }
}

export async function loginPhoneCode({ phone, code }) {
  const row = await prisma.smsCode.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } })
  const hash = crypto.createHash('sha256').update(String(code)).digest('hex')
  if (!row || row.expiresAt < new Date() || row.codeHash !== hash) {
    throw new AppError(401, 'INVALID_CODE', '验证码不正确或已过期')
  }
  await prisma.smsCode.deleteMany({ where: { phone } })
  const existing = await prisma.user.findUnique({ where: { phone } })
  if (existing) {
    await clearLoginLock(existing.id)
    return prisma.user.findUnique({ where: { id: existing.id } })
  }
  return createPlayer({ username: `p${phone}`, phone, isGuest: false })
}

export async function loginGuest() {
  return createNamedPlayer('g', { isGuest: true })
}

async function resolveOpenId(body) {
  const code = String(body.code ?? '').trim()
  if (code && config.wechatAppId && config.wechatSecret) {
    const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
    url.searchParams.set('appid', config.wechatAppId)
    url.searchParams.set('secret', config.wechatSecret)
    url.searchParams.set('js_code', code)
    url.searchParams.set('grant_type', 'authorization_code')
    const response = await fetch(url)
    const data = await response.json()
    if (!data.openid) throw new AppError(401, 'WECHAT_FAILED', '微信登录失败')
    return data.openid
  }
  const openid = String(body.openid ?? '').trim()
  if (/^[A-Za-z0-9_-]{6,64}$/.test(openid)) return openid
  throw new AppError(400, 'WECHAT_MISSING', '请从微信小程序打开后再登录')
}

async function saveWechatProfile(user, body, openid) {
  return prisma.user.update({
    where: { id: user.id },
    data: {
      openid,
      nickname: cleanNickname(body.nickname) ?? user.nickname,
      avatarUrl: cleanAvatar(body.avatarUrl) ?? user.avatarUrl,
      failedLogins: 0,
      lockedUntil: null,
    },
  })
}

export async function loginWechat(body) {
  const openid = await resolveOpenId(body)
  const existing = await prisma.user.findUnique({ where: { openid } })
  if (existing) return saveWechatProfile(existing, body, openid)
  return createNamedPlayer('wx', {
    openid,
    nickname: cleanNickname(body.nickname),
    avatarUrl: cleanAvatar(body.avatarUrl),
    isGuest: false,
  })
}

export async function bindPhone(userId, { phone, password }) {
  const taken = await prisma.user.findUnique({ where: { phone } })
  if (taken && taken.id !== userId) {
    throw new AppError(409, 'PHONE_TAKEN', '这个手机号已经绑在别的账号上')
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      phone,
      passwordHash: await hashPassword(password),
      isGuest: false,
    },
  })
  return publicUser(user)
}

export async function bindWechat(userId, body) {
  const openid = await resolveOpenId(body)
  const taken = await prisma.user.findUnique({ where: { openid } })
  if (taken && taken.id !== userId) {
    throw new AppError(409, 'OPENID_TAKEN', '这个微信已经绑在别的账号上')
  }
  const current = await prisma.user.findUnique({ where: { id: userId } })
  const user = await saveWechatProfile(current, body, openid)
  return publicUser(user)
}
