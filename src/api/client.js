const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

let authToken = null
let authListener = null
let refreshing = null

export function setAuthToken(token) {
  authToken = token ?? null
}

// AuthContext 订阅：续期成功给新身份，refresh token 也失效时给 null
export function onAuthChange(listener) {
  authListener = listener
}

async function request(path, options = {}) {
  const { token, body, headers, ...rest } = options
  const accessToken = token ?? authToken

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  const json = await res.json().catch(() => null)
  if (!json?.ok) {
    const error = new Error(json?.error?.message ?? '请求失败')
    error.code = json?.error?.code
    error.status = res.status
    throw error
  }

  return json.data
}

// 拿 HttpOnly 的 refresh cookie 换新的 access token。
// 刷新会把旧 refresh token 作废，所以并发的请求必须共用同一次刷新。
export function refreshAuth() {
  if (!refreshing) {
    refreshing = request('/auth/refresh', { method: 'POST' })
      .then((data) => {
        authToken = data.accessToken
        authListener?.(data)
        return data
      })
      .catch((err) => {
        authToken = null
        authListener?.(null)
        throw err
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

export async function api(path, options = {}) {
  try {
    return await request(path, options)
  } catch (err) {
    // access token 只有 15 分钟，401 先悄悄续期再重试一次；
    // /auth 下的接口本身就是登录流程，不参与
    if (err.status !== 401 || path.startsWith('/auth/')) throw err
    await refreshAuth()
    return request(path, options)
  }
}
