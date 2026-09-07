export class AppError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err)
    return
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      ok: false,
      error: { code: err.code, message: err.message },
    })
    return
  }

  console.error(err)
  res.status(500).json({
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: '服务器开小差了，请稍后重试' },
  })
}
