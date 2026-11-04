import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { applyHammer, applyPlus, applyShuffle, applySwap, createSession, playMove, quitSession, undoMove } from '../api/game.js'
import { Board } from '../components/Board.jsx'
import { ResultDialog } from '../components/ResultDialog.jsx'
import { buildFrames } from '../game/replay.js'
import { playSound } from '../game/sound.js'
import { goalProgressText, goalText } from '../game/tiles.js'

// 和 index.css 里对应动画的时长保持一致，多等一点等动画落稳
const SWAP_MS = 180
const SWAP_SETTLE_MS = SWAP_MS + 40
const STEP_MS = 270

function toolFace(name, tools, key) {
  const free = tools?.free?.[key]
  const bag = tools?.bag?.[key] ?? 0
  if (free == null || bag <= 0) return `${name} ${tools?.[key] ?? 0}`
  return (
    <span className="tool-count">
      <span>{name}</span>
      <small>本局 {free}</small>
      <small>背包 {bag}</small>
    </span>
  )
}

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
  const [tool, setTool] = useState(null)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    createSession(levelId)
      .then((data) => {
        if (!cancelled) setSession(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.code === 'LEVEL_LOCKED' || err.code === 'NO_STAMINA') {
          navigate('/levels', { replace: true, state: { notice: err.message } })
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
      const dramatic = frame.banner || frame.effect === 'line' || frame.effect === 'color' || frame.effect === 'bomb'
      const duration = dramatic ? 520 : Math.round(STEP_MS * Math.max(0.42, 1 - index * 0.09))
      if (frame.kind === 'pop') {
        setView({ cells: frame.cells, popping: frame.popping, effect: frame.effect, duration })
        setSession((current) => ({
          ...current,
          score: current.score + frame.score,
          movesLeft,
        }))
        if (frame.banner || frame.wave > 1) {
          setCombo({ banner: frame.banner, wave: frame.wave, score: frame.score })
        }
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
          canUndo: result.canUndo,
          tools: result.tools ?? current.tools,
          rewardCoins: result.rewardCoins ?? 0,
          rewardTools: result.rewardTools ?? {},
        }))

      if (!result.valid) {
        playSound('fail')
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
        playSound(result.status === 'won' ? 'win' : 'pop')
        await replay(buildFrames(session.board.cells, result.events), result.movesLeft)
        setView(null)
        setCombo(null)
        applyResult()
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
    if (busy || paused || !session || session.status !== 'playing') return
    if (tool === 'hammer') {
      hammerTile(cell)
      return
    }
    if (tool === 'swap') {
      if (!selected) {
        setSelected(cell)
        return
      }
      if (selected.x === cell.x && selected.y === cell.y) {
        setSelected(null)
        return
      }
      swapWithTool(selected, cell)
      return
    }
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

  async function hammerTile(cell) {
    if (!session || busy) return
    setBusy(true)
    setSelected(null)
    setTool(null)
    try {
      const result = await applyHammer(session.sessionId, { x: cell.x, y: cell.y })
      await replay(buildFrames(session.board.cells, result.events ?? []), result.movesLeft)
      setView(null)
      setCombo(null)
      setSession((current) => ({ ...current, ...result }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function swapWithTool(from, to) {
    if (!session || busy) return
    setBusy(true)
    setSelected(null)
    setTool(null)
    try {
      if (isAdjacent(from, to)) {
        setSwap({ from, to, phase: 'forward' })
        await wait(SWAP_SETTLE_MS)
        setSwap(null)
      }
      const result = await applySwap(session.sessionId, {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
      })
      playSound(result.status === 'won' ? 'win' : 'pop')
      await replay(buildFrames(session.board.cells, result.events ?? []), result.movesLeft)
      setView(null)
      setCombo(null)
      setSession((current) => ({ ...current, ...result }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUndo() {
    if (!session || busy) return
    setBusy(true)
    setTool(null)
    try {
      const result = await undoMove(session.sessionId)
      setView(null)
      setCombo(null)
      setSession(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handlePlus() {
    if (!session || busy) return
    setBusy(true)
    setTool(null)
    try {
      const result = await applyPlus(session.sessionId)
      setSession((current) => ({ ...current, ...result }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleShuffle() {
    if (!session || busy) return
    setBusy(true)
    setTool(null)
    try {
      const result = await applyShuffle(session.sessionId)
      await replay(buildFrames(session.board.cells, result.events ?? []), result.movesLeft)
      setView(null)
      setSession((current) => ({ ...current, ...result }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
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

  const ended = session.status === 'won' || session.status === 'lost'
  const lowMoves = session.movesLeft <= 5

  return (
    <section className="stack play-stack">
      <div className="hud">
        <div className="hud-main">
          <h1>
            第 {session.level.id} 关 {session.level.name}
          </h1>
          <p>目标：{goalText(session.level)}</p>
          <p className="hud-progress">{goalProgressText(session.level, session.score, session.goalProgress)}</p>
        </div>
        <div className="hud-stats">
          <span>
            <small>分数</small>
            <strong>{session.score}</strong>
          </span>
          <span className={lowMoves ? 'is-danger' : ''}>
            <small>步数</small>
            <strong>{session.movesLeft}</strong>
          </span>
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="board-wrap">
        <Board
          board={view ? { ...session.board, cells: view.cells } : session.board}
          selected={selected}
          onSelect={handleSelect}
          disabled={busy || paused || ended}
          shaking={shaking}
          swap={swap}
          effects={view}
        />
        {combo ? (
          <p className={`combo${combo.banner ? ' is-banner' : ''}`} key={`${combo.banner ?? ''}-${combo.wave}-${combo.score}`}>
            {combo.banner || `连击 ×${combo.wave}`} <span>+{combo.score}</span>
          </p>
        ) : null}
      </div>
      <div className="tool-bar">
        <button type="button" className="btn btn-ghost" onClick={handleUndo} disabled={busy || ended || !session.canUndo}>
          后退
        </button>
        <button
          type="button"
          className={`btn btn-ghost${tool === 'hammer' ? ' is-on' : ''}`}
          onClick={() => setTool((current) => (current === 'hammer' ? null : 'hammer'))}
          disabled={busy || ended || !session.tools?.hammer}
        >
          {toolFace('锤子', session.tools, 'hammer')}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleShuffle}
          disabled={busy || ended || !session.tools?.shuffle}
        >
          {toolFace('洗牌', session.tools, 'shuffle')}
        </button>
        <button
          type="button"
          className={`btn btn-ghost${tool === 'swap' ? ' is-on' : ''}`}
          onClick={() => setTool((current) => (current === 'swap' ? null : 'swap'))}
          disabled={busy || paused || ended || !session.tools?.swap}
        >
          {toolFace('交换', session.tools, 'swap')}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handlePlus}
          disabled={busy || ended || !session.tools?.plus}
        >
          {toolFace('加五步', session.tools, 'plus')}
        </button>
      </div>
      {tool === 'hammer' ? <p className="muted">结冰的小动物拖不动。锤子敲一下只碎一层冰，小动物还在。不扣步数。</p> : null}
      {tool === 'swap' ? <p className="muted">点两个没结冰的格子对调。消得掉就消除，消不掉也留在新位置。不扣步数。</p> : null}
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={() => setPaused(true)} disabled={busy || ended}>
          暂停
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleQuit} disabled={busy}>
          返回关卡
        </button>
      </div>
      {paused && !ended ? (
        <div className="cashier-mask">
          <section className="cashier" role="dialog" aria-label="暂停">
            <h2>已暂停</h2>
            <p className="muted">棋盘先停在这里。</p>
            <div className="actions">
              <button type="button" className="btn" onClick={() => setPaused(false)}>
                继续
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleQuit}>
                返回关卡
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {ended ? <ResultDialog session={session} /> : null}
    </section>
  )
}
