import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { authRequired } from '../middleware/auth.js'
import { buyOffer, checkIn, claimAllMail, claimEvent, claimMail, claimTask, createRecharge, getActivity, getBag, getShop, listMail, loadWallet, startCheckout } from '../services/walletService.js'

export const hubRouter = Router()

hubRouter.use(authRequired)

hubRouter.get('/wallet', asyncHandler(async (req, res) => {
  ok(res, await loadWallet(req.user.id))
}))

hubRouter.get('/bag', asyncHandler(async (req, res) => {
  ok(res, await getBag(req.user.id))
}))

hubRouter.get('/shop', asyncHandler(async (req, res) => {
  ok(res, await getShop(req.user.id))
}))

hubRouter.post('/shop/:id', asyncHandler(async (req, res) => {
  ok(res, await buyOffer(req.user.id, req.params.id))
}))

hubRouter.post('/recharge', asyncHandler(async (req, res) => {
  ok(res, await createRecharge(req.user.id, String(req.body?.productId ?? '')))
}))

hubRouter.post('/recharge/:id/pay', asyncHandler(async (req, res) => {
  const clientIp = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '')
    .split(',')[0]
    .trim()
  ok(res, await startCheckout(req.user.id, req.params.id, String(req.body?.channel ?? ''), clientIp))
}))

hubRouter.get('/mail', asyncHandler(async (req, res) => {
  ok(res, await listMail(req.user.id))
}))

hubRouter.post('/mail/claim-all', asyncHandler(async (req, res) => {
  ok(res, await claimAllMail(req.user.id))
}))

hubRouter.post('/mail/:id/claim', asyncHandler(async (req, res) => {
  ok(res, await claimMail(req.user.id, req.params.id))
}))

hubRouter.get('/activity', asyncHandler(async (req, res) => {
  ok(res, await getActivity(req.user.id))
}))

hubRouter.post('/activity/check-in', asyncHandler(async (req, res) => {
  ok(res, await checkIn(req.user.id))
}))

hubRouter.post('/activity/tasks/:id/claim', asyncHandler(async (req, res) => {
  ok(res, await claimTask(req.user.id, req.params.id))
}))

hubRouter.post('/activity/:id/claim', asyncHandler(async (req, res) => {
  ok(res, await claimEvent(req.user.id, req.params.id))
}))
