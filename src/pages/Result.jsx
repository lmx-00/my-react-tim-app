import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSession } from '../api/game.js'
import { Stars } from '../components/Stars.jsx'

const STATUS_TEXT = {
  won: '过关成功',
  lost: '步数用尽',
  quit: '已退出本局',
  expired: '对局已过期',
  playing: '对局进行中',
}

export function ResultPage() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getSession(sessionId)
      .then((data) => {
        if (!cancelled) setSession(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (error) {
    return (
      <section className="stack">
        <p className="form-error">{error}</p>
        <Link to="/levels">返回关卡</Link>
      </section>
    )
  }

  if (!session) {
    return (
      <section className="stack">
        <p className="muted">结算加载中…</p>
      </section>
    )
  }

  const won = session.status === 'won'
  const nextId = session.level.id + 1

  return (
    <section className="stack result-stack">
      <p className="eyebrow">{won ? '太棒了' : '再试一次'}</p>
      <h1>{STATUS_TEXT[session.status] ?? '对局结束'}</h1>
      <Stars value={session.stars} />
      <p>
        第 {session.level.id} 关 {session.level.name}
      </p>
      <p className="lede">本局得分 {session.score}，剩余步数 {session.movesLeft}</p>
      <div className="actions">
        {won && nextId <= 30 ? (
          <Link to={`/play/${nextId}`} className="btn">
            下一关
          </Link>
        ) : null}
        <Link to={`/play/${session.level.id}`} className="btn btn-ghost">
          再玩一次
        </Link>
        <Link to="/levels" className="btn btn-ghost">
          返回关卡
        </Link>
      </div>
    </section>
  )
}
