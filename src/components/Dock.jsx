import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getWallet } from '../api/game.js'

const ITEMS = [
  { to: '/shop', label: '商店', icon: 'shop' },
  { to: '/shop#packs', label: '礼包', icon: 'gift', pack: true },
  { to: '/bag', label: '背包', icon: 'bag' },
  { to: '/mail', label: '邮件', icon: 'mail' },
  { to: '/activity', label: '活动', icon: 'event' },
]

function Icon({ name }) {
  if (name === 'shop') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M4 9h16l-1.2 11H5.2L4 9zm2.2-3h11.6l1 3H5.2l1-3zM9 13h6v2H9v-2z" />
      </svg>
    )
  }
  if (name === 'gift') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M4 11h16v9H4v-9zm8-7c1.4 0 2.5.8 3 2H20v3H4V6h5c.5-1.2 1.6-2 3-2zm0 2c-.6 0-1 .4-1 1h2c0-.6-.4-1-1-1z" />
      </svg>
    )
  }
  if (name === 'bag') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M8 8V7a4 4 0 0 1 8 0v1h3v12H5V8h3zm2 0h4V7a2 2 0 0 0-4 0v1z" />
      </svg>
    )
  }
  if (name === 'mail') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M3 6h18v12H3V6zm9 7 8-5H4l8 5z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 3l2.2 5.3L20 9l-4 3.6L17.2 19 12 16.2 6.8 19 8 12.6 4 9l5.8-.7L12 3z" />
    </svg>
  )
}

export function Dock() {
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      getWallet()
        .then((data) => {
          if (!cancelled) setUnread(data.unread ?? 0)
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

  return (
    <nav className="dock" aria-label="常用入口">
      {ITEMS.map((item) => {
        const pack = location.pathname === '/shop' && location.hash === '#packs'
        const active = item.pack ? pack : item.to === '/shop' ? location.pathname === '/shop' && !pack : location.pathname === item.to
        return (
          <NavLink key={item.label} to={item.to} className={active ? 'is-on' : ''} aria-current={active ? 'page' : undefined}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.icon === 'mail' && unread > 0 ? <em>{unread}</em> : null}
          </NavLink>
        )
      })}
    </nav>
  )
}
