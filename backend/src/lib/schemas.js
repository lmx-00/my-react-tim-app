import { z } from 'zod'
import { MAX_LEVEL_ID } from '../game/levels.js'

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, '用户名长度需为 3–16 个字符')
    .max(16, '用户名长度需为 3–16 个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z
    .string()
    .min(8, '密码长度需为 8–32 个字符')
    .max(32, '密码长度需为 8–32 个字符')
    .regex(/[A-Za-z]/, '密码需同时包含字母和数字')
    .regex(/[0-9]/, '密码需同时包含字母和数字'),
})

export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
})

const phoneSchema = z.string().regex(/^1\d{10}$/, '请输入 11 位手机号')

export const phoneAuthSchema = z.object({
  phone: phoneSchema,
  password: registerSchema.shape.password,
})

export const phoneLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, '请输入密码'),
})

export const phoneCodeSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, '请输入 6 位验证码'),
})

export const phoneSendSchema = z.object({
  phone: phoneSchema,
})

export const guestSchema = z.object({
  id: z.string().uuid().optional(),
  resume: z.string().min(16).max(128).optional(),
})

export const wechatAuthSchema = z.object({
  code: z.string().min(1).max(128).optional(),
  openid: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/, '微信身份不正确').optional(),
  nickname: z.string().max(32).optional(),
  avatarUrl: z.string().max(500).optional(),
})

export const createSessionSchema = z.object({
  levelId: z.coerce.number().int().min(1).max(MAX_LEVEL_ID),
})

export const moveSchema = z.object({
  x1: z.coerce.number().int(),
  y1: z.coerce.number().int(),
  x2: z.coerce.number().int(),
  y2: z.coerce.number().int(),
})

export const hammerSchema = z.object({
  x: z.coerce.number().int(),
  y: z.coerce.number().int(),
})

export const settingsSchema = z.object({
  theme: z.enum(['candy', 'forest']).optional(),
  sound: z.boolean().optional(),
  undo: z.boolean().optional(),
  hammer: z.coerce.number().int().min(0).max(9).optional(),
  shuffle: z.coerce.number().int().min(0).max(9).optional(),
  swap: z.coerce.number().int().min(0).max(9).optional(),
})

export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z
    .string()
    .min(8, '密码长度需为 8–32 个字符')
    .max(32, '密码长度需为 8–32 个字符')
    .regex(/[A-Za-z]/, '密码需同时包含字母和数字')
    .regex(/[0-9]/, '密码需同时包含字母和数字'),
})

export const recordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  result: z.enum(['won', 'lost', 'quit', 'expired']).optional(),
  levelId: z.coerce.number().int().min(1).max(MAX_LEVEL_ID).optional(),
})

export const leaderboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  scope: z.enum(['all', 'friends']).optional(),
  levelId: z.coerce.number().int().min(1).max(1000).optional(),
})

export const friendSchema = z.object({
  username: z.string().trim().min(1).max(32),
})
