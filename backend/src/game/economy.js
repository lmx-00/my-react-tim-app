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

export const WIN_COINS = { 1: 20, 2: 50, 3: 80 }

export const BAG = [
  { id: 'hammer', name: '锤子', text: '敲掉一层冰，或砸掉一只小动物。不扣步数。' },
  { id: 'shuffle', name: '洗牌', text: '把没结冰的小动物重新打乱。不扣步数。' },
  { id: 'swap', name: '交换', text: '对调任意两格。消得掉就消除，消不掉也留在新位置。不扣步数。' },
]

export const SHOP = [
  { id: 'heart-coin', name: '体力', text: '补充 1 点体力', price: 100, currency: 'coins', reward: { stamina: 1 } },
  { id: 'heart-gem', name: '体力', text: '补充 5 点体力', price: 20, currency: 'diamonds', reward: { stamina: 5 } },
  { id: 'tool-hammer', name: '锤子', text: '敲掉一层冰，或砸掉一只小动物', price: 80, currency: 'coins', reward: { tools: { hammer: 1 } } },
  { id: 'tool-shuffle', name: '洗牌', text: '把没结冰的小动物重新打乱', price: 50, currency: 'coins', reward: { tools: { shuffle: 1 } } },
  { id: 'tool-swap', name: '交换', text: '对调任意两格，不扣步数', price: 60, currency: 'coins', reward: { tools: { swap: 1 } } },
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
