import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth.js'

export function RequireAuth() {
  const { isLoggedIn, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <p className="auth-status">正在恢复登录状态…</p>
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function GuestOnly({ children }) {
  const { isLoggedIn, ready } = useAuth()

  if (!ready) {
    return <p className="auth-status">正在恢复登录状态…</p>
  }

  if (isLoggedIn) {
    return <Navigate to="/levels" replace />
  }

  return children
}
