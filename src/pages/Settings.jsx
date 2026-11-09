import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTheme } from '../api/game.js'
import { playerAudio, setMusicEnabled, setSfxEnabled } from '../game/sound.js'

export function SettingsPage() {
  const [site, setSite] = useState(true)
  const [music, setMusic] = useState(() => playerAudio().music)
  const [sfx, setSfx] = useState(() => playerAudio().sfx)

  useEffect(() => {
    getTheme()
      .then((data) => setSite(data.sound !== false))
      .catch(() => {})
  }, [])

  return (
    <section className="stack">
      <h1>设置</h1>
      {site ? null : <p className="muted">后台把全站声音关掉了。这里的开关会先记住，后台打开后再生效。</p>}
      <div className="account-card">
        <div className="account-link">
          <span>音乐</span>
          <button
            type="button"
            className={`switch${music ? ' is-on' : ''}`}
            aria-pressed={music}
            onClick={() => {
              const next = !music
              setMusicEnabled(next)
              setMusic(next)
            }}
          >
            <span />
          </button>
        </div>
        <div className="account-link">
          <span>音效</span>
          <button
            type="button"
            className={`switch${sfx ? ' is-on' : ''}`}
            aria-pressed={sfx}
            onClick={() => {
              const next = !sfx
              setSfxEnabled(next)
              setSfx(next)
            }}
          >
            <span />
          </button>
        </div>
        <Link className="account-link" to="/agreement">
          <span>用户协议</span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link className="account-link" to="/privacy">
          <span>隐私政策</span>
          <span aria-hidden="true">›</span>
        </Link>
      </div>
    </section>
  )
}
