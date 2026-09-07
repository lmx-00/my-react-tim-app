import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { authRequired } from '../middleware/auth.js'
import { getMe } from '../services/authService.js'
import { getStats } from '../services/gameService.js'

export const meRouter = Router()

meRouter.get(
  '/me',
  authRequired,
  asyncHandler(async (req, res) => {
    ok(res, await getMe(req.user.id))
  }),
)

meRouter.get(
  '/stats',
  authRequired,
  asyncHandler(async (req, res) => {
    ok(res, await getStats(req.user.id))
  }),
)
