import { BASE_TYPES, SESSION_TIMEOUT_MS } from '../game/constants.js'
import { CONTINUE_DIAMONDS, DAILY_REWARD, STAMINA_GIFT, STAMINA_MAX, TUTORIALS } from '../game/economy.js'
import {
  applyHammer,
  applyShuffleTool,
  applySwap,
  applySwapTool,
  createBoard,
  pickHint,
} from '../game/engine.js'
import {
  CHAPTER_SIZE,
  DAILY_LEVEL_ID,
  MAX_LEVEL_ID,
  buildGoalProgress,
  dailyLevel,
  emptyGoalProgress,
  getLevelConfig,
  isDailyLevel,
  isGoalMet,
  localDayKey,
  starsFor,
} from '../game/levels.js'
import { rngFromState, randomSeed } from '../game/rng.js'
import { AppError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import { changeBag, coinsForStars, grantCoins, normalizeBag, spendStamina } from './walletService.js'

function asList(value) {
  return Array.isArray(value) ? value : []
}

function continueCount(session) {
  return Number(session?.tools?._continues) || 0
}

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
  const [levels, progress, playing, user] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: 'asc' } }),
    prisma.userProgress.findUnique({ where: { userId } }),
    prisma.gameSession.findMany({ where: { userId, status: 'playing' } }),
    prisma.user.findUnique({ where: { id: userId }, select: { claimedOffers: true } }),
  ])
  const playingLevelIds = playing
    .filter((item) => expireIfNeeded({ ...item }).status === 'playing')
    .map((item) => item.levelId)
  const day = localDayKey()
  const claimed = asList(user?.claimedOffers)
  const today = dailyLevel()
  return {
    levels: levels.map((level) => publicLevel(level, progress)),
    playingLevelIds,
    daily: {
      id: DAILY_LEVEL_ID,
      name: today.name,
      goalType: today.goalType,
      goalPayload: today.goalPayload,
      tried: claimed.includes(`daily-try-${day}`),
      won: claimed.includes(`daily-win-${day}`),
      playing: playingLevelIds.includes(DAILY_LEVEL_ID),
    },
  }
}

export async function getLevel(userId, levelId) {
  if (isDailyLevel(levelId)) {
    const today = dailyLevel()
    return { ...today, status: 'current', stars: 0, bestScore: 0 }
  }
  const level = await prisma.level.findUnique({ where: { id: Number(levelId) } })
  if (!level) throw new AppError(404, 'LEVEL_NOT_FOUND', '关卡不存在')
  const progress = await prisma.userProgress.findUnique({ where: { userId } })
  const view = publicLevel({ ...level, ...getLevelConfig(level.id) }, progress)
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

// 过期按最后一次操作算用时，挂着没动的那段不算；结束时间记成真正过期的那一刻
function expiredClose(session) {
  const last = new Date(session.lastMoveAt).getTime()
  return {
    status: 'expired',
    endedAt: new Date(last + SESSION_TIMEOUT_MS),
    durationMs: last - new Date(session.startedAt).getTime(),
  }
}

async function persistExpired(session) {
  if (session.status !== 'expired' || session.endedAt) return session
  return prisma.gameSession.update({
    where: { id: session.id },
    data: expiredClose(session),
  })
}

// 一局收尾：空闲太久的算过期，其余算中途退出，两种都要落用时
async function closeSessions(sessions) {
  const now = new Date()
  for (const item of sessions) {
    const expired = expireIfNeeded({ ...item }).status === 'expired'
    await prisma.gameSession.update({
      where: { id: item.id },
      data: expired
        ? expiredClose(item)
        : { status: 'quit', endedAt: now, durationMs: now.getTime() - item.startedAt.getTime() },
    })
  }
}

function serializeSession(session, level, bag, extra = {}) {
  const continues = continueCount(session)
  const stalled = session.status === 'playing' && session.movesLeft <= 0
  const canContinue = stalled && continues < CONTINUE_DIAMONDS.length
  return {
    sessionId: session.id,
    nextLevelId: isDailyLevel(level.id) || level.id >= MAX_LEVEL_ID ? null : level.id + 1,
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
    rewardCoins: Number(session.reward?.coins ?? (session.status === 'won' ? coinsForStars(session.stars) : 0)),
    rewardTools: session.reward?.tools ?? {},
    startedAt: session.startedAt,
    canUndo: Array.isArray(session.history) && session.history.length > 0,
    tools: combineTools(session.tools, bag),
    hint: session.status === 'playing' ? pickHint(session.board) : null,
    canContinue,
    continueCost: canContinue ? CONTINUE_DIAMONDS[continues] : null,
    continues,
    diamonds: extra.diamonds ?? 0,
    tutorial: extra.tutorial ?? null,
  }
}

function combineTools(sessionTools, bag) {
  const free = normalizeTools(sessionTools)
  const owned = normalizeBag(bag)
  const total = (key) => free[key] + owned[key]
  return {
    hammer: total('hammer'),
    shuffle: total('shuffle'),
    swap: total('swap'),
    plus: total('plus'),
    free,
    bag: owned,
  }
}

async function bagFor(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tools: true } })
  return normalizeBag(user?.tools)
}

