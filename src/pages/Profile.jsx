import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStats, listLevels } from '../api/game.js'
import { useAuth } from '../auth/useAuth.js'

function formatJoined(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日加入`
}

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [totalLevels, setTotalLevels] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getStats(), listLevels()])
      .then(([statsData, levelsData]) => {
        if (cancelled) return
        setStats(statsData)
        setTotalLevels(levelsData.levels.length)
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

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const username = stats?.username ?? user?.username ?? ''
  const joined = formatJoined(stats?.createdAt ?? user?.createdAt)
  const maxCleared = stats?.maxCleared ?? 0
  const totalGames = stats?.totalGames ?? 0
  const winRate = totalGames ? Math.round(((stats?.wins ?? 0) / totalGames) * 100) : 0
  const progress = totalLevels ? Math.round((maxCleared / totalLevels) * 100) : 0
  const allCleared = totalLevels > 0 && maxCleared >= totalLevels
  const nextLevel = Math.min(maxCleared + 1, totalLevels || maxCleared + 1)

  return (
    <section className="stack">
      <div className="profile-head">
        <span className="avatar" aria-hidden="true">
          {username.slice(0, 1).toUpperCase() || '玩'}
        </span>
        <div>
          <h1>{username || '我的'}</h1>
          {joined ? <p className="muted">{joined}</p> : null}
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">数据加载中…</p> : null}

      {stats ? (
        <>
          <div className="progress" role="group" aria-label="通关进度">
            <div className="progress-head">
              <span>通关进度</span>
              <strong>
                {maxCleared}/{totalLevels || '—'}
              </strong>
            </div>
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuenow={maxCleared}
              aria-valuemin={0}
              aria-valuemax={totalLevels || maxCleared}
            >
              <span className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat">
              <span className="stat-num">{totalGames}</span>
              <span className="stat-label">总场次</span>
            </div>
            <div className="stat">
              <span className="stat-num">{stats.wins}</span>
              <span className="stat-label">胜场</span>
            </div>
            <div className="stat">
              <span className="stat-num">{winRate}%</span>
              <span className="stat-label">胜率</span>
            </div>
            <div className="stat">
              <span className="stat-num">{stats.bestScore}</span>
              <span className="stat-label">最高分</span>
            </div>
            <div className="stat">
              <span className="stat-num">{maxCleared}</span>
              <span className="stat-label">最高通关</span>
            </div>
            <div className="stat">
              <span className="stat-num">
                {stats.totalStars}
                {totalLevels ? <small>/{totalLevels * 3}</small> : null}
              </span>
              <span className="stat-label">收集星星</span>
            </div>
          </div>

          <p className="muted">
            其中失败 {stats.losses} 局、中途退出 {stats.quits} 局。
          </p>
        </>
      ) : null}

      <div className="actions">
        {allCleared ? (
          <Link to="/levels" className="btn">
            全部通关啦
          </Link>
        ) : (
          <Link to={`/play/${nextLevel}`} className="btn">
            继续闯第 {nextLevel} 关
          </Link>
        )}
        <Link to="/records" className="btn btn-ghost">
          游戏记录
        </Link>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          退出登录
        </button>
      </div>
    </section>
  )
}
