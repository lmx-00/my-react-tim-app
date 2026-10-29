import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { Landscape } from './Landscape.jsx'

export function Layout({ children }) {
  const { isLoggedIn, user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <Landscape />
      <header className="topbar">
        <Link to={isLoggedIn ? '/' : '/login'} className="brand">
          开心消消乐
        </Link>
        <nav className="nav">
          <NavLink to="/levels">关卡</NavLink>
          <NavLink to="/records">记录</NavLink>
          <NavLink to="/profile">我的</NavLink>
        </nav>
        <div className="topbar-actions">
          {isLoggedIn ? (
            <>
              <span className="topbar-user">{user.username}</span>
              <button type="button" className="link-btn" onClick={handleLogout}>
                退出
              </button>
            </>
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
      <main className="page">{children}</main>
    </div>
  )
}
