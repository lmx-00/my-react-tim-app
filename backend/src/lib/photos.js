import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AppError } from './errors.js'

const MAX_BYTES = 1.5 * 1024 * 1024
const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/community')
const PHOTO_URL = /^\/api\/uploads\/community\/[0-9a-f-]{36}\.(jpg|png|webp)$/i

export function sniffImage(buffer) {
  if (!buffer || buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png'
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

export function isCommunityPhoto(url) {
  return PHOTO_URL.test(String(url ?? ''))
}

export async function saveCommunityPhoto(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError(400, 'INVALID_IMAGE', '请选一张照片')
  }
  if (buffer.length > MAX_BYTES) {
    throw new AppError(400, 'TOO_LARGE', '照片太大了，换一张小一点的')
  }
  const ext = sniffImage(buffer)
  if (!ext) throw new AppError(400, 'INVALID_IMAGE', '只支持 jpg、png、webp')
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const name = `${crypto.randomUUID()}.${ext}`
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer)
  return `/api/uploads/community/${name}`
}

export async function assertPhotoExists(url) {
  if (!isCommunityPhoto(url)) throw new AppError(400, 'INVALID_IMAGE', '照片不对')
  try {
    await fs.access(path.join(UPLOAD_DIR, path.basename(url)))
  } catch {
    throw new AppError(400, 'INVALID_IMAGE', '照片不见了，请重新选')
  }
}

export async function removeCommunityPhoto(url) {
  if (!isCommunityPhoto(url)) return
  await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {})
}
