import { useEffect, useState } from 'react'
import { claimEvent, getActivity, checkIn, notifyWallet } from '../api/game.js'

function endsLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日结束`
}

export function ActivityPage() {
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

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

  async function signIn() {
    setError('')
    setNote('')
    try {
      const wallet = await checkIn()
      notifyWallet()
      const data = await getActivity()
      setActivity(data)
      setNote(wallet.bonus ? `签到成功，连续 ${data.streak} 天，额外 ${wallet.bonus} 金币` : `签到成功，连续 ${data.streak} 天`)
    } catch (err) {
      setError(err.message)
    }
  }

  async function claim() {
    if (!activity?.event) return
    setError('')
    setNote('')
    try {
      setActivity(await claimEvent(activity.event.id))
      notifyWallet()
      setNote('活动奖励已领到')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>活动</h1>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {note ? <p className="muted">{note}</p> : null}
      {!activity ? <p className="muted">活动加载中…</p> : null}
      {activity ? (
        <>
          <article className="shop-row">
            <div>
              <strong>每日签到</strong>
              <p className="muted">每天领 {activity.checkInCoins} 金币。</p>
            </div>
            <button type="button" className="btn btn-sm" disabled={activity.checkedIn} onClick={signIn}>
              {activity.checkedIn ? '已签到' : '签到'}
            </button>
          </article>
          <article className="shop-row">
            <div>
              <strong>连续打卡</strong>
              <p className="muted">
                已连续 {activity.streak} 天。满 {activity.streakGoal} 天额外 {activity.streakBonus} 金币，断一天就从头计。
              </p>
            </div>
            <strong className="bag-count">{activity.streak}/{activity.streakGoal}</strong>
          </article>
          {activity.event ? (
            <article className="shop-row">
              <div>
                <strong>{activity.event.name}</strong>
                <p className="muted">{activity.event.text}</p>
                <p className="muted">{endsLabel(activity.event.endsAt)}</p>
              </div>
              <button type="button" className="btn btn-sm" disabled={activity.event.claimed} onClick={claim}>
                {activity.event.claimed ? '已领取' : '领取'}
              </button>
            </article>
          ) : (
            <p className="muted">当前没有限时活动。</p>
          )}
        </>
      ) : null}
    </section>
  )
}