async function present(session, level) {
  const config = level ?? getLevelConfig(session.levelId)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tools: true, diamonds: true, claimedOffers: true },
  })
  const claimed = asList(user?.claimedOffers)
  const tutorial = TUTORIALS.find((item) => item.levelId === config.id && !claimed.includes(item.id)) ?? null
  return serializeSession(session, config, normalizeBag(user?.tools), {
    diamonds: user?.diamonds ?? 0,
    tutorial: tutorial ? { id: tutorial.id, text: tutorial.text } : null,
  })
}

function bagLog(session) {
  return Array.isArray(session.tools?._bagSpent) ? session.tools._bagSpent : []
}

function persistTools(counts, log) {
  return {
    ...normalizeTools(counts),
    _bagSpent: log.slice(-20),
    _continues: Number(counts?._continues) || 0,
  }
}

function normalizeTools(tools) {
  const count = (value, fallback) => {
    const number = Number(value)
    return Number.isInteger(number) ? number : fallback
  }
  return {
    hammer: count(tools?.hammer, 3),
    shuffle: count(tools?.shuffle, 1),
    swap: count(tools?.swap, 1),
    plus: count(tools?.plus, 0),
  }
}

function snapshot(session) {
  return {
    board: session.board,
    rngState: session.rngState,
    score: session.score,
    movesLeft: session.movesLeft,
    moveCount: session.moveCount,
    collected: session.collected ?? {},
    goalProgress: session.goalProgress,
    tools: persistTools(session.tools, bagLog(session)),
  }
}

function pushHistory(session) {
  const history = Array.isArray(session.history) ? session.history : []
  return [...history, snapshot(session)].slice(-20)
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

function mergeAlbum(album, collected) {
  const next = { ...(album && typeof album === 'object' ? album : {}) }
  for (const type of BASE_TYPES) {
    const add = Number(collected?.[type] || 0)
    if (add) next[type] = (Number(next[type]) || 0) + add
  }
  return next
}

async function saveAlbum(userId, collected) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { album: true } })
  await prisma.user.update({ where: { id: userId }, data: { album: mergeAlbum(user?.album, collected) } })
}

