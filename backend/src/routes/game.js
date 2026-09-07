import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { createSessionSchema, moveSchema } from '../lib/schemas.js'
import { parseWith } from '../lib/validate.js'
import { authRequired } from '../middleware/auth.js'
import {
  createSession,
  getSession,
  playMove,
  quitSession,
} from '../services/gameService.js'

export const gameRouter = Router()

gameRouter.post(
  '/sessions',
  authRequired,
  asyncHandler(async (req, res) => {
    const { levelId } = parseWith(createSessionSchema, req.body)
    ok(res, await createSession(req.user.id, levelId), 201)
  }),
)

gameRouter.get(
  '/sessions/:id',
  authRequired,
  asyncHandler(async (req, res) => {
    ok(res, await getSession(req.user.id, req.params.id))
  }),
)

gameRouter.post(
  '/sessions/:id/move',
  authRequired,
  asyncHandler(async (req, res) => {
    const move = parseWith(moveSchema, req.body)
    ok(res, await playMove(req.user.id, req.params.id, move))
  }),
)

gameRouter.post(
  '/sessions/:id/quit',
  authRequired,
  asyncHandler(async (req, res) => {
    ok(res, await quitSession(req.user.id, req.params.id))
  }),
)
