const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

let authToken = null

export function setAuthToken(token) {
  authToken = token ?? null
}

export async function api(path, options = {}) {
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
