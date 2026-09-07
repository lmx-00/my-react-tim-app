import { AppError } from './errors.js'

export function parseWith(schema, data) {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? '参数错误'
    throw new AppError(400, 'VALIDATION_ERROR', message)
  }
  return result.data
}
