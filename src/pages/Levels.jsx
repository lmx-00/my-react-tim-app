import { Fragment, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listLevels } from '../api/game.js'
import { Stars } from '../components/Stars.jsx'
import { goalText } from '../game/tiles.js'

const CHAPTER_SIZE = 20
const CHAPTERS = [
  '森林', '溪谷', '花园', '果园', '雪山', '沙漠', '海边', '星空',
  '城堡', '迷宫', '云端', '熔岩', '竹林', '月夜', '彩虹', '龙巢',
]
const LOCKED_CANDY = ['#fb7185', '#c4b5fd', '#7ee0c8', '#67e8f9', '#93c5fd', '#f9a8d4']
const WAVE = [50, 32, 18, 36, 54, 72, 84, 64]

function vineCurve(from, to) {
  if (to <= from) return ''
  const point = (index) => [WAVE[index % WAVE.length], index - from + 0.5]
  const [x, y] = point(from)
  let path = `M ${x} ${y}`
  for (let index = from + 1; index <= to; index += 1) {
    const [nextX, nextY] = point(index)
    const [prevX, prevY] = point(index - 1)
    const mid = (prevY + nextY) / 2
    path += ` C ${prevX} ${mid}, ${nextX} ${mid}, ${nextX} ${nextY}`
  }
  return path
}

function chapterTitle(index) {
  const theme = CHAPTERS[index % CHAPTERS.length]
  const round = Math.floor(index / CHAPTERS.length) + 1
  return round === 1 ? theme : `${theme} ${round}`
}

const STEP = 96

