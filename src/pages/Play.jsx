import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createSession, playMove, quitSession } from '../api/game.js'
import { Board } from '../components/Board.jsx'
import { buildFrames } from '../game/replay.js'
import { goalProgressText, goalText } from '../game/tiles.js'

// 和 index.css 里对应动画的时长保持一致，多等一点等动画落稳
const SWAP_MS = 180
const SWAP_SETTLE_MS = SWAP_MS + 40
const STEP_MS = 270

function isAdjacent(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function PlayPage() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [swap, setSwap] = useState(null)
  const [view, setView] = useState(null)
  const [combo, setCombo] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

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

  // 逐帧把服务端算好的这一串消除演出来：消除 → 下落补充 → 下一波
  async function replay(frames, movesLeft) {
    for (const [index, frame] of frames.entries()) {
      // 连锁越往后节奏越快，不然一串大连锁要干等好几秒
      const duration = Math.round(STEP_MS * Math.max(0.42, 1 - index * 0.09))
      if (frame.kind === 'pop') {
        setView({ cells: frame.cells, popping: frame.popping, duration })
        setSession((current) => ({
          ...current,
          score: current.score + frame.score,
          movesLeft,
        }))
        if (frame.wave > 1) setCombo({ wave: frame.wave, score: frame.score })
      } else {
        setView({
          cells: frame.cells,
          falling: frame.falling,
          spawning: frame.spawning,
          duration,
        })
      }
      await wait(duration + 20)
    }
  }

  async function swapTiles(from, to) {
    if (!session || busy) return
    setBusy(true)
    setSelected(null)
    setSwap({ from, to, phase: 'forward' })
    try {
      // 两个格子先滑到位，结果回来得再快也等动画走完
      const [result] = await Promise.all([
        playMove(session.sessionId, {
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
        }),
        wait(SWAP_SETTLE_MS),
      ])
      const applyResult = () =>
        setSession((current) => ({
          ...current,
          board: result.board,
          score: result.score,
          movesLeft: result.movesLeft,
          goalProgress: result.goalProgress,
          status: result.status,
          stars: result.stars,
        }))

      if (!result.valid) {
        // 换不动：原路滑回去，顺带抖一下
        setSwap({ from, to, phase: 'back' })
        applyResult()
        setShaking(true)
        window.setTimeout(() => setShaking(false), 420)
        await wait(SWAP_SETTLE_MS)
        setSwap(null)
      } else {
        // 第一帧就是交换后的棋盘，和滑动动画无缝接上
        setSwap(null)
        await replay(buildFrames(session.board.cells, result.events), result.movesLeft)
        setView(null)
        setCombo(null)
        applyResult()
      }
      if (result.status === 'won' || result.status === 'lost') {
        navigate(`/result/${session.sessionId}`, { replace: true })
      }
    } catch (err) {
      setSwap(null)
      setView(null)
      setCombo(null)
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
  const hasRainbow = session.board.cells.some((row) =>
    row.some((tile) => tile?.type === 'rainbow'),
  )

  return (
    <section className="stack play-stack">
      <div className="hud">
        <div>
          <h1>
            第 {session.level.id} 关 {session.level.name}
          </h1>
          <p>目标：{goalText(session.level)}</p>
          <p>{goalProgressText(session.level, session.score, session.goalProgress)}</p>
          {hasRainbow ? (
            <p className="muted">彩虹炸弹和旁边一换，炸掉周围一圈。</p>
          ) : null}
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
      <div className="board-wrap">
        <Board
          board={view ? { ...session.board, cells: view.cells } : session.board}
          selected={selected}
          onSelect={handleSelect}
          disabled={busy}
          shaking={shaking}
          swap={swap}
          effects={view}
        />
        {combo ? (
          <p className="combo" key={`${combo.wave}-${combo.score}`}>
            连击 ×{combo.wave} <span>+{combo.score}</span>
          </p>
        ) : null}
      </div>
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={handleQuit} disabled={busy}>
          返回关卡
        </button>
      </div>
    </section>
  )
}
