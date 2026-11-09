import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { refreshCookieOptions } from '../lib/jwt.js'
import { guestSchema, loginSchema, passwordChangeSchema, phoneAuthSchema, phoneCodeSchema, phoneLoginSchema, phoneSendSchema, registerSchema, wechatAuthSchema } from '../lib/schemas.js'
import { parseWith } from '../lib/validate.js'
import { authRequired } from '../middleware/auth.js'
import {
  bindPhone,
  bindWechat,
  changePassword,
  issueAuth,
  loginGuest,
  loginPhone,
  loginPhoneCode,
  sendPhoneCode,
  loginUser,
  loginWechat,
  logoutRefreshToken,
  registerPhone,
  registerUser,
  rotateRefreshToken,
} from '../services/authService.js'

export const authRouter = Router()

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = parseWith(registerSchema, req.body)
    const user = await registerUser(body)
    const data = await issueAuth(res, user)
    ok(res, data, 201)
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = parseWith(loginSchema, req.body)
    const user = await loginUser(body)
    const data = await issueAuth(res, user)
    ok(res, data)
  }),
)

authRouter.post(
  '/register/phone',
  asyncHandler(async (req, res) => {
    const body = parseWith(phoneAuthSchema, req.body)
    const user = await registerPhone(body)
    ok(res, await issueAuth(res, user), 201)
  }),
)

authRouter.post(
  '/login/phone',
  asyncHandler(async (req, res) => {
    const body = parseWith(phoneLoginSchema, req.body)
    const user = await loginPhone(body)
    ok(res, await issueAuth(res, user))
  }),
)

authRouter.post(
  '/sms/send',
  asyncHandler(async (req, res) => {
    const body = parseWith(phoneSendSchema, req.body)
    ok(res, await sendPhoneCode(body.phone))
  }),
)

authRouter.post(
  '/login/phone-code',
  asyncHandler(async (req, res) => {
    const body = parseWith(phoneCodeSchema, req.body)
    const user = await loginPhoneCode(body)
    ok(res, await issueAuth(res, user))
  }),
)

authRouter.post(
  '/guest',
  asyncHandler(async (req, res) => {
    const body = parseWith(guestSchema, req.body ?? {})
    const { user, guest } = await loginGuest(body)
    ok(res, { ...(await issueAuth(res, user)), guest })
  }),
)

authRouter.post(
  '/wechat',
  asyncHandler(async (req, res) => {
    const body = parseWith(wechatAuthSchema, req.body ?? {})
    const user = await loginWechat(body)
    ok(res, await issueAuth(res, user))
  }),
)

authRouter.post(
  '/bind/phone',
  authRequired,
  asyncHandler(async (req, res) => {
    const body = parseWith(phoneAuthSchema, req.body)
    ok(res, await bindPhone(req.user.id, body))
  }),
)

authRouter.post(
  '/bind/wechat',
  authRequired,
  asyncHandler(async (req, res) => {
    const body = parseWith(wechatAuthSchema, req.body ?? {})
    ok(res, await bindWechat(req.user.id, body))
  }),
)

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const user = await rotateRefreshToken(req.cookies.refreshToken)
    const data = await issueAuth(res, user)
    ok(res, data)
  }),
)

authRouter.post(
  '/password',
  authRequired,
  asyncHandler(async (req, res) => {
    const body = parseWith(passwordChangeSchema, req.body)
    ok(res, await changePassword(req.user.id, body))
  }),
)

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await logoutRefreshToken(req.cookies.refreshToken)
    res.clearCookie('refreshToken', { ...refreshCookieOptions(), maxAge: 0 })
    ok(res, { success: true })
  }),
)
