import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { checkIn, getWallet, notifyWallet } from '../api/game.js'
import { MonsterTile } from '../components/MonsterTile.jsx'
import { MONSTER_TYPES } from '../game/monsters.js'
import { TILE_NAME } from '../game/tiles.js'

export function HomePage() {
  const [wallet, setWallet] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getWallet()
      .then((data) => {
        if (!cancelled) setWallet(data)
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
    try {
      setWallet(await checkIn())
      notifyWallet()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="hero-page">
      {error ? <p className="form-error">{error}</p> : null}
      <button type="button" className="event-banner" onClick={signIn} disabled={wallet?.checkedIn}>
        <strong>每日签到</strong>
        <span>{wallet?.checkedIn ? '今天已经领过了' : `领取 ${wallet?.checkInCoins ?? 50} 金币`}</span>
      </button>
      <p className="eyebrow">三消闯关</p>
      <h1>开心消消乐</h1>
      <p className="lede">三颗相同横排或竖排即可消除。进入关卡会消耗 1 点体力。</p>
      <div className="hero-cast">
        {MONSTER_TYPES.map((type) => (
          <span key={type} className={`tile tile-${type}`} role="img" aria-label={TILE_NAME[type] ?? type}>
            <MonsterTile type={type} />
          </span>
        ))}
      </div>
      <div className="actions">
        <Link to="/levels" className="btn">
          开始游戏
        </Link>
      </div>
    </section>
  )
}
