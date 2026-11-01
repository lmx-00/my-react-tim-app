import { useEffect, useState } from 'react'
import { getLeaderboard } from '../api/game.js'

const PAGE_SIZE = 50

function Crown({ rank }) {
  const color = rank === 1 ? '#f5b301' : rank === 2 ? '#b9c4d4' : '#e09a62'
  return (
    <svg className="rank-crown" viewBox="0 0 24 16" aria-hidden="true">
      <path fill={color} d="M2 14h20l-1.2-8-4.2 3.2L12 2 7.4 9.2 3.2 6z" />
    </svg>
  )
}

function RankRow({ item }) {
  return (
    <li className={`${item.me ? 'is-me' : ''} ${item.rank <= 3 ? `is-top is-${item.rank}` : ''}`}>
      <strong>
        {item.rank <= 3 ? <Crown rank={item.rank} /> : null}
        {item.rank}
      </strong>
      <span>{item.username}</span>
      <em>
        {item.totalStars} 星 · {item.maxCleared} 关
      </em>
    </li>
  )
}

export function RankPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [mine, setMine] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getLeaderboard({ page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        // 第一页覆盖，后面的页往后接
        setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]))
        setTotal(data.total)
        setMine(data.me)
        setError('')
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
  }, [page])

  function loadMore() {
    setLoading(true)
    setPage(page + 1)
  }

  const rest = Math.max(0, total - items.length)
  // 自己还没出现在已加载的名次里，就单独钉一行在底部
  const showMine = mine && !items.some((item) => item.me)

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>排行榜</h1>
        <p className="muted">按累计星星，星星相同比通关数</p>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading && !items.length ? <p className="muted">排行加载中…</p> : null}
      {!loading && !error && !items.length ? <p className="muted">还没有人上榜。</p> : null}

      {items.length ? (
        <ol className="rank-list">
          {items.map((item) => (
            <RankRow key={item.username} item={item} />
          ))}
          {showMine ? (
            <>
              <li className="rank-gap" aria-hidden="true">
                ···
              </li>
              <RankRow item={mine} />
            </>
          ) : null}
        </ol>
      ) : null}

      {rest ? (
        <div className="pager">
          <button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={loadMore}>
            {loading ? '加载中…' : `加载更多（还有 ${rest} 人）`}
          </button>
        </div>
      ) : null}

      {total > PAGE_SIZE && !rest ? <p className="muted rank-foot">到底了，共 {total} 人</p> : null}
    </section>
  )
}