export function LevelsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const scrollerRef = useRef(null)
  const [levels, setLevels] = useState([])
  const [range, setRange] = useState({ start: 0, end: 16 })
  const [away, setAway] = useState(null)
  const [error, setError] = useState(location.state?.notice ?? '')
  const [loading, setLoading] = useState(true)

  function syncRange(node) {
    const start = Math.max(0, Math.floor(node.scrollTop / STEP) - 3)
    const end = Math.min(levels.length, Math.ceil((node.scrollTop + node.clientHeight) / STEP) + 4)
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
    const currentIndex = levels.findIndex((level) => level.status === 'current')
    if (currentIndex < 0) {
      setAway(null)
      return
    }
    const top = node.scrollTop / STEP
    const bottom = (node.scrollTop + node.clientHeight) / STEP
    const spot = currentIndex + 0.5
    if (spot < top + 0.4) setAway('up')
    else if (spot > bottom - 0.4) setAway('down')
    else setAway(null)
  }

  useEffect(() => {
    let cancelled = false
    listLevels()
      .then((data) => {
        if (cancelled) return
        setLevels(data.levels)
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

  useEffect(() => {
    const node = scrollerRef.current
    if (!node || !levels.length) return
    const current = levels.findIndex((level) => level.status === 'current')
    const index = current >= 0 ? current : 0
    node.scrollTop = Math.max(0, index * STEP - node.clientHeight * 0.32)
    const start = Math.max(0, Math.floor(node.scrollTop / STEP) - 3)
    const end = Math.min(levels.length, Math.ceil((node.scrollTop + node.clientHeight) / STEP) + 4)
    setRange({ start, end })
  }, [levels])

  const cleared = levels.filter((level) => level.status === 'cleared').length
  const lookAt = levels[Math.min(levels.length - 1, range.start + 2)]
  const seenChapter = lookAt ? Math.floor((lookAt.id - 1) / CHAPTER_SIZE) : 0
  const currentLevel = levels.find((level) => level.status === 'current')
  const host = LOCKED_CANDY[seenChapter % LOCKED_CANDY.length]
  const pathFrom = Math.max(0, range.start)
  const pathTo = Math.max(pathFrom, range.end - 1)

  function jumpToCurrent() {
    const node = scrollerRef.current
    const index = levels.findIndex((level) => level.status === 'current')
    if (!node || index < 0) return
    node.scrollTo({ top: Math.max(0, index * STEP - node.clientHeight * 0.32), behavior: 'smooth' })
  }

  function openLevel(level) {
    if (level.status === 'locked') {
      setError('请先通过上一关')
      return
    }
    setError('')
    navigate(`/play/${level.id}`)
  }

  return (
    <section className="stack level-map">
      <div className="map-head">
        {levels.length ? <span className="map-candy" style={{ color: host }} aria-hidden="true" /> : null}
        <div>
          <p className="eyebrow">{levels.length ? `第 ${seenChapter + 1} 章` : '关卡'}</p>
          <h1>{levels.length ? chapterTitle(seenChapter) : '关卡'}</h1>
          {levels.length ? <p className="muted">已通关 {cleared}/{levels.length}</p> : null}
        </div>
      </div>
      {levels.length ? (
        <div className="grove-meter" aria-hidden="true">
          <span style={{ width: `${(cleared / levels.length) * 100}%` }} />
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">关卡加载中…</p> : null}
      <div className="vine-wrap">
      <div className="vine-scroll" ref={scrollerRef} onScroll={(event) => syncRange(event.currentTarget)}>
        <div className="vine" style={{ '--steps': levels.length, '--step': `${STEP}px` }}>
          {levels.length ? (
            <svg
              className="vine-svg"
              viewBox={`0 0 100 ${pathTo - pathFrom + 1}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{
                top: `calc(${pathFrom} * var(--step))`,
                height: `calc(${pathTo - pathFrom + 1} * var(--step))`,
              }}
            >
              <path className="vine-shade" d={vineCurve(pathFrom, pathTo)} />
              <path className="vine-stem" d={vineCurve(pathFrom, pathTo)} />
              <path className="vine-core" d={vineCurve(pathFrom, pathTo)} />
            </svg>
          ) : null}
          {levels.slice(range.start, range.end).map((level) => {
            const index = level.id - 1
            const x = WAVE[index % WAVE.length]
            const nextX = WAVE[(index + 1) % WAVE.length]
            const candy = LOCKED_CANDY[index % LOCKED_CANDY.length]
            return (
              <Fragment key={level.id}>
                {index < levels.length - 1 ? (
                  <span
                    className="vine-leaf"
                    style={{
                      left: `${(x + nextX) / 2}%`,
                      top: `calc((${index} + 1) * var(--step))`,
                      '--tilt': `${index % 2 === 0 ? 28 : -32}deg`,
                    }}
                  />
                ) : null}
                {index % 3 === 1 ? (
                  <span
                    className={`vine-bloom is-${index % 3}`}
                    style={{
                      left: `${x > 50 ? x - 16 : x + 16}%`,
                      top: `calc((${index} + 0.15) * var(--step))`,
                    }}
                  />
                ) : null}
                <button
                  type="button"
                  className={`den is-${level.status}`}
                  style={{
                    left: `${x}%`,
                    top: `calc((${index} + 0.5) * var(--step))`,
                  }}
                  onClick={() => openLevel(level)}
                  aria-label={`${level.name}，${level.status === 'locked' ? '未解锁' : goalText(level)}`}
                >
                  {index % CHAPTER_SIZE === 0 ? (
                    <span className="vine-sign">{chapterTitle(index / CHAPTER_SIZE)}</span>
                  ) : null}
                  <span
                    className="den-face"
                    style={
                      level.status === 'locked' || level.status === 'current'
                        ? { '--candy': candy }
                        : undefined
                    }
                  >
                    <strong>{level.id}</strong>
                  </span>
                  <span className="den-name">{level.status === 'locked' ? '' : level.name}</span>
                  {level.status === 'cleared' ? <Stars value={level.stars} /> : null}
                </button>
              </Fragment>
            )
          })}
        </div>
      </div>
      {away && currentLevel ? (
        <button
          type="button"
          className={`back-to-current is-${away}`}
          onClick={jumpToCurrent}
          aria-label={away === 'up' ? `回到上面的第 ${currentLevel.id} 关` : `回到下面的第 ${currentLevel.id} 关`}
        >
          <i aria-hidden="true" />
          {currentLevel.id}
        </button>
      ) : null}
      </div>
    </section>
  )
}
