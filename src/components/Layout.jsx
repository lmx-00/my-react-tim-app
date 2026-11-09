import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { addFriend, getTheme, getWallet } from '../api/game.js'
import { applyTheme } from '../game/theme.js'
import { setSiteSound } from '../game/sound.js'
import { rememberWechat } from '../auth/wechat.js'
import { useAuth } from '../auth/useAuth.js'
import { Landscape } from './Landscape.jsx'
import { WalletStrip } from './WalletStrip.jsx'

export function Layout({ children }) {
  const { isLoggedIn, user, saveAvatar } = useAuth()
  const location = useLocation()
  const inGame = location.pathname.startsWith('/play/')
  // 读条那一下也把顶部收起来，既是整屏的加载画面，也免得读到一半被点进别的页面
  const inLoad = location.pathname.startsWith('/load/')
  const [notices, setNotices] = useState(0)

  useEffect(() => {
    if (!isLoggedIn) return undefined
    let cancelled = false
    const load = () => {
      getWallet()
        .then((data) => {
          if (!cancelled) setNotices(data.notices ?? 0)
        })
        .catch(() => {})
    }
    load()
    window.addEventListener('hm-wallet', load)
    return () => {
      cancelled = true
      window.removeEventListener('hm-wallet', load)
    }
  }, [isLoggedIn, location.pathname])

  useEffect(() => {
    getTheme()
      .then((data) => {
        applyTheme(data.theme)
        setSiteSound(data.sound)
      })
      .catch(() => {
        applyTheme('candy')
      })
  }, [])

  useEffect(() => {
    const invite = new URLSearchParams(location.search).get('invite')
    if (invite) sessionStorage.setItem('hm-invite', invite)
    if (!isLoggedIn) return undefined
    const pending = sessionStorage.getItem('hm-invite')
    if (!pending) return undefined
    addFriend(pending)
      .catch(() => {})
      .finally(() => sessionStorage.removeItem('hm-invite'))
    return undefined
  }, [isLoggedIn, location.search])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    rememberWechat(location.search)
    const wxAvatar = params.get('wxAvatar')
    if (!isLoggedIn) return
    const avatar = wxAvatar || sessionStorage.getItem('wx-avatar')
    if (!avatar || avatar === user?.avatarUrl) return
    saveAvatar(avatar)
      .then(() => sessionStorage.removeItem('wx-avatar'))
      .catch(() => {})
  }, [isLoggedIn, location.search, saveAvatar, user?.avatarUrl])

  return (
    <div className={`app-shell${inGame ? ' is-playing' : ''}`}>
      <Landscape />
      {inGame || inLoad ? null : (
      <div className="sticky-top">
      <header className="topbar">
        <Link to={isLoggedIn ? '/levels' : '/login'} className="brand">
          开心消消乐
        </Link>
        <nav className="nav">
          <NavLink to="/levels">关卡</NavLink>
          <NavLink to="/shop">商店</NavLink>
          <NavLink to="/rank">排行</NavLink>
          <NavLink to="/profile">
            <span className="nav-label">
              我的
              {notices > 0 ? <em>{notices > 9 ? '9+' : notices}</em> : null}
            </span>
          </NavLink>
        </nav>
        <div className="topbar-actions">
          {isLoggedIn ? (
            <span className="topbar-user">
              {user.avatarUrl ? <img className="topbar-avatar" src={user.avatarUrl} alt="" /> : null}
              {user.nickname || user.username}
            </span>
          ) : (
            <>
              <NavLink to="/login">登录</NavLink>
              <NavLink to="/register" className="btn btn-sm">
                注册
              </NavLink>
            </>
          )}
        </div>
      </header>
      {isLoggedIn ? <WalletStrip /> : null}
      </div>
      )}
      {inGame && isLoggedIn ? <WalletStrip /> : null}
      <main className={`page${inGame ? ' is-game' : ''}`}>{children}</main>
    </div>
  )
}
