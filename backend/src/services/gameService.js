import { SESSION_TIMEOUT_MS } from '../game/constants.js'
import {
  applySwap,
  createBoard,
} from '../game/engine.js'
import {
  MAX_LEVEL_ID,
  buildGoalProgress,
  emptyGoalProgress,
  getLevelConfig,
  isGoalMet,
  starsFor,
} from '../game/levels.js'
import { rngFromState, randomSeed } from '../game/rng.js'
import { AppError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'

function levelStatus(levelId, maxCleared) {
  if (levelId > maxCleared + 1) return 'locked'
  if (levelId <= maxCleared) return 'cleared'
  return 'current'
}

function assertUnlocked(levelId, maxCleared) {
  if (levelId > maxCleared + 1) {
    throw new AppError(403, 'LEVEL_LOCKED', '请先通过上一关')
  }
}

export function publicLevel(level, progress) {
  const maxCleared = progress?.maxCleared ?? 0
  const starsMap = progress?.levelStars ?? {}
  const bestMap = progress?.levelBest ?? {}
  const best = bestMap[String(level.id)] ?? {}
  return {
    id: level.id,
    name: level.name,
    rows: level.rows,
    cols: level.cols,
    colorCount: level.colorCount,
    moveLimit: level.moveLimit,
    goalType: level.goalType,
    goalPayload: level.goalPayload,
    twoStarMoves: level.twoStarMoves,
    threeStarMoves: level.threeStarMoves,
    status: levelStatus(level.id, maxCleared),
    stars: starsMap[String(level.id)] ?? 0,
    bestScore: best.score ?? 0,
  }
}

export async function listLevels(userId) {
  const [levels, progress] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: 'asc' } }),
    prisma.userProgress.findUnique({ where: { userId } }),
  ])
  return { levels: levels.map((level) => publicLevel(level, progress)) }
}

export async function getLevel(userId, levelId) {
  const level = await prisma.level.findUnique({ where: { id: Number(levelId) } })
  if (!level) throw new AppError(404, 'LEVEL_NOT_FOUND', '关卡不存在')
  const progress = await prisma.userProgress.findUnique({ where: { userId } })
  const view = publicLevel(level, progress)
  if (view.status === 'locked') {
    throw new AppError(403, 'LEVEL_LOCKED', '请先通过上一关')
  }
  return view
}

function expireIfNeeded(session) {
  if (session.status !== 'playing') return session
  const idle = Date.now() - new Date(session.lastMoveAt).getTime()
  if (idle > SESSION_TIMEOUT_MS) {
    session.status = 'expired'
  }
  return session
}

async function persistExpired(session) {
  if (session.status !== 'expired' || session.endedAt) return session
  const endedAt = new Date()
  return prisma.gameSession.update({
    where: { id: session.id },
    data: {
      status: 'expired',
      endedAt,
      durationMs: endedAt.getTime() - session.startedAt.getTime(),
    },
  })
}

// 一局收尾：空闲太久的算过期，其余算中途退出，两种都要落用时
async function closeSessions(sessions) {
  const now = new Date()
  for (const item of sessions) {
    const expired = expireIfNeeded({ ...item }).status === 'expired'
    await prisma.gameSession.update({
      where: { id: item.id },
      data: {
        status: expired ? 'expired' : 'quit',
        endedAt: now,
        durationMs: now.getTime() - item.startedAt.getTime(),
      },
    })
  }
}

function serializeSession(session, level) {
  return {
    sessionId: session.id,
    nextLevelId: level.id < MAX_LEVEL_ID ? level.id + 1 : null,
    level: {
      id: level.id,
      name: level.name,
      rows: level.rows,
      cols: level.cols,
      colorCount: level.colorCount,
      moveLimit: level.moveLimit,
      goalType: level.goalType,
      goalPayload: level.goalPayload,
      twoStarMoves: level.twoStarMoves,
      threeStarMoves: level.threeStarMoves,
    },
    board: session.board,
    score: session.score,
    movesLeft: session.movesLeft,
    moveCount: session.moveCount,
    goalProgress: session.goalProgress,
    status: session.status,
    stars: session.stars,
    startedAt: session.startedAt,
  }
}

async function loadOwnedSession(userId, sessionId) {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session || session.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', '不能操作该对局')
  }
  const maybeExpired = expireIfNeeded(session)
  if (maybeExpired.status === 'expired' && !session.endedAt) {
    return persistExpired(maybeExpired)
  }
  return maybeExpired
}

async function updateProgressOnWin(userId, level, session) {
  const progress = await prisma.userProgress.findUnique({ where: { userId } })
  const starsMap = { ...(progress?.levelStars ?? {}) }
  const bestMap = { ...(progress?.levelBest ?? {}) }
  const key = String(level.id)
  starsMap[key] = Math.max(Number(starsMap[key] ?? 0), session.stars)
  const prevBest = bestMap[key] ?? {}
  bestMap[key] = {
    score: Math.max(Number(prevBest.score ?? 0), session.score),
    stars: starsMap[key],
    movesLeft: session.movesLeft,
  }
  await prisma.userProgress.update({
    where: { userId },
    data: {
      maxCleared: Math.max(progress?.maxCleared ?? 0, level.id),
      levelStars: starsMap,
      levelBest: bestMap,
    },
  })
}

function finishSession(session, status, level) {
  const endedAt = new Date()
  const won = status === 'won'
  const stars = starsFor(won, session.movesLeft, level)
  return {
    status,
    stars,
    endedAt,
    durationMs: endedAt.getTime() - new Date(session.startedAt).getTime(),
  }
}

