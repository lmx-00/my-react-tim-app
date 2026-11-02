import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { friendSchema, leaderboardQuerySchema, settingsSchema } from '../lib/schemas.js'
import { parseWith } from '../lib/validate.js'
import { adminRequired, authRequired } from '../middleware/auth.js'
import { addFriend, getSiteSettings, listLeaderboard, removeFriend, setSiteSettings } from '../services/gameService.js'

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
    const query = parseWith(leaderboardQuerySchema, req.query)
    ok(res, await listLeaderboard(req.user.id, query))
  }),
)

metaRouter.get(
  '/settings',
  asyncHandler(async (req, res) => {
    ok(res, await getSiteSettings())
  }),
)

metaRouter.delete(
  '/friends',
  authRequired,
  asyncHandler(async (req, res) => {
    const body = parseWith(friendSchema, req.body)
    ok(res, await removeFriend(req.user.id, body.username))
  }),
)

metaRouter.post(
  '/friends',
  authRequired,
  asyncHandler(async (req, res) => {
    const body = parseWith(friendSchema, req.body)
    ok(res, await addFriend(req.user.id, body.username))
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
