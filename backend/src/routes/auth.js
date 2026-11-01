import { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { refreshCookieOptions } from '../lib/jwt.js'
import { loginSchema, passwordChangeSchema, registerSchema } from '../lib/schemas.js'
import { parseWith } from '../lib/validate.js'
import { authRequired } from '../middleware/auth.js'
import {
  changePassword,
  issueAuth,
  loginUser,
  logoutRefreshToken,
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