export async function createSession(userId, levelId) {
  const level = await prisma.level.findUnique({ where: { id: Number(levelId) } })
  if (!level) throw new AppError(404, 'LEVEL_NOT_FOUND', '关卡不存在')

  const progress = await prisma.userProgress.findUnique({ where: { userId } })
  assertUnlocked(level.id, progress?.maxCleared ?? 0)

  const playing = await prisma.gameSession.findMany({
    where: { userId, status: 'playing' },
  })

  // 同一关还没下完的对局直接接着玩，刷新页面不会丢进度、也不会留下废记录
  const resumable = playing.find(
    (item) => item.levelId === level.id && expireIfNeeded({ ...item }).status === 'playing',
  )
  if (resumable) return serializeSession(resumable, level)

  await closeSessions(playing)

  const seed = randomSeed()
  const rng = rngFromState(seed)
  const config = getLevelConfig(level.id)
  const board = createBoard(config, rng)

  const session = await prisma.gameSession.create({
    data: {
      userId,
      levelId: level.id,
      board,
      rngState: rng.getState(),
      movesLeft: level.moveLimit,
      goalProgress: emptyGoalProgress(level),
    },
  })

  return serializeSession(session, level)
}

export async function getSession(userId, sessionId) {
  const session = await loadOwnedSession(userId, sessionId)
  const level = await prisma.level.findUnique({ where: { id: session.levelId } })
  return serializeSession(session, level)
}

export async function playMove(userId, sessionId, move) {
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') {
    throw new AppError(409, 'SESSION_ENDED', '对局已经结束')
  }

  const level = await prisma.level.findUnique({ where: { id: session.levelId } })
  const config = getLevelConfig(level.id)
  const rng = rngFromState(session.rngState)
  const result = applySwap(session.board, move, config, rng)
  const adjacent =
    Math.abs(Number(move.x1) - Number(move.x2)) + Math.abs(Number(move.y1) - Number(move.y2)) === 1

  // 不相邻的请求不算一步；相邻但没消掉的交换会弹回，仍然扣步。
  if (!result.valid && !adjacent) {
    return {
      valid: false,
      events: [],
      board: session.board,
      score: session.score,
      movesLeft: session.movesLeft,
      goalProgress: session.goalProgress,
      status: session.status,
      stars: session.stars,
    }
  }

  const collected = { ...(session.collected ?? {}) }
  if (result.valid) {
    for (const [type, count] of Object.entries(result.collected)) {
      collected[type] = (collected[type] ?? 0) + count
    }
  }

  const score = result.valid ? session.score + result.scoreDelta : session.score
  const movesLeft = session.movesLeft - 1
  const goalProgress = buildGoalProgress(level, score, collected)
  const won = result.valid && isGoalMet(level, score, collected)
  const lost = !won && movesLeft <= 0
  const finish = won
    ? finishSession({ ...session, movesLeft, score }, 'won', level)
    : lost
      ? finishSession({ ...session, movesLeft, score }, 'lost', level)
      : null

  const updated = await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      board: result.valid ? result.board : session.board,
      rngState: result.valid ? rng.getState() : session.rngState,
      score,
      movesLeft,
      moveCount: session.moveCount + 1,
      collected,
      goalProgress,
      lastMoveAt: new Date(),
      ...(finish ?? {}),
    },
  })

  if (finish?.status === 'won') {
    await updateProgressOnWin(userId, level, updated)
  }

  return {
    valid: result.valid,
    events: result.events,
    board: updated.board,
    score: updated.score,
    movesLeft: updated.movesLeft,
    goalProgress: updated.goalProgress,
    status: updated.status,
    stars: updated.stars,
  }
}

export async function quitSession(userId, sessionId) {
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') {
    throw new AppError(409, 'SESSION_ENDED', '对局已经结束')
  }
  const now = new Date()
  const updated = await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      status: 'quit',
      endedAt: now,
      durationMs: now.getTime() - session.startedAt.getTime(),
    },
  })
  const level = await prisma.level.findUnique({ where: { id: session.levelId } })
  return serializeSession(updated, level)
}

export async function listRecords(userId, { page, pageSize, result, levelId }) {
  const where = {
    userId,
    status: { not: 'playing' },
  }
  if (result) where.status = result
  if (levelId) where.levelId = levelId

  const [total, sessions, levels] = await Promise.all([
    prisma.gameSession.count({ where }),
    prisma.gameSession.findMany({
      where,
      orderBy: { endedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.level.findMany(),
  ])

  const names = Object.fromEntries(levels.map((l) => [l.id, l.name]))
  const items = sessions.map((session) => ({
    id: session.id,
    levelId: session.levelId,
    levelName: names[session.levelId] ?? `第 ${session.levelId} 关`,
    status: session.status,
    score: session.score,
    stars: session.stars,
    moveCount: session.moveCount,
    moveLimit: levels.find((l) => l.id === session.levelId)?.moveLimit ?? session.moveCount,
    durationMs: session.durationMs,
    endedAt: session.endedAt,
  }))

  return { items, total, page, pageSize }
}

export async function getStats(userId) {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    include: { progress: true },
  })
  const ended = await prisma.gameSession.findMany({
    where: { userId, status: { not: 'playing' } },
    select: { status: true, score: true, stars: true, durationMs: true, levelId: true },
  })

  return {
    username: me.username,
    createdAt: me.createdAt,
    totalGames: ended.length,
    wins: ended.filter((s) => s.status === 'won').length,
    losses: ended.filter((s) => s.status === 'lost').length,
    quits: ended.filter((s) => s.status === 'quit').length,
    maxCleared: me.progress?.maxCleared ?? 0,
    bestScore: ended.reduce((max, s) => Math.max(max, s.score), 0),
    totalStars: Object.values(me.progress?.levelStars ?? {}).reduce(
      (sum, stars) => sum + Number(stars ?? 0),
      0,
    ),
  }
}
