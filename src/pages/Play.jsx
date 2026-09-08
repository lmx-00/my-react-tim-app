import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createSession, playMove, quitSession } from '../api/game.js'
import { Board } from '../components/Board.jsx'
import { goalProgressText, goalText } from '../game/tiles.js'

function isAdjacent(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1
}

export function PlayPage() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setSession(null)
    setSelected(null)
    setError('')

    createSession(levelId)
      .then((data) => {
        if (!cancelled) setSession(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.code === 'LEVEL_LOCKED') {
          navigate('/levels', { replace: true, state: { notice: '请先通过上一关' } })
          return
        }
        setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [levelId, navigate])

  async function swapTiles(from, to) {
    if (!session || busy) return
    setBusy(true)
    setSelected(null)
    try {
      const result = await playMove(session.sessionId, {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
      })
      if (!result.valid) {
        setShaking(true)
        window.setTimeout(() => setShaking(false), 420)
        return
      }
      setSession((current) => ({
        ...current,
        board: result.board,
        score: result.score,
        movesLeft: result.movesLeft,
        goalProgress: result.goalProgress,
        status: result.status,
        stars: result.stars,
      }))
      if (result.status === 'won' || result.status === 'lost') {
        navigate(`/result/${session.sessionId}`, { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function handleSelect(cell) {
    if (busy || !session || session.status !== 'playing') return
    if (!selected) {
      setSelected(cell)
      return
    }
    if (selected.x === cell.x && selected.y === cell.y) {
      setSelected(null)
      return
    }
    if (isAdjacent(selected, cell)) {
      swapTiles(selected, cell)
      return
    }
    setSelected(cell)
  }

  async function handleQuit() {
    if (!session || busy) {
      navigate('/levels')
      return
    }
    setBusy(true)
    try {
      await quitSession(session.sessionId)
    } catch {
      // 对局已结束也允许返回
    }
    navigate('/levels')
  }

  if (error && !session) {
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
        <p className="muted">正在进入第 {levelId} 关…</p>
      </section>
    )
  }

  const lowMoves = session.movesLeft <= 5

  return (
    <section className="stack play-stack">
      <div className="hud">
        <div>
          <h1>
            第 {session.level.id} 关 {session.level.name}
          </h1>
          <p>目标：{goalText(session.level)}</p>
          <p>{goalProgressText(session.level, session.score, session.goalProgress)}</p>
        </div>
        <div className="hud-stats">
          <span>
            分数 <strong>{session.score}</strong>
          </span>
          <span className={lowMoves ? 'is-danger' : ''}>
            步数 <strong>{session.movesLeft}</strong>
          </span>
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <Board
        board={session.board}
        selected={selected}
        onSelect={handleSelect}
        disabled={busy}
        shaking={shaking}
      />
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={handleQuit} disabled={busy}>
          返回关卡
        </button>
      </div>
    </section>
  )
}
