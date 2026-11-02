import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBag } from '../api/game.js'

export function BagPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getBag()
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

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>背包</h1>
        <Link to="/shop" className="btn btn-sm">
          去商店
        </Link>
      </div>
      <p className="muted">这里是账号里存着的道具。每局还会另外自带一些，自带的用完才会扣背包。</p>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="shop-list">
        {items.map((item) => (
          <article key={item.id} className="shop-row">
            <div>
              <strong>{item.name}</strong>
              <p className="muted">{item.text}</p>
            </div>
            <strong className="bag-count">×{item.count}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}
