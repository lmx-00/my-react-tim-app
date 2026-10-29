import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listLevels, listRecords } from '../api/game.js'
import { Stars } from '../components/Stars.jsx'

const PAGE_SIZE = 10

const FILTERS = [
  { value: '', label: '全部' },
  { value: 'won', label: '过关' },
  { value: 'lost', label: '失败' },
  { value: 'quit', label: '退出' },
  { value: 'expired', label: '已过期' },
]

const STATUS_TEXT = {
  won: '过关',
  lost: '步数用尽',
  quit: '中途退出',
  expired: '已过期',
}

function formatDuration(ms) {
  if (!ms || ms < 0) return '—'
  const seconds = Math.round(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  return minutes ? `${minutes} 分 ${seconds % 60} 秒` : `${seconds} 秒`
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecordsPage() {
  const [data, setData] = useState(null)
  const [levels, setLevels] = useState([])
  const [filter, setFilter] = useState('')
  const [levelId, setLevelId] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listLevels()
      .then((res) => {
        if (!cancelled) setLevels(res.levels)
      })
      .catch(() => {
        // 关卡筛选是附加功能，拿不到就不显示下拉框
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    listRecords({
      page,
      pageSize: PAGE_SIZE,
      result: filter || undefined,
      levelId: levelId || undefined,
    })
      .then((res) => {
        if (cancelled) return
        setData(res)
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
  }, [page, filter, levelId])

  function changeFilter(value) {
    if (value === filter) return
    setLoading(true)
    setFilter(value)
    setPage(1)
  }

  function changeLevel(value) {
    setLoading(true)
    setLevelId(value)
    setPage(1)
  }

  function goPage(next) {
    setLoading(true)
    setPage(next)
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>游戏记录</h1>
        {total ? <p className="muted">共 {total} 局</p> : null}
      </div>

      <div className="chips">
        {FILTERS.map((item) => (
          <button
            key={item.value || 'all'}
            type="button"
            className={`chip${item.value === filter ? ' is-on' : ''}`}
            aria-pressed={item.value === filter}
            onClick={() => changeFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
        {levels.length ? (
          <select
            className="chip chip-select"
            aria-label="按关卡筛选"
            value={levelId}
            onChange={(event) => changeLevel(event.target.value)}
          >
            <option value="">所有关卡</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                第 {level.id} 关 {level.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">记录加载中…</p> : null}

      {!loading && !error && !items.length ? (
        filter || levelId ? (
          <p className="muted">这个筛选下还没有记录。</p>
        ) : (
          <p className="muted">
            还没有对局，<Link to="/levels">去第 1 关试试</Link>。
          </p>
        )
      ) : null}

      {items.length ? (
        <ul className="record-list">
          {items.map((item) => (
            <li key={item.id} className={`record is-${item.status}`}>
              <span className="record-no">{item.levelId}</span>
              <div className="record-body">
                <div className="record-title">
                  <strong>{item.levelName}</strong>
                  <span className={`record-tag is-${item.status}`}>
                    {STATUS_TEXT[item.status] ?? item.status}
                  </span>
                  {item.status === 'won' ? <Stars value={item.stars} /> : null}
                </div>
                <p className="record-meta">
                  得分 {item.score} · 步数 {item.moveCount}/{item.moveLimit} · 用时{' '}
                  {formatDuration(item.durationMs)}
                </p>
              </div>
              <div className="record-side">
                <time dateTime={item.endedAt ?? undefined}>{formatTime(item.endedAt)}</time>
                <Link to={`/play/${item.levelId}`}>再玩一次</Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {totalPages > 1 ? (
        <div className="pager">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={loading || page <= 1}
            onClick={() => goPage(page - 1)}
          >
            上一页
          </button>
          <span className="muted">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={loading || page >= totalPages}
            onClick={() => goPage(page + 1)}
          >
            下一页
          </button>
        </div>
      ) : null}
    </section>
  )
}
