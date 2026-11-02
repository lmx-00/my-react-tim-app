import { useEffect, useState } from 'react'
import { claimAllMail, claimMail, listMail } from '../api/game.js'

function rewardText(reward) {
  const parts = []
  if (reward?.coins) parts.push(`${reward.coins} 金币`)
  if (reward?.diamonds) parts.push(`${reward.diamonds} 钻石`)
  if (reward?.stamina) parts.push(`${reward.stamina} 体力`)
  if (reward?.tools?.hammer) parts.push(`锤子 ×${reward.tools.hammer}`)
  if (reward?.tools?.shuffle) parts.push(`洗牌 ×${reward.tools.shuffle}`)
  if (reward?.tools?.swap) parts.push(`交换 ×${reward.tools.swap}`)
  return parts.join('、') || '无附件'
}

export function MailPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listMail()
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

  async function claim(id) {
    setError('')
    try {
      const data = id ? await claimMail(id) : await claimAllMail()
      setItems(data.items)
    } catch (err) {
      setError(err.message)
    }
  }

  const unread = items.some((item) => !item.claimed)

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>邮件</h1>
        {unread ? (
          <button type="button" className="btn btn-sm" onClick={() => claim()}>
            一键领取
          </button>
        ) : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {items.length === 0 ? <p className="muted">还没有邮件。</p> : null}
      <div className="shop-list">
        {items.map((item) => (
          <article key={item.id} className="shop-row">
            <div>
              <strong>{item.title}</strong>
              <p className="muted">{item.body}</p>
              <p>{rewardText(item.reward)}</p>
            </div>
            <button type="button" className="btn btn-sm" disabled={item.claimed} onClick={() => claim(item.id)}>
              {item.claimed ? '已领取' : '领取'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