async function updateProgressOnWin(userId, level, session) {
  await saveAlbum(userId, session.collected)
  if (isDailyLevel(level.id)) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const claimed = asList(user.claimedOffers)
    const day = localDayKey()
    const first = !claimed.includes(`daily-win-${day}`)
    const reward = first ? { ...DAILY_REWARD } : { coins: coinsForStars(session.stars) }
    if (reward.coins) await grantCoins(userId, reward.coins)
    if (reward.tools) await changeBag(userId, reward.tools)
    if (first) {
      await prisma.user.update({
        where: { id: userId },
        data: { claimedOffers: [...claimed, `daily-win-${day}`] },
      })
    }
    await prisma.gameSession.update({ where: { id: session.id }, data: { reward } })
    return reward
  }

  const progress = await prisma.userProgress.findUnique({ where: { userId } })
  const starsMap = { ...(progress?.levelStars ?? {}) }
  const bestMap = { ...(progress?.levelBest ?? {}) }
  const key = String(level.id)
  const prevStars = Number(starsMap[key] ?? 0)
  const coins = coinsForStars(session.stars)
  const tools = {}
  // 普通关只给金币。整章最后一关第一次拿到星级，才送一把道具，避免每关都进背包。
  const chapterBoss = level.id % CHAPTER_SIZE === 0
  if (chapterBoss && session.stars >= 3 && prevStars < 3) tools.hammer = 1
  else if (chapterBoss && session.stars >= 2 && prevStars < 2) tools.shuffle = 1
  starsMap[key] = Math.max(prevStars, session.stars)
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
  await grantCoins(userId, coins)
  if (Object.keys(tools).length) await changeBag(userId, tools)
  const reward = { coins, tools }
  await prisma.gameSession.update({ where: { id: session.id }, data: { reward } })
  return reward
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
  const config = getLevelConfig(levelId)
  if (!config) throw new AppError(404, 'LEVEL_NOT_FOUND', '关卡不存在')
  const daily = isDailyLevel(config.id)

  if (!daily) {
    const row = await prisma.level.findUnique({ where: { id: config.id } })
    if (!row) throw new AppError(404, 'LEVEL_NOT_FOUND', '关卡不存在')
    const progress = await prisma.userProgress.findUnique({ where: { userId } })
    assertUnlocked(config.id, progress?.maxCleared ?? 0)
  }

  const playing = await prisma.gameSession.findMany({
    where: { userId, status: 'playing' },
  })

  // 同一关还没下完的对局直接接着玩，刷新页面不会丢进度、也不会留下废记录
  const resumable = playing.find(
    (item) => item.levelId === config.id && expireIfNeeded({ ...item }).status === 'playing',
  )
  if (resumable) return present(resumable, config)

  if (daily) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const claimed = asList(user.claimedOffers)
    const day = localDayKey()
    if (claimed.includes(`daily-try-${day}`)) await spendStamina(userId)
    else {
      await prisma.user.update({
        where: { id: userId },
        data: { claimedOffers: [...claimed, `daily-try-${day}`] },
      })
    }
  } else {
    await spendStamina(userId)
  }
  await closeSessions(playing)

  const seed = randomSeed()
  const rng = rngFromState(seed)
  const board = createBoard(config, rng)
  const settings = await getSiteSettings()

  const session = await prisma.gameSession.create({
    data: {
      userId,
      levelId: config.id,
      board,
      rngState: rng.getState(),
      movesLeft: config.moveLimit,
      goalProgress: emptyGoalProgress(config, board),
      tools: { hammer: settings.hammer, shuffle: settings.shuffle, swap: settings.swap, plus: 0, _continues: 0 },
    },
  })

  return present(session, config)
}

export async function getSession(userId, sessionId) {
  const session = await loadOwnedSession(userId, sessionId)
  return present(session)
}

export async function playMove(userId, sessionId, move) {
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') {
    throw new AppError(409, 'SESSION_ENDED', '对局已经结束')
  }

  const config = getLevelConfig(session.levelId)
  const level = config
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
  const board = result.valid ? result.board : session.board
  const goalProgress = buildGoalProgress(level, score, collected, board)
  const won = result.valid && isGoalMet(level, score, collected, board)
  const lost = !won && movesLeft <= 0 && continueCount(session) >= CONTINUE_DIAMONDS.length
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
      history: pushHistory(session),
      tools: persistTools(session.tools, [...bagLog(session), null]),
      ...(finish ?? {}),
    },
  })

  if (finish?.status === 'won') {
    updated.reward = await updateProgressOnWin(userId, level, updated)
  }

  return { ...(await present(updated, level)), valid: result.valid, events: result.events }
}

export async function undoMove(userId, sessionId) {
  const settings = await getSiteSettings()
  if (!settings.undo) throw new AppError(409, 'UNDO_DISABLED', '后台已关闭后退')
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') {
    throw new AppError(409, 'SESSION_ENDED', '对局已经结束')
  }
  const history = Array.isArray(session.history) ? session.history : []
  const previous = history.at(-1)
  if (!previous) throw new AppError(409, 'NO_UNDO', '没有可以后退的步骤')

  const log = bagLog(session)
  const spent = log.at(-1)
  if (typeof spent === 'string') await changeBag(userId, { [spent]: 1 })

  const updated = await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      board: previous.board,
      rngState: previous.rngState,
      score: previous.score,
      movesLeft: previous.movesLeft,
      moveCount: previous.moveCount,
      collected: previous.collected ?? {},
      goalProgress: previous.goalProgress,
      tools: persistTools(previous.tools ?? session.tools, log.slice(0, -1)),
      history: history.slice(0, -1),
      lastMoveAt: new Date(),
    },
  })
  return present(updated)
}

