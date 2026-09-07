import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { recordsQuerySchema } from '../lib/schemas.js'
import { parseWith } from '../lib/validate.js'
import { authRequired } from '../middleware/auth.js'
import { listRecords } from '../services/gameService.js'

export const recordsRouter = Router()

recordsRouter.get(
  '/',
  authRequired,
  asyncHandler(async (req, res) => {
    const query = parseWith(recordsQuerySchema, req.query)
    ok(res, await listRecords(req.user.id, query))
  }),
)
