import { BAG, CHECK_IN_COINS, DAILY_TASKS, EVENTS, RECHARGE, SHOP, STAMINA_MAX, STAMINA_REGEN_MS, STREAK_BONUS, STREAK_GOAL, WIN_COINS } from '../game/economy.js'
import { AppError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'
import crypto from 'crypto'
import { buildAlipayUrl, buildWechatH5Url, paymentChannels } from './payService.js'

function asList(value) {
  return Array.isArray(value) ? value : []
}

async function ensureWelcome(userId) {
  const count = await prisma.mail.count({ where: { userId } })
  if (count > 0) return
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return
  const claimed = asList(user.claimedOffers)
  if (claimed.includes('welcome-mail')) return
  await prisma.$transaction([
    prisma.mail.create({
      data: {
        userId,
        title: '欢迎来到开心消消乐',
        body: '送你一点金币和钻石，可以在商店换成体力和礼包。',
        reward: { coins: 200, diamonds: 30 },
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { claimedOffers: [...claimed, 'welcome-mail'] },
    }),
  ])
}

export async function loadWallet(userId) {
  await ensureWelcome(userId)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(401, 'UNAUTHORIZED', '请先登录')

  const now = Date.now()
  let stamina = user.stamina
  let staminaAt = new Date(user.staminaAt).getTime()
  if (stamina < STAMINA_MAX) {
    const gained = Math.floor((now - staminaAt) / STAMINA_REGEN_MS)
    if (gained > 0) {
      stamina = Math.min(STAMINA_MAX, stamina + gained)
      staminaAt = stamina >= STAMINA_MAX ? now : staminaAt + gained * STAMINA_REGEN_MS
      await prisma.user.update({
        where: { id: userId },
        data: { stamina, staminaAt: new Date(staminaAt) },
      })
    }
  }

  const unread = await prisma.mail.count({ where: { userId, claimed: false } })
  const checkedIn = Boolean(user.lastCheckIn && new Date(user.lastCheckIn).toDateString() === new Date().toDateString())
  const claimed = asList(user.claimedOffers)
  const progress = await todayProgress(userId)
  const today = dayKey(new Date())
  const activity =
    (checkedIn ? 0 : 1) +
    liveEvents().filter((event) => !claimed.includes(event.id)).length +
    DAILY_TASKS.filter((task) => progress[task.id] && !claimed.includes(`task-${task.id}-${today}`)).length
  return {
    stamina,
    staminaMax: STAMINA_MAX,
    nextStaminaMs: stamina >= STAMINA_MAX ? null : STAMINA_REGEN_MS - ((now - staminaAt) % STAMINA_REGEN_MS),
    coins: user.coins,
    diamonds: user.diamonds,
    unread,
    activity,
    notices: unread + activity,
    checkedIn,
    checkInCoins: CHECK_IN_COINS,
    streak: user.checkStreak ?? 0,
  }
}

export async function spendStamina(userId) {
  const wallet = await loadWallet(userId)
  if (wallet.stamina <= 0) {
    throw new AppError(400, 'NO_STAMINA', '体力不足，过一会儿会恢复，也可以去商店补充')
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      stamina: { decrement: 1 },
      ...(wallet.stamina >= STAMINA_MAX ? { staminaAt: new Date() } : {}),
    },
  })
}

export function coinsForStars(stars) {
  return WIN_COINS[stars] ?? 0
}

export async function grantCoins(userId, amount) {
  if (!amount) return
  await prisma.user.update({
    where: { id: userId },
    data: { coins: { increment: amount } },
  })
}

export function normalizeBag(tools) {
  const count = (value) => {
    const number = Number(value)
    return Number.isInteger(number) && number > 0 ? number : 0
  }
  return {
    hammer: count(tools?.hammer),
    shuffle: count(tools?.shuffle),
    swap: count(tools?.swap),
    plus: count(tools?.plus),
  }
}

export async function getBag(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const bag = normalizeBag(user?.tools)
  return {
    items: BAG.map((item) => ({ ...item, count: bag[item.id] ?? 0 })),
  }
}

export async function changeBag(userId, delta) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const bag = normalizeBag(user?.tools)
  for (const [key, count] of Object.entries(delta ?? {})) {
    if (!(key in bag)) continue
    bag[key] = Math.max(0, bag[key] + Number(count || 0))
  }
  await prisma.user.update({ where: { id: userId }, data: { tools: bag } })
  return bag
}