async function spendTool(session, tool) {
  const tools = { ...normalizeTools(session.tools), _continues: continueCount(session) }
  if (tools[tool] > 0) {
    tools[tool] -= 1
    return { tools, fromBag: false }
  }
  const bag = await bagFor(session.userId)
  if (bag[tool] <= 0) throw new AppError(409, 'NO_TOOL', '这个道具已经用完了')
  await changeBag(session.userId, { [tool]: -1 })
  return { tools, fromBag: true }
}

async function settleTool(userId, session, level, result, tools, toolSpent) {
  const collected = { ...(session.collected ?? {}) }
  for (const [type, count] of Object.entries(result.collected ?? {})) {
    collected[type] = (collected[type] ?? 0) + count
  }
  const score = session.score + (result.scoreDelta ?? 0)
  const goalProgress = buildGoalProgress(level, score, collected, result.board)
  const won = isGoalMet(level, score, collected, result.board)
  const finish = won ? finishSession({ ...session, movesLeft: session.movesLeft, score }, 'won', level) : null
  const updated = await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      board: result.board,
      rngState: result.rngState,
      score,
      collected,
      goalProgress,
      tools: persistTools(tools, [...bagLog(session), toolSpent]),
      history: pushHistory(session),
      lastMoveAt: new Date(),
      ...(finish ?? {}),
    },
  })
  if (finish?.status === 'won') updated.reward = await updateProgressOnWin(userId, level, updated)
  return { ...(await present(updated, level)), events: result.events, valid: true }
}

export async function useHammer(userId, sessionId, point) {
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') throw new AppError(409, 'SESSION_ENDED', '对局已经结束')
  const level = getLevelConfig(session.levelId)
  const config = level
  const rng = rngFromState(session.rngState)
  const result = applyHammer(session.board, point, config, rng)
  if (!result.valid) throw new AppError(400, 'INVALID_TOOL', '这里不能敲')
  const spent = await spendTool(session, 'hammer')
  result.rngState = rng.getState()
  return settleTool(userId, session, level, result, spent.tools, spent.fromBag ? 'hammer' : null)
}

export async function useShuffle(userId, sessionId) {
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') throw new AppError(409, 'SESSION_ENDED', '对局已经结束')
  const spent = await spendTool(session, 'shuffle')
  const level = getLevelConfig(session.levelId)
  const config = level
  const rng = rngFromState(session.rngState)
  const result = applyShuffleTool(session.board, config, rng)
  result.rngState = rng.getState()
  return settleTool(userId, session, level, result, spent.tools, spent.fromBag ? 'shuffle' : null)
}

export async function useSwapTool(userId, sessionId, move) {
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') throw new AppError(409, 'SESSION_ENDED', '对局已经结束')
  const level = getLevelConfig(session.levelId)
  const config = level
  const rng = rngFromState(session.rngState)
  const result = applySwapTool(session.board, move, config, rng)
  if (!result.valid) throw new AppError(400, 'INVALID_TOOL', '这两个格子不能交换')
  const spent = await spendTool(session, 'swap')
  result.rngState = rng.getState()
  return settleTool(userId, session, level, result, spent.tools, spent.fromBag ? 'swap' : null)
}

export async function usePlus(userId, sessionId) {
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') throw new AppError(409, 'SESSION_ENDED', '对局已经结束')
  const spent = await spendTool(session, 'plus')
  const updated = await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      movesLeft: session.movesLeft + 5,
      tools: persistTools(spent.tools, [...bagLog(session), spent.fromBag ? 'plus' : null]),
      history: pushHistory(session),
      lastMoveAt: new Date(),
    },
  })
  return present(updated)
}

export async function continueSession(userId, sessionId) {
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') throw new AppError(409, 'SESSION_ENDED', '对局已经结束')
  if (session.movesLeft > 0) throw new AppError(409, 'NOT_READY', '这局还没到要加步的时候')
  const used = continueCount(session)
  if (used >= CONTINUE_DIAMONDS.length) throw new AppError(409, 'NO_CONTINUE', '这局不能再加步了')
  const cost = CONTINUE_DIAMONDS[used]
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if ((user.diamonds ?? 0) < cost) throw new AppError(400, 'NOT_ENOUGH', `钻石不够，加五步需要 ${cost} 钻石`)
  await prisma.user.update({ where: { id: userId }, data: { diamonds: { decrement: cost } } })
  const tools = { ...session.tools, _continues: used + 1 }
  const updated = await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      movesLeft: session.movesLeft + 5,
      tools: persistTools(tools, bagLog(session)),
      lastMoveAt: new Date(),
    },
  })
  return present(updated)
}

