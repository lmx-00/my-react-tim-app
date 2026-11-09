import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getLevel } from '../api/game.js'
import { MonsterTile } from '../components/MonsterTile.jsx'
import { Stars } from '../components/Stars.jsx'
import { levelIcon } from '../game/levelIcon.js'
import { goalText } from '../game/tiles.js'

const LOAD_MS = 1100

export function LevelLoadPage() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const [level, setLevel] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const started = Date.now()
    getLevel(levelId)
      .then(async (data) => {
        if (cancelled) return
        setLevel(data)
        const remain = Math.max(0, LOAD_MS - (Date.now() - started))
        await new Promise((resolve) => window.setTimeout(resolve, remain))
        if (!cancelled) navigate(`/play/${levelId}`, { replace: true })
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [levelId, navigate])

  if (error) {
    return (
      <section className="stack level-load">
        <p className="form-error">{error}</p>
        <Link to="/levels">返回关卡</Link>
      </section>
    )
  }

  return (
    <section className="stack level-load">
      <span className="level-load-icon" aria-hidden="true">
        <MonsterTile type={level ? levelIcon(level) : 'bear'} />
      </span>
      <p className="eyebrow">{Number(levelId) === 0 ? '今日一局' : `第 ${levelId} 关`}</p>
      <h1>{level?.name ?? '关卡准备中'}</h1>
      {level ? <p className="level-load-goal">目标：{goalText(level)}</p> : <p className="muted">正在读取关卡…</p>}
      {Number(levelId) !== 0 && Number(levelId) % 20 === 0 ? (
        <p className="muted">本章最后一关。第一次拿到三星送锤子，两星送洗牌。</p>
      ) : null}
      {Number(levelId) === 0 ? <p className="muted">每天第一局不扣体力。过关送一份奖励。</p> : null}
      {level?.bestScore > 0 ? <p>最高分 {level.bestScore}</p> : null}
      {level?.status === 'cleared' ? <Stars value={level.stars} /> : null}
      <div className="level-load-track" aria-hidden="true">
        <span />
      </div>
      <p className="muted">正在进入关卡</p>
    </section>
  )
}
