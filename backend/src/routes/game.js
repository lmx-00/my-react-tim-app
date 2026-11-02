import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { createSessionSchema, hammerSchema, moveSchema } from '../lib/schemas.js'
import { parseWith } from '../lib/validate.js'
import { authRequired } from '../middleware/auth.js'
import {
  createSession,
  getSession,
  playMove,
  quitSession,
  undoMove,
  useHammer,
  useShuffle,
  useSwapTool,
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

gameRouter.post(
  '/sessions/:id/undo',
  authRequired,
  asyncHandler(async (req, res) => {
    ok(res, await undoMove(req.user.id, req.params.id))
  }),
)

gameRouter.post(
  '/sessions/:id/hammer',
  authRequired,
  asyncHandler(async (req, res) => {
    const point = parseWith(hammerSchema, req.body)
    ok(res, await useHammer(req.user.id, req.params.id, point))
  }),
)

gameRouter.post(
  '/sessions/:id/shuffle',
  authRequired,
  asyncHandler(async (req, res) => {
    ok(res, await useShuffle(req.user.id, req.params.id))
  }),
)

gameRouter.post(
  '/sessions/:id/swap',
  authRequired,
  asyncHandler(async (req, res) => {
    const move = parseWith(moveSchema, req.body)
    ok(res, await useSwapTool(req.user.id, req.params.id, move))
  }),
)
