import { AppError } from '../lib/errors.js'
import { assertPhotoExists, removeCommunityPhoto } from '../lib/photos.js'
import { prisma } from '../lib/prisma.js'
import { getLevelConfig, isDailyLevel } from '../game/levels.js'

const POST_DAILY_MAX = 8
const COMMENT_DAILY_MAX = 30

function asList(value) {
  return Array.isArray(value) ? value : []
}

function cleanText(value, max) {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, max)
}

function dayStart() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return start
}

function displayName(user) {
  return user.nickname || user.username
}

function levelName(levelId) {
  if (levelId == null) return null
  if (isDailyLevel(levelId)) return '每日挑战'
  const config = getLevelConfig(levelId)
  return config ? `第 ${config.id} 关 ${config.name}` : `第 ${levelId} 关`
}

function shareBody(session) {
  const where = isDailyLevel(session.levelId) ? '每日挑战' : `第 ${session.levelId} 关`
  if (session.status === 'won') {
    return `过了${where}，${session.stars} 星，${session.score} 分。`
  }
  return `${where}打了 ${session.score} 分。`
}

function publicAuthor(user) {
  return {
    username: user.username,
    name: displayName(user),
    avatarUrl: user.avatarUrl ?? null,
  }
}

function publicPost(post, userId) {
  return {
    id: post.id,
    body: post.body,
    levelId: post.levelId,
    levelName: levelName(post.levelId),
    score: post.score,
    stars: post.stars,
    result: post.result,
    imageUrl: post.imageUrl ?? null,
    createdAt: post.createdAt,
    mine: post.userId === userId,
    liked: Array.isArray(post.likes) && post.likes.length > 0,
    likeCount: post._count?.likes ?? 0,
    commentCount: post._count?.comments ?? 0,
    author: publicAuthor(post.user),
  }
}

function publicComment(item, userId) {
  return {
    id: item.id,
    body: item.body,
    createdAt: item.createdAt,
    mine: item.userId === userId,
    author: publicAuthor(item.user),
  }
}

const postInclude = (userId) => ({
  user: { select: { username: true, nickname: true, avatarUrl: true } },
  likes: { where: { userId }, select: { userId: true } },
  _count: { select: { likes: true, comments: true } },
})

async function loadPost(id, userId) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: postInclude(userId),
  })
  if (!post) throw new AppError(404, 'POST_NOT_FOUND', '这条动态不存在')
  return post
}

export async function listPosts(userId, { page = 1, pageSize = 12, scope = 'all' } = {}) {
  let where = {}
  if (scope === 'me') where = { userId }
  else if (scope === 'friends') {
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { friends: true } })
    const ids = new Set(asList(me?.friends))
    ids.add(userId)
    where = { userId: { in: [...ids] } }
  }

  const [total, rows] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: postInclude(userId),
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return {
    items: rows.map((row) => publicPost(row, userId)),
    total,
    page,
    pageSize,
    scope,
  }
}

export async function createPost(userId, input) {
  const body = cleanText(input.body, 140)
  let levelId = input.levelId
  let score = null
  let stars = null
  let result = null
  let sessionId = input.sessionId ?? null
  let text = body
  const imageUrl = input.imageUrl ?? null

  if (sessionId) {
    const existing = await prisma.post.findUnique({ where: { sessionId } })
    if (existing) throw new AppError(409, 'ALREADY_CLAIMED', '这局已经发过了')
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
    if (!session || session.userId !== userId) throw new AppError(403, 'FORBIDDEN', '不能发别人的对局')
    if (session.status === 'playing') throw new AppError(409, 'SESSION_PLAYING', '这局还没结束')
    levelId = session.levelId
    score = session.score
    stars = session.stars
    result = session.status
    if (!text) text = shareBody(session)
  }

  if (imageUrl) await assertPhotoExists(imageUrl)
  if (!text && !imageUrl) throw new AppError(400, 'VALIDATION_ERROR', '写一句或加一张照片')

  if (levelId != null) {
    const config = getLevelConfig(levelId)
    if (!config) throw new AppError(404, 'LEVEL_NOT_FOUND', '关卡不存在')
  }

  const posted = await prisma.post.count({
    where: { userId, createdAt: { gte: dayStart() } },
  })
  if (posted >= POST_DAILY_MAX) throw new AppError(429, 'TOO_MANY', '今天发得够多了，明天再来')

  const post = await prisma.post.create({
    data: { userId, body: text, imageUrl, levelId: levelId ?? null, score, stars, result, sessionId },
    include: postInclude(userId),
  })
  return publicPost(post, userId)
}

export async function likePost(userId, postId) {
  await loadPost(postId, userId)
  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  })
  if (existing) {
    await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } })
  } else {
    await prisma.postLike.create({ data: { postId, userId } })
  }
  return publicPost(await loadPost(postId, userId), userId)
}

export async function deletePost(userId, postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new AppError(404, 'POST_NOT_FOUND', '这条动态不存在')
  if (post.userId !== userId) throw new AppError(403, 'FORBIDDEN', '只能删自己的动态')
  await prisma.post.delete({ where: { id: postId } })
  await removeCommunityPhoto(post.imageUrl)
  return { id: postId }
}

export async function listComments(userId, postId) {
  await loadPost(postId, userId)
  const rows = await prisma.postComment.findMany({
    where: { postId },
    include: { user: { select: { username: true, nickname: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })
  return { items: rows.map((row) => publicComment(row, userId)) }
}

export async function createComment(userId, postId, raw) {
  await loadPost(postId, userId)
  const body = cleanText(raw, 80)
  if (!body) throw new AppError(400, 'VALIDATION_ERROR', '写一句再说')
  const posted = await prisma.postComment.count({
    where: { userId, createdAt: { gte: dayStart() } },
  })
  if (posted >= COMMENT_DAILY_MAX) throw new AppError(429, 'TOO_MANY', '今天评得够多了，明天再来')
  const item = await prisma.postComment.create({
    data: { postId, userId, body },
    include: { user: { select: { username: true, nickname: true, avatarUrl: true } } },
  })
  return publicComment(item, userId)
}

export async function deleteComment(userId, commentId) {
  const item = await prisma.postComment.findUnique({ where: { id: commentId } })
  if (!item) throw new AppError(404, 'POST_NOT_FOUND', '这条评论不存在')
  if (item.userId !== userId) throw new AppError(403, 'FORBIDDEN', '只能删自己的评论')
  await prisma.postComment.delete({ where: { id: commentId } })
  return { id: commentId }
}