export async function giveUpSession(userId, sessionId) {
  const session = await loadOwnedSession(userId, sessionId)
  if (session.status !== 'playing') return present(session)
  const level = getLevelConfig(session.levelId)
  const finish = finishSession(session, 'lost', level)
  const updated = await prisma.gameSession.update({
    where: { id: session.id },
    data: finish,
  })
  return present(updated)
}

export async function dismissTutorial(userId, tutorialId) {
  const item = TUTORIALS.find((entry) => entry.id === tutorialId)
  if (!item) throw new AppError(404, 'OFFER_NOT_FOUND', '没有这个提示')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const claimed = asList(user.claimedOffers)
  if (!claimed.includes(item.id)) {
    await prisma.user.update({
      where: { id: userId },
      data: { claimedOffers: [...claimed, item.id] },
    })
  }
  return { id: item.id }
}

// 星星总数存在 progress.levelStars 这个 JSON 里，数据库排不了序，
// 只能全量拉回来在内存里排完再切页。
export async function listLeaderboard(userId, { page = 1, pageSize = 50, scope = 'all', levelId = null } = {}) {
  const me = await prisma.user.findUnique({ where: { id: userId } })
  const friendIds = new Set(Array.isArray(me?.friends) ? me.friends : [])
  const users = await prisma.user.findMany({ include: { progress: true } })
  let rows = users.map((user) => {
    const stars = Object.values(user.progress?.levelStars ?? {}).reduce(
      (sum, value) => sum + Number(value ?? 0),
      0,
    )
    const best = levelId ? user.progress?.levelBest?.[String(levelId)] : null
    return {
      id: user.id,
      username: user.nickname || user.username,
      maxCleared: user.progress?.maxCleared ?? 0,
      totalStars: stars,
      score: levelId ? Number(best?.score ?? 0) : null,
      me: user.id === userId,
    }
  })

  if (levelId) {
    rows = rows.filter((row) => row.score > 0).sort((a, b) => b.score - a.score || b.totalStars - a.totalStars)
  } else {
    rows = rows.sort((a, b) => b.totalStars - a.totalStars || b.maxCleared - a.maxCleared)
  }
  if (scope === 'friends') {
    rows = rows.filter((row) => row.me || friendIds.has(row.id))
  }
  rows = rows.map((row, index) => {
    const item = { rank: index + 1, ...row }
    delete item.id
    return item
  })

  const start = (page - 1) * pageSize
  return {
    items: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
    scope,
    levelId: levelId || null,
    me: rows.find((row) => row.me) ?? null,
  }
}

async function findPlayer(name) {
  const trimmed = name.trim()
  const matches = await prisma.user.findMany({
    where: { OR: [{ username: trimmed }, { nickname: trimmed }] },
  })
  if (matches.length === 0) throw new AppError(404, 'USER_NOT_FOUND', '找不到这个玩家')
  if (matches.length > 1) throw new AppError(409, 'AMBIGUOUS', '有重名，请改填账号名')
  return matches[0]
}

const ALBUM_NAME = { bear: '小熊', cat: '小猫', fox: '狐狸', frog: '青蛙', chick: '小鸡', owl: '猫头鹰' }

export async function getAlbum(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { album: true } })
  const album = user?.album && typeof user.album === 'object' ? user.album : {}
  return {
    items: BASE_TYPES.map((id) => ({
      id,
      name: ALBUM_NAME[id],
      count: Number(album[id]) || 0,
    })),
  }
}

export async function giftStamina(userId, name) {
  const friend = await findPlayer(name)
  if (friend.id === userId) throw new AppError(400, 'INVALID_FRIEND', '不能送给自己')
  const me = await prisma.user.findUnique({ where: { id: userId } })
  const mine = asList(me.friends)
  if (!mine.includes(friend.id)) throw new AppError(400, 'NOT_FRIEND', '还不是好友')
  const day = localDayKey()
  const key = `stamina-gift-${friend.id}-${day}`
  const claimed = asList(me.claimedOffers)
  if (claimed.includes(key)) throw new AppError(409, 'ALREADY_CLAIMED', '今天已经送过了')
  if ((friend.stamina ?? 0) >= STAMINA_MAX) throw new AppError(409, 'STAMINA_FULL', '对方体力是满的')
  await prisma.$transaction([
    prisma.user.update({
      where: { id: friend.id },
      data: { stamina: { increment: STAMINA_GIFT } },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { claimedOffers: [...claimed, key] },
    }),
  ])
  return { username: friend.nickname || friend.username }
}

