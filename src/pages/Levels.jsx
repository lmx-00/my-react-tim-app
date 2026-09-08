import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listLevels } from '../api/game.js'
import { Stars } from '../components/Stars.jsx'
import { goalText } from '../game/tiles.js'

export function LevelsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [levels, setLevels] = useState([])
  const [error, setError] = useState(location.state?.notice ?? '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listLevels()
      .then((data) => {
        if (!cancelled) setLevels(data.levels)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const cleared = levels.filter((level) => level.status === 'cleared').length

  function openLevel(level) {
    if (level.status === 'locked') {
      setError('请先通过上一关')
      return
    }
    navigate(`/play/${level.id}`)
  }

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>关卡</h1>
        {levels.length ? <p className="muted">已通关 {cleared}/{levels.length}</p> : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">关卡加载中…</p> : null}
      <div className="level-grid">
        {levels.map((level) => (
          <button
            key={level.id}
            type="button"
            className={`level-card is-${level.status}`}
            onClick={() => openLevel(level)}
            aria-label={`${level.name}，${level.status === 'locked' ? '未解锁' : goalText(level)}`}
          >
            <strong>{level.id}</strong>
            <span className="level-name">{level.status === 'locked' ? '未解锁' : level.name}</span>
            {level.status === 'cleared' ? <Stars value={level.stars} /> : null}
            {level.status === 'current' ? <span className="level-tag">可挑战</span> : null}
          </button>
        ))}
      </div>
    </section>
  )
}