function applyReward(data, reward, user) {
  if (reward.coins) data.coins = { increment: reward.coins }
  if (reward.diamonds) data.diamonds = { increment: reward.diamonds }
  if (reward.stamina) data.stamina = { increment: reward.stamina }
  if (reward.tools) {
    const bag = normalizeBag(user?.tools)
    for (const [key, count] of Object.entries(reward.tools)) {
      if (key in bag && count) bag[key] += Number(count)
    }
    data.tools = bag
  }
}

export function listShop(claimedOffers) {
  const claimed = new Set(asList(claimedOffers))
  return SHOP.map((item) => ({ ...item, claimed: Boolean(item.once && claimed.has(item.id)) }))
}

export async function getShop(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return { items: listShop(user.claimedOffers), recharge: RECHARGE, channels: paymentChannels(), wallet: await loadWallet(userId) }
}

export async function buyOffer(userId, offerId) {
  const offer = SHOP.find((item) => item.id === offerId)
  if (!offer) throw new AppError(404, 'OFFER_NOT_FOUND', '商品不存在')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const claimed = asList(user.claimedOffers)
  if (offer.once && claimed.includes(offer.id)) {
    throw new AppError(409, 'ALREADY_CLAIMED', '这个已经领过了')
  }
  if (offer.currency === 'coins' && user.coins < offer.price) {
    throw new AppError(400, 'NOT_ENOUGH', '金币不够')
  }
  if (offer.currency === 'diamonds' && user.diamonds < offer.price) {
    throw new AppError(400, 'NOT_ENOUGH', '钻石不够')
  }
  const data = {}
  applyReward(data, offer.reward, user)
  if (offer.currency === 'coins') data.coins = { increment: (offer.reward.coins ?? 0) - offer.price }
  if (offer.currency === 'diamonds') data.diamonds = { increment: (offer.reward.diamonds ?? 0) - offer.price }
  if (offer.once) data.claimedOffers = [...claimed, offer.id]
  await prisma.user.update({ where: { id: userId }, data })
  return getShop(userId)
}

export async function listMail(userId) {
  await ensureWelcome(userId)
  const items = await prisma.mail.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return { items, unread: items.filter((item) => !item.claimed).length }
}

async function claimMailRecord(userId, mail) {
  if (!mail || mail.userId !== userId) throw new AppError(404, 'MAIL_NOT_FOUND', '邮件不存在')
  if (mail.claimed) throw new AppError(409, 'ALREADY_CLAIMED', '这封邮件已经领过了')
  const reward = mail.reward ?? {}
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const data = {}
  applyReward(data, reward, user)
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data }),
    prisma.mail.update({ where: { id: mail.id }, data: { claimed: true } }),
  ])
}

export async function claimMail(userId, mailId) {
  const mail = await prisma.mail.findUnique({ where: { id: mailId } })
  await claimMailRecord(userId, mail)
  return listMail(userId)
}

export async function claimAllMail(userId) {
  const mails = await prisma.mail.findMany({ where: { userId, claimed: false } })
  for (const mail of mails) {
    await claimMailRecord(userId, mail)
  }
  return listMail(userId)
}

export async function deleteMail(userId, mailId) {
  const mail = await prisma.mail.findUnique({ where: { id: mailId } })
  if (!mail || mail.userId !== userId) throw new AppError(404, 'MAIL_NOT_FOUND', '邮件不存在')
  if (!mail.claimed) throw new AppError(400, 'MAIL_UNCLAIMED', '还没领取的邮件不能删除')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const claimed = asList(user?.claimedOffers)
  await prisma.$transaction([
    prisma.mail.delete({ where: { id: mail.id } }),
    ...(claimed.includes('welcome-mail')
      ? []
      : [prisma.user.update({ where: { id: userId }, data: { claimedOffers: [...claimed, 'welcome-mail'] } })]),
  ])
  return listMail(userId)
}

