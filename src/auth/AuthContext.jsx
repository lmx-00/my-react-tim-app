import { useEffect, useMemo, useState } from 'react'
import { loginRequest, logoutRequest, registerRequest } from '../api/auth.js'
import { onAuthChange, refreshAuth, setAuthToken } from '../api/client.js'
import { AuthContext } from './useAuth.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [ready, setReady] = useState(false)

  function applyAuth(data) {
    setAuthToken(data.accessToken)
    setUser(data.user)
    setAccessToken(data.accessToken)
  }

  function clearAuth() {
    setAuthToken(null)
    setUser(null)
    setAccessToken(null)
  }

  useEffect(() => {
    let cancelled = false

    // 之后每次自动续期的结果同步回来；refresh token 也失效了就当退出登录
    onAuthChange((data) => {
      if (cancelled) return
      if (data) {
        setUser(data.user)
        setAccessToken(data.accessToken)
      } else {
        clearAuth()
      }
    })

    refreshAuth()
      .then((data) => {
        if (!cancelled) applyAuth(data)
      })
      .catch(() => {
        if (!cancelled) clearAuth()
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      ready,
      isLoggedIn: Boolean(user),
      async login(username, password) {
        const data = await loginRequest(username, password)
        applyAuth(data)
        return data
      },
      async register(username, password) {
        const data = await registerRequest(username, password)
        applyAuth(data)
        return data
      },
      async logout() {
        try {
          await logoutRequest()
        } catch {
          // Cookie 失效时也清本地状态
        }
        clearAuth()
      },
    }),
    [user, accessToken, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
