import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { claimEvent, claimTask, getActivity, checkIn, notifyWallet } from '../api/game.js'

const SPIN_TURNS = 6
const SPIN_MS = 4200

function endsLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日结束`
}

function rewardText(reward) {
  const parts = []
  if (reward?.coins) parts.push(`${reward.coins} 金币`)
  if (reward?.diamonds) parts.push(`${reward.diamonds} 钻石`)
  if (reward?.stamina) parts.push(`${reward.stamina} 体力`)
  if (reward?.tools?.hammer) parts.push(`锤子 ×${reward.tools.hammer}`)
  if (reward?.tools?.shuffle) parts.push(`洗牌 ×${reward.tools.shuffle}`)
  if (reward?.tools?.swap) parts.push(`交换 ×${reward.tools.swap}`)
  if (reward?.tools?.plus) parts.push(`加五步 ×${reward.tools.plus}`)
  return parts.join('、')
}

function restAngle(index, count) {
  const slice = 360 / count
  return (360 - (index * slice + slice / 2)) % 360
}

function spinTo(current, index, count) {
  const rest = restAngle(index, count)
  const base = ((current % 360) + 360) % 360
  const delta = (rest - base + 360) % 360
  return current + delta + 360 * SPIN_TURNS
}

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function slicePath(cx, cy, r, start, end) {
  const [x1, y1] = polar(cx, cy, r, start)
  const [x2, y2] = polar(cx, cy, r, end)
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
}

function streakView(streak, checkedIn) {
  if (!streak) return { filled: 0, todaySlot: 1, giftReady: false }
  const rem = streak % 7
  if (checkedIn) {
    const filled = rem === 0 ? 7 : rem
    return { filled, todaySlot: filled, giftReady: filled === 7 }
  }
  if (rem === 0) return { filled: 0, todaySlot: 1, giftReady: false }
  return { filled: rem, todaySlot: rem + 1, giftReady: false }
}

function SliceLabel({ prize, x, y }) {
  const unit = prize.reward?.diamonds ? '钻石' : prize.reward?.coins ? '金币' : ''
  const amount = prize.reward?.diamonds || prize.reward?.coins
  if (unit) {
    return (
      <text x={x} y={y} textAnchor="middle" fill="#5c2a42" fontSize="11" fontWeight="800">
        <tspan x={x} dy="-0.35em">
          {amount}
        </tspan>
        <tspan x={x} dy="1.15em">
          {unit}
        </tspan>
      </text>
    )
  }
  return (
    <text x={x} y={y} dominantBaseline="middle" textAnchor="middle" fill="#5c2a42" fontSize="13" fontWeight="800">
      {prize.label}
    </text>
  )
}

function CheckInWheel({ prizes, angle, snap, spinning }) {
  const count = prizes.length || 1
  const slice = 360 / count
  const cx = 100
  const cy = 100
  const r = 98
  return (
    <div className="wheel-stage">
      <div className="wheel-pointer" aria-hidden="true" />
      <div
        className={`wheel${snap ? ' is-snap' : ''}${spinning ? ' is-spinning' : ''}`}
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <svg viewBox="0 0 200 200" aria-hidden="true">
          {prizes.map((prize, index) => {
            const start = index * slice
            const mid = start + slice / 2
            const [lx, ly] = polar(cx, cy, 58, mid)
            return (
              <g key={prize.id}>
                <path d={slicePath(cx, cy, r, start, start + slice)} fill={prize.color} stroke="#fff" strokeWidth="2" />
                <SliceLabel prize={prize} x={lx} y={ly} />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="wheel-hub" aria-hidden="true">
        转
      </div>
    </div>
  )
}

export function ActivityPage() {
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [angle, setAngle] = useState(0)
  const [snap, setSnap] = useState(true)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    let cancelled = false
    getActivity()
      .then((data) => {
        if (!cancelled) setActivity(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activity?.wheel?.length || spinning) return
    const prize = activity.todayPrize
    if (!prize) return
    const index = activity.wheel.findIndex((item) => item.id === prize.id)
    if (index < 0) return
    setSnap(true)
    setAngle(restAngle(index, activity.wheel.length))
  }, [activity, spinning])

  async function spin() {
    if (spinning || activity?.checkedIn) return
    setError('')
    setNote('')
    setSpinning(true)
    try {
      const result = await checkIn()
      const prizes = activity.wheel ?? []
      const index = prizes.findIndex((item) => item.id === result.prize?.id)
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      setSnap(false)
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      if (index >= 0) {
        setAngle((current) => spinTo(current, index, prizes.length))
      }
      await new Promise((resolve) => setTimeout(resolve, reduced ? 200 : SPIN_MS))
      notifyWallet()
      const data = await getActivity()
      setActivity(data)
      const parts = [`转到了 ${rewardText(result.prize?.reward)}`]
      if (result.streakGift) parts.push(`连签满 7 天，再送 ${rewardText(result.streakGift)}`)
      setNote(parts.join('。'))
    } catch (err) {
      setError(err.message)
    } finally {
      setSpinning(false)
    }
  }

  async function claim(id) {
    setError('')
    setNote('')
    try {
      setActivity(await claimEvent(id))
      notifyWallet()
      setNote('活动奖励已领到')
    } catch (err) {
      setError(err.message)
    }
  }

  async function finishTask(id) {
    setError('')
    setNote('')
    try {
      setActivity(await claimTask(id))
      notifyWallet()
      setNote('任务奖励已领到')
    } catch (err) {
      setError(err.message)
    }
  }

  const view = activity ? streakView(activity.streak, activity.checkedIn) : null
  const giftText = activity ? rewardText(activity.streakGift) : ''

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>活动</h1>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {note ? <p className="muted">{note}</p> : null}
      {!activity ? <p className="muted">活动加载中…</p> : null}
      {activity ? (
        <div className="shop-list activity-scroll">
          <article className="checkin-card">
            <div className="checkin-copy">
              <strong>每日签到</strong>
              <p className="muted">每天转一次转盘。连签 7 天再送 {giftText || '一份礼物'}。断一天就从头计。</p>
            </div>
            <CheckInWheel prizes={activity.wheel ?? []} angle={angle} snap={snap} spinning={spinning} />
            <button type="button" className="btn" disabled={activity.checkedIn || spinning} onClick={spin}>
              {spinning ? '转动中…' : activity.checkedIn ? '今日已转' : '转转盘'}
            </button>
            {activity.checkedIn && activity.todayPrize && !spinning && !note ? (
              <p className="muted">今天转到了 {rewardText(activity.todayPrize.reward)}</p>
            ) : null}
            <ol className="streak-days" aria-label="连签进度">
              {Array.from({ length: 7 }, (_, i) => {
                const day = i + 1
                const done = view.filled >= day
                const today = !activity.checkedIn && view.todaySlot === day
                const gift = day === 7
                return (
                  <li key={day}>
                    <span
                      className={`streak-dot${done ? ' is-done' : ''}${today ? ' is-today' : ''}${gift ? ' is-gift' : ''}`}
                      aria-label={gift ? `第7天礼物${done ? '已点亮' : ''}` : `第${day}天${done ? '已点亮' : ''}`}
                    >
                      {gift ? '礼' : day}
                    </span>
                  </li>
                )
              })}
            </ol>
          </article>
          {activity.daily ? (
            <article className="shop-row">
              <div>
                <strong>每日挑战</strong>
                <p className="muted">
                  {activity.daily.won
                    ? '今天已经过关。'
                    : '藤蔓之外的一局。第一局不扣体力，过关送金币和洗牌。'}
                </p>
              </div>
              <Link className="btn btn-sm" to="/load/0">
                {activity.daily.won ? '再看看' : '去挑战'}
              </Link>
            </article>
          ) : null}
          {(activity.tasks ?? []).map((task) => (
            <article key={task.id} className="shop-row">
              <div>
                <strong>{task.name}</strong>
                <p className="muted">{task.text}</p>
              </div>
              {task.claimed || task.done ? (
                <button type="button" className="btn btn-sm" disabled={!task.done || task.claimed} onClick={() => finishTask(task.id)}>
                  {task.claimed ? '已领取' : '领取'}
                </button>
              ) : (
                <Link className="btn btn-sm btn-ghost" to="/levels">
                  去关卡
                </Link>
              )}
            </article>
          ))}
          {[...(activity.events ?? [])]
            .sort((a, b) => new Date(b.start || 0) - new Date(a.start || 0))
            .map((event) => (
              <article key={event.id} className="shop-row">
                <div>
                  <strong>{event.name}</strong>
                  <p className="muted">{event.text}</p>
                  <p className="muted">{endsLabel(event.endsAt)}</p>
                </div>
                <button type="button" className="btn btn-sm" disabled={event.claimed} onClick={() => claim(event.id)}>
                  {event.claimed ? '已领取' : '领取'}
                </button>
              </article>
            ))}
        </div>
      ) : null}
    </section>
  )
}