function dayKey(date) {
  const value = new Date(date)
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`
}

function yesterdayKey(date) {
  const value = new Date(date)
  value.setDate(value.getDate() - 1)
  return dayKey(value)
}

export function liveEvents(now = new Date()) {
  return EVENTS.flatMap((event) => {
    const start = new Date(event.start)
    const end = new Date(start.getTime() + event.days * 24 * 60 * 60 * 1000)
    if (now < start || now >= end) return []
    return [{ ...event, endsAt: end.toISOString() }]
  })
}

async function todayProgress(userId) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const sessions = await prisma.gameSession.findMany({
    where: { userId, startedAt: { gte: start } },
    select: { status: true, score: true },
  })
  return {
    play: sessions.length > 0 ? 1 : 0,
    win: sessions.some((item) => item.status === 'won') ? 1 : 0,
    score: sessions.some((item) => item.score >= 1000) ? 1 : 0,
  }
}

export async function getActivity(userId) {
  const wallet = await loadWallet(userId)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const claimed = asList(user?.claimedOffers)
  const progress = await todayProgress(userId)
  const today = dayKey(new Date())
  return {
    checkedIn: wallet.checkedIn,
    checkInCoins: wallet.checkInCoins,
    streak: wallet.streak,
    streakGoal: STREAK_GOAL,
    streakBonus: STREAK_BONUS,
    events: liveEvents()
      .sort((a, b) => new Date(b.start) - new Date(a.start))
      .map((event) => ({
        id: event.id,
        name: event.name,
        text: event.text,
        start: event.start,
        endsAt: event.endsAt,
        claimed: claimed.includes(event.id),
      })),
    tasks: DAILY_TASKS.map((task) => ({
      ...task,
      done: progress[task.id] > 0,
      claimed: claimed.includes(`task-${task.id}-${today}`),
    })),
  }
}

export async function checkIn(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const now = new Date()
  if (user.lastCheckIn && dayKey(user.lastCheckIn) === dayKey(now)) {
    throw new AppError(409, 'ALREADY_CLAIMED', '今天已经签过到了')
  }
  const streak = user.lastCheckIn && dayKey(user.lastCheckIn) === yesterdayKey(now) ? (user.checkStreak ?? 0) + 1 : 1
  const bonus = streak % STREAK_GOAL === 0 ? STREAK_BONUS : 0
  await prisma.user.update({
    where: { id: userId },
    data: {
      coins: { increment: CHECK_IN_COINS + bonus },
      lastCheckIn: now,
      checkStreak: streak,
    },
  })
  const wallet = await loadWallet(userId)
  return { ...wallet, bonus }
}

export async function claimEvent(userId, eventId) {
  const event = liveEvents().find((item) => item.id === eventId)
  if (!event) throw new AppError(404, 'OFFER_NOT_FOUND', '活动不在进行中')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const claimed = asList(user.claimedOffers)
  if (claimed.includes(event.id)) throw new AppError(409, 'ALREADY_CLAIMED', '这个活动已经领过了')
  const data = { claimedOffers: [...claimed, event.id] }
  applyReward(data, event.reward, user)
  await prisma.user.update({ where: { id: userId }, data })
  return getActivity(userId)
}

export async function claimTask(userId, taskId) {
  const task = DAILY_TASKS.find((item) => item.id === taskId)
  if (!task) throw new AppError(404, 'OFFER_NOT_FOUND', '没有这个任务')
  const progress = await todayProgress(userId)
  if (!progress[task.id]) throw new AppError(400, 'NOT_READY', '这个任务还没完成')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const key = `task-${task.id}-${dayKey(new Date())}`
  const claimed = asList(user.claimedOffers)
  if (claimed.includes(key)) throw new AppError(409, 'ALREADY_CLAIMED', '今天已经领过了')
  const data = { claimedOffers: [...claimed, key] }
  applyReward(data, task.reward, user)
  await prisma.user.update({ where: { id: userId }, data })
  return getActivity(userId)
}

export async function createRecharge(userId, productId) {
  const product = RECHARGE.find((item) => item.id === productId)
  if (!product) throw new AppError(404, 'OFFER_NOT_FOUND', '充值档位不存在')
  return prisma.order.create({
    data: {
      userId,
      productId: product.id,
      outTradeNo: crypto.randomBytes(16).toString('hex'),
      diamonds: product.diamonds,
      amountFen: product.amountFen,
    },
  })
}

export async function startCheckout(userId, orderId, channel, clientIp) {
  const channels = paymentChannels()
  if (!channels.includes(channel)) {
    throw new AppError(503, 'PAY_NOT_CONFIGURED', '请先配置支付宝或微信商户，以及公网回调地址')
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== userId) throw new AppError(404, 'ORDER_NOT_FOUND', '订单不存在')
  if (order.status === 'paid') throw new AppError(409, 'ORDER_PAID', '这笔订单已经付过了')
  await prisma.order.update({ where: { id: order.id }, data: { channel } })
  const payUrl = channel === 'alipay'
    ? buildAlipayUrl(order)
    : await buildWechatH5Url(order, clientIp)
  return { payUrl }
}

export async function settlePaidOrder(outTradeNo, amountFen) {
  const order = await prisma.order.findUnique({ where: { outTradeNo } })
  if (!order || order.amountFen !== Number(amountFen)) return false
  if (order.status === 'paid') return true
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: 'paid', paidAt: new Date() },
    }),
    prisma.user.update({
      where: { id: order.userId },
      data: { diamonds: { increment: order.diamonds } },
    }),
  ])
  return true
}
