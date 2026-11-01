import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { settingsSchema } from '../lib/schemas.js'
import { parseWith } from '../lib/validate.js'
import { adminRequired, authRequired } from '../middleware/auth.js'
import { getSiteSettings, listLeaderboard, setSiteSettings } from '../services/gameService.js'

export const metaRouter = Router()

metaRouter.get(
  '/theme',
  asyncHandler(async (req, res) => {
    ok(res, await getSiteSettings())
  }),
)

metaRouter.get(
  '/leaderboard',
  authRequired,
  asyncHandler(async (req, res) => {
    ok(res, await listLeaderboard(req.user.id))
  }),
)

metaRouter.get(
  '/settings',
  asyncHandler(async (req, res) => {
    ok(res, await getSiteSettings())
  }),
)

metaRouter.put(
  '/admin/settings',
  adminRequired,
  asyncHandler(async (req, res) => {
    const body = parseWith(settingsSchema, req.body)
    ok(res, await setSiteSettings(body))
  }),
)
