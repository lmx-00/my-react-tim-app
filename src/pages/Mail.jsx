import { useEffect, useRef, useState } from 'react'
import { claimAllMail, claimMail, deleteMail, listMail } from '../api/game.js'

function rewardText(reward) {
  const parts = []
  if (reward?.coins) parts.push(`${reward.coins} 金币`)
  if (reward?.diamonds) parts.push(`${reward.diamonds} 钻石`)
  if (reward?.stamina) parts.push(`${reward.stamina} 体力`)
  if (reward?.tools?.hammer) parts.push(`锤子 ×${reward.tools.hammer}`)
  if (reward?.tools?.shuffle) parts.push(`洗牌 ×${reward.tools.shuffle}`)
  if (reward?.tools?.swap) parts.push(`交换 ×${reward.tools.swap}`)
  if (reward?.tools?.plus) parts.push(`加五步 ×${reward.tools.plus}`)
  return parts.join('、') || '无附件'
}

const DELETE_WIDTH = 76

function MailRow({ item, open, onOpen, onClaim, onDelete }) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const origin = useRef(null)
  const locked = useRef(false)
  const drag = useRef(0)

  function onPointerDown(event) {
    if (!item.claimed || event.button !== 0) return
    origin.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, open }
    locked.current = false
  }

  function onPointerMove(event) {
    const start = origin.current
    if (!start || event.pointerId !== start.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!locked.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      if (Math.abs(dy) > Math.abs(dx)) {
        origin.current = null
        return
      }
      locked.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    const next = Math.max(-DELETE_WIDTH, Math.min(0, (start.open ? -DELETE_WIDTH : 0) + dx))
    drag.current = next
    setDragX(next)
  }

  function onPointerUp(event) {
    const start = origin.current
    if (!start || event.pointerId !== start.pointerId) return
    const shouldOpen = locked.current ? drag.current < -DELETE_WIDTH / 2 : start.open
    origin.current = null
    locked.current = false
    drag.current = 0
    setDragging(false)
    setDragX(0)
    onOpen(shouldOpen ? item.id : null)
  }

  const x = dragging ? dragX : open ? -DELETE_WIDTH : 0

  return (
    <div className="mail-swipe">
      {item.claimed ? (
        <button type="button" className="mail-delete" onClick={() => onDelete(item.id)}>
          删除
        </button>
      ) : null}
      <article
        className={`shop-row mail-front${dragging ? ' is-dragging' : ''}`}
        style={item.claimed ? { transform: `translateX(${x}px)` } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div>
          <strong>{item.title}</strong>
          <p className="muted">{item.body}</p>
          <p>{rewardText(item.reward)}</p>
        </div>
        <button type="button" className="btn btn-sm" disabled={item.claimed} onClick={() => onClaim(item.id)}>
          {item.claimed ? '已领取' : '领取'}
        </button>
      </article>
    </div>
  )
}

export function MailPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

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

  async function remove(id) {
    setError('')
    try {
      const data = await deleteMail(id)
      setItems(data.items)
      setOpenId(null)
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
          <MailRow
            key={item.id}
            item={item}
            open={openId === item.id}
            onOpen={setOpenId}
            onClaim={claim}
            onDelete={remove}
          />
        ))}
      </div>
    </section>
  )
}
