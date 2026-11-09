import { useEffect, useState } from 'react'
import { getAlbum } from '../api/game.js'
import { MonsterTile } from '../components/MonsterTile.jsx'

export function AlbumPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getAlbum()
      .then((data) => {
        if (!cancelled) setItems(data.items ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const found = items.filter((item) => item.count > 0).length

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>图鉴</h1>
        <p className="muted">
          {items.length ? `见过 ${found}/${items.length}` : '过关消掉的小动物会记在这里。'}
        </p>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="album-grid">
        {items.map((item) => (
          <article key={item.id} className={`album-card${item.count ? '' : ' is-locked'}`}>
            <span className="album-face" aria-hidden="true">
              {item.count ? <MonsterTile type={item.id} /> : '?'}
            </span>
            <strong>{item.count ? item.name : '未遇见'}</strong>
            <p className="muted">{item.count ? `消掉 ${item.count}` : '过关后才会出现'}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
