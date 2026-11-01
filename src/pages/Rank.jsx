import { useEffect, useState } from 'react'
import { getLeaderboard } from '../api/game.js'

function Crown({ rank }) {
  const color = rank === 1 ? '#f5b301' : rank === 2 ? '#b9c4d4' : '#e09a62'
  return (
    <svg className="rank-crown" viewBox="0 0 24 16" aria-hidden="true">
      <path fill={color} d="M2 14h20l-1.2-8-4.2 3.2L12 2 7.4 9.2 3.2 6z" />
    </svg>
  )
}

export function RankPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getLeaderboard()
      .then((data) => {
        if (!cancelled) setItems(data.items)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>排行榜</h1>
        <p className="muted">按累计星星，星星相同比通关数</p>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <ol className="rank-list">
        {items.map((item) => (
          <li key={item.username} className={`${item.me ? 'is-me' : ''} ${item.rank <= 3 ? `is-top is-${item.rank}` : ''}`}>
            <strong>
              {item.rank <= 3 ? <Crown rank={item.rank} /> : null}
              {item.rank}
            </strong>
            <span>{item.username}</span>
            <em>
              {item.totalStars} 星 · {item.maxCleared} 关
            </em>
          </li>
        ))}
      </ol>
    </section>
  )
}