export async function addFriend(userId, name) {
  const friend = await findPlayer(name)
  if (friend.id === userId) throw new AppError(400, 'INVALID_FRIEND', '不能加自己')
  const me = await prisma.user.findUnique({ where: { id: userId } })
  const mine = Array.isArray(me.friends) ? [...me.friends] : []
  const theirs = Array.isArray(friend.friends) ? [...friend.friends] : []
  if (!mine.includes(friend.id)) mine.push(friend.id)
  if (!theirs.includes(userId)) theirs.push(userId)
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { friends: mine } }),
    prisma.user.update({ where: { id: friend.id }, data: { friends: theirs } }),
  ])
  return { username: friend.nickname || friend.username }
}

export async function removeFriend(userId, name) {
  const friend = await findPlayer(name)
  const me = await prisma.user.findUnique({ where: { id: userId } })
  const mine = (Array.isArray(me.friends) ? me.friends : []).filter((id) => id !== friend.id)
  const theirs = (Array.isArray(friend.friends) ? friend.friends : []).filter((id) => id !== userId)
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { friends: mine } }),
    prisma.user.update({ where: { id: friend.id }, data: { friends: theirs } }),
  ])
  return { username: friend.nickname || friend.username }
}

export async function getThemeSetting() {
  return getSiteSettings()
}

const SITE_DEFAULTS = { sound: true, undo: true, hammer: 3, shuffle: 1, swap: 1 }

export async function getSiteSettings() {
  const [themeRow, siteRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'theme' } }),
    prisma.setting.findUnique({ where: { key: 'site' } }),
  ])
  const site = siteRow?.value ?? {}
  return {
    theme: themeRow?.value?.name === 'forest' ? 'forest' : 'candy',
    sound: site.sound !== false,
    undo: site.undo !== false,
    hammer: clampCount(site.hammer, SITE_DEFAULTS.hammer),
    shuffle: clampCount(site.shuffle, SITE_DEFAULTS.shuffle),
    swap: clampCount(site.swap, SITE_DEFAULTS.swap),
  }
}

function clampCount(value, fallback) {
  const number = Number(value)
  if (!Number.isInteger(number)) return fallback
  return Math.min(9, Math.max(0, number))
}

export async function setSiteSettings(input) {
  const current = await getSiteSettings()
  const next = {
    theme: input.theme === 'forest' || input.theme === 'candy' ? input.theme : current.theme,
    sound: typeof input.sound === 'boolean' ? input.sound : current.sound,
    undo: typeof input.undo === 'boolean' ? input.undo : current.undo,
    hammer: input.hammer == null ? current.hammer : clampCount(input.hammer, current.hammer),
    shuffle: input.shuffle == null ? current.shuffle : clampCount(input.shuffle, current.shuffle),
    swap: input.swap == null ? current.swap : clampCount(input.swap, current.swap),
  }
  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: 'theme' },
      update: { value: { name: next.theme } },
      create: { key: 'theme', value: { name: next.theme } },
    }),
    prisma.setting.upsert({
      where: { key: 'site' },
      update: { value: { sound: next.sound, undo: next.undo, hammer: next.hammer, shuffle: next.shuffle, swap: next.swap } },
      create: { key: 'site', value: { sound: next.sound, undo: next.undo, hammer: next.hammer, shuffle: next.shuffle, swap: next.swap } },
    }),
  ])
  return next
}

export async function setThemeSetting(name) {
  return setSiteSettings({ theme: name })
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
  return present(updated)
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
  names[DAILY_LEVEL_ID] = '每日挑战'
  const items = sessions.map((session) => ({
    id: session.id,
    levelId: session.levelId,
    levelName: names[session.levelId] ?? (isDailyLevel(session.levelId) ? '每日挑战' : `第 ${session.levelId} 关`),
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
    username: me.nickname || me.username,
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
