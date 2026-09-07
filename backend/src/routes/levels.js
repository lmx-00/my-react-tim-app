import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { authRequired } from '../middleware/auth.js'
import { getLevel, listLevels } from '../services/gameService.js'

export const levelsRouter = Router()

levelsRouter.get(
  '/',
  authRequired,
  asyncHandler(async (req, res) => {
    ok(res, await listLevels(req.user.id))
  }),
)

levelsRouter.get(
  '/:id',
  authRequired,
  asyncHandler(async (req, res) => {
    ok(res, await getLevel(req.user.id, req.params.id))
  }),
)
