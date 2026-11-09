import express, { Router } from 'express'
import { asyncHandler, ok } from '../lib/errors.js'
import { saveCommunityPhoto } from '../lib/photos.js'
import { commentCreateSchema, communityQuerySchema, postCreateSchema } from '../lib/schemas.js'
import { parseWith } from '../lib/validate.js'
import { authRequired } from '../middleware/auth.js'
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  likePost,
  listComments,
  listPosts,
} from '../services/communityService.js'

export const communityRouter = Router()

communityRouter.use(authRequired)

communityRouter.post(
  '/photos',
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'],
    limit: '2mb',
  }),
  asyncHandler(async (req, res) => {
    ok(res, { url: await saveCommunityPhoto(req.body) }, 201)
  }),
)

communityRouter.get(
  '/posts',
  asyncHandler(async (req, res) => {
    const query = parseWith(communityQuerySchema, req.query)
    ok(res, await listPosts(req.user.id, query))
  }),
)

communityRouter.post(
  '/posts',
  asyncHandler(async (req, res) => {
    const body = parseWith(postCreateSchema, req.body)
    ok(res, await createPost(req.user.id, body), 201)
  }),
)

communityRouter.post(
  '/posts/:id/like',
  asyncHandler(async (req, res) => {
    ok(res, await likePost(req.user.id, req.params.id))
  }),
)

communityRouter.delete(
  '/posts/:id',
  asyncHandler(async (req, res) => {
    ok(res, await deletePost(req.user.id, req.params.id))
  }),
)

communityRouter.get(
  '/posts/:id/comments',
  asyncHandler(async (req, res) => {
    ok(res, await listComments(req.user.id, req.params.id))
  }),
)

communityRouter.post(
  '/posts/:id/comments',
  asyncHandler(async (req, res) => {
    const { body } = parseWith(commentCreateSchema, req.body)
    ok(res, await createComment(req.user.id, req.params.id, body), 201)
  }),
)

communityRouter.delete(
  '/comments/:id',
  asyncHandler(async (req, res) => {
    ok(res, await deleteComment(req.user.id, req.params.id))
  }),
)
