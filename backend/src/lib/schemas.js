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

export const createSessionSchema = z.object({
  levelId: z.coerce.number().int().min(1).max(MAX_LEVEL_ID),
})

export const moveSchema = z.object({
  x1: z.coerce.number().int(),
  y1: z.coerce.number().int(),
  x2: z.coerce.number().int(),
  y2: z.coerce.number().int(),
})

export const recordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  result: z.enum(['won', 'lost', 'quit', 'expired']).optional(),
  levelId: z.coerce.number().int().min(1).max(MAX_LEVEL_ID).optional(),
})
