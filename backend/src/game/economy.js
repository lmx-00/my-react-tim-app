export const STAMINA_MAX = 5
export const STAMINA_REGEN_MS = 30 * 60 * 1000
export const CHECK_IN_COINS = 50
export const STREAK_GOAL = 7
export const STREAK_BONUS = 100

export const CANDY_WEEK = {
  id: 'candy-week',
  name: '糖果周',
  text: '活动期间可以领一次：100 金币和 1 个锤子。',
  start: '2026-11-02T00:00:00+08:00',
  days: 7,
  reward: { coins: 100, tools: { hammer: 1 } },
}

export const EVENTS = [
  CANDY_WEEK,
  {
    id: 'garden-week',
    name: '花园周',
    text: '领取 80 金币和 1 次洗牌。',
    start: '2026-11-03T00:00:00+08:00',
    days: 7,
    reward: { coins: 80, tools: { shuffle: 1 } },
  },
  {
    id: 'score-rush',
    name: '冲分周',
    text: '领取 1 次加五步。',
    start: '2026-11-03T00:00:00+08:00',
    days: 6,
    reward: { tools: { plus: 1 } },
  },
  {
    id: 'winter-week',
    name: '暖冬周',
    text: '领取 80 金币和 1 次交换。',
    start: '2026-11-05T00:00:00+08:00',
    days: 7,
    reward: { coins: 80, tools: { swap: 1 } },
  },
  {
    id: 'starlight-week',
    name: '星光周',
    text: '领取 60 金币和 1 次加五步。',
    start: '2026-11-05T00:00:00+08:00',
    days: 8,
    reward: { coins: 60, tools: { plus: 1 } },
  },
  {
    id: 'weekend-pack',
    name: '周末补给',
    text: '领取 100 金币。',
    start: '2026-11-07T00:00:00+08:00',
    days: 4,
    reward: { coins: 100 },
  },
]

export const DAILY_TASKS = [
  { id: 'play', name: '完成一局', text: '今天进入一局游戏', reward: { coins: 30 } },
  { id: 'win', name: '过一关', text: '今天通过一关', reward: { coins: 40 } },
  { id: 'score', name: '冲到 1000 分', text: '今天任意一局得分达到 1000', reward: { coins: 50 } },
]

export const WIN_COINS = { 1: 20, 2: 50, 3: 80 }

export const BAG = [
  { id: 'hammer', name: '锤子', text: '敲掉一层冰，或砸掉一只小动物。不扣步数。' },
  { id: 'shuffle', name: '洗牌', text: '把没结冰的小动物重新打乱。不扣步数。' },
  { id: 'swap', name: '交换', text: '对调任意两格。消得掉就消除，消不掉也留在新位置。不扣步数。' },
  { id: 'plus', name: '加五步', text: '本局步数加 5。不消耗体力。' },
]

export const SHOP = [
  { id: 'heart-coin', name: '体力', text: '补充 1 点体力', price: 100, currency: 'coins', reward: { stamina: 1 } },
  { id: 'heart-gem', name: '体力', text: '补充 5 点体力', price: 20, currency: 'diamonds', reward: { stamina: 5 } },
  { id: 'tool-hammer', name: '锤子', text: '敲掉一层冰，或砸掉一只小动物', price: 80, currency: 'coins', reward: { tools: { hammer: 1 } } },
  { id: 'tool-shuffle', name: '洗牌', text: '把没结冰的小动物重新打乱', price: 50, currency: 'coins', reward: { tools: { shuffle: 1 } } },
  { id: 'tool-swap', name: '交换', text: '对调任意两格，不扣步数', price: 60, currency: 'coins', reward: { tools: { swap: 1 } } },
  { id: 'tool-plus', name: '加五步', text: '本局步数加 5', price: 40, currency: 'coins', reward: { tools: { plus: 1 } } },
  { id: 'pack-sweet', name: '甜蜜礼包', text: '300 金币和 3 点体力', price: 50, currency: 'diamonds', reward: { coins: 300, stamina: 3 }, pack: true },
  { id: 'gem-taste', name: '体验钻石', text: '每个账号可领一次', price: 0, currency: 'free', reward: { diamonds: 30 }, once: true },
  { id: 'gem-box', name: '钻石礼盒', text: '每个账号可领一次', price: 0, currency: 'free', reward: { diamonds: 80 }, once: true },
]

// 1 元 = 10 颗钻石
export const RECHARGE = [
  { id: 'pay-1', diamonds: 10, amountFen: 100, name: '10 钻石' },
  { id: 'pay-6', diamonds: 60, amountFen: 600, name: '60 钻石' },
  { id: 'pay-30', diamonds: 300, amountFen: 3000, name: '300 钻石' },
]
