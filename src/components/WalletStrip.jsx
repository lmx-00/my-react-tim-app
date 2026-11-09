import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getWallet } from '../api/game.js'

function formatLeft(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function WalletStrip() {
  const location = useLocation()
  const [wallet, setWallet] = useState(null)
  const [deadline, setDeadline] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    const load = () => {
      getWallet()
        .then((data) => {
          if (cancelled) return
          setWallet(data)
          setDeadline(data.nextStaminaMs == null ? null : Date.now() + data.nextStaminaMs)
        })
        .catch(() => {})
    }
    load()
    window.addEventListener('hm-wallet', load)
    return () => {
      cancelled = true
      window.removeEventListener('hm-wallet', load)
    }
  }, [location.pathname])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (deadline == null || now < deadline) return
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event('hm-wallet'))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [deadline, now])

  const left = deadline == null ? null : Math.max(0, deadline - now)
  const staminaLabel = wallet
    ? `体力 ${wallet.stamina}/${wallet.staminaMax}，每 30 分钟恢复 1 点${left == null ? '，已满' : `，下次 ${formatLeft(left)}`}`
    : '体力'
  const inPlay = location.pathname.startsWith('/play/')
  const Wrap = inPlay ? 'div' : Link

  return (
    <div className="wallet-strip">
      <div className="wallet-pills">
        <Wrap
          className="pill pill-heart"
          aria-label={staminaLabel}
          title="每 30 分钟恢复 1 点，最多 5 点"
          {...(inPlay ? {} : { to: '/shop#supply' })}
        >
          <svg className="pill-icon" viewBox="0 0 32 32" aria-hidden="true">
            <path fill="#ff4d6d" d="M16 27s-9.5-6.2-12.4-11.2C1.6 12.4 3 8 7.2 7.2 10 6.6 12.4 8 16 11.4 19.6 8 22 6.6 24.8 7.2 29 8 30.4 12.4 28.4 15.8 25.5 20.8 16 27 16 27z" />
          </svg>
          <span className="pill-stack">
            <strong>{wallet ? wallet.stamina : '—'}</strong>
            <small>{left == null ? '已满' : formatLeft(left)}</small>
          </span>
        </Wrap>
        <Wrap className="pill pill-coin" aria-label={wallet ? `金币 ${wallet.coins}` : '金币'} {...(inPlay ? {} : { to: '/shop#tools' })}>
          <svg className="pill-icon" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="12" fill="#ffb703" />
            <circle cx="16" cy="16" r="8" fill="none" stroke="#fff6d8" strokeWidth="2" />
          </svg>
          <strong>{wallet?.coins ?? '—'}</strong>
        </Wrap>
        <Wrap className="pill pill-gem" aria-label={wallet ? `钻石 ${wallet.diamonds}` : '钻石'} {...(inPlay ? {} : { to: '/shop#packs' })}>
          <svg className="pill-icon" viewBox="0 0 32 32" aria-hidden="true">
            <path fill="#67d4ff" d="M8 8h16l4 6-12 14L4 14z" />
            <path fill="#e8f9ff" d="M12 8h8l2 6H10z" />
          </svg>
          <strong>{wallet?.diamonds ?? '—'}</strong>
        </Wrap>
      </div>
    </div>
  )
}
