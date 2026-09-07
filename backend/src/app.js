import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { errorHandler } from './lib/errors.js'
import { authRouter } from './routes/auth.js'
import { gameRouter } from './routes/game.js'
import { levelsRouter } from './routes/levels.js'
import { meRouter } from './routes/me.js'
import { recordsRouter } from './routes/records.js'

export const app = express()

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '64kb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, data: { name: 'happy-match-api', status: 'up' } })
})

app.use('/api/auth', authRouter)
app.use('/api', meRouter)
app.use('/api/levels', levelsRouter)
app.use('/api/game', gameRouter)
app.use('/api/records', recordsRouter)

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: { code: 'NOT_FOUND', message: '接口不存在' },
  })
})

app.use(errorHandler)
