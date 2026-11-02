import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { getTheme } from '../api/game.js'
import { applyTheme } from '../game/theme.js'
import { setSiteSound } from '../game/sound.js'
import { rememberWechat } from '../auth/wechat.js'
import { useAuth } from '../auth/useAuth.js'
import { Landscape } from './Landscape.jsx'
import { WalletStrip } from './WalletStrip.jsx'
import { Dock } from './Dock.jsx'

export function Layout({ children }) {
  const { isLoggedIn, user, saveAvatar } = useAuth()
  const location = useLocation()
  const inGame = location.pathname.startsWith('/play/')

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
    <div className={`app-shell${isLoggedIn && !inGame ? ' has-dock' : ''}`}>
      <Landscape />
      {inGame ? null : (
      <div className="sticky-top">
      <header className="topbar">
        <Link to={isLoggedIn ? '/' : '/login'} className="brand">
          开心消消乐
        </Link>
        <nav className="nav">
          <NavLink to="/levels">关卡</NavLink>
          <NavLink to="/shop">商店</NavLink>
          <NavLink to="/bag">背包</NavLink>
          <NavLink to="/rank">排行</NavLink>
          <NavLink to="/records">记录</NavLink>
          <NavLink to="/profile">我的</NavLink>
          {user?.role === 'admin' ? <NavLink to="/admin">后台</NavLink> : null}
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
      {isLoggedIn && !inGame ? <Dock /> : null}
    </div>
  )
}
