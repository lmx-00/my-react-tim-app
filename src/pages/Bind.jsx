import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { rememberWechat, storedWechat } from '../auth/wechat.js'

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,32}$/

export function BindPage() {
  const { user, bindPhone, bindWechat } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [submitting, setSubmitting] = useState(false)
  rememberWechat(window.location.search)

  async function handlePhone(event) {
    event.preventDefault()
    setError('')
    setSaved('')
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入 11 位手机号')
      return
    }
    if (!PASSWORD_RULE.test(password)) {
      setError('密码需 8–32 位，并同时包含字母和数字')
      return
    }
    setSubmitting(true)
    try {
      await bindPhone(phone, password)
      setSaved('手机号已绑定')
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err.message || '绑定失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleWechat() {
    setError('')
    setSaved('')
    const current = storedWechat()
    if (!current.openid) {
      setError('请从微信小程序打开游戏后再绑定')
      return
    }
    setSubmitting(true)
    try {
      await bindWechat(current)
      setSaved('微信已绑定')
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err.message || '绑定失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="stack auth-stack">
      <h1>账号绑定</h1>
      <p className="lede">
        {user?.isGuest ? '游客账号绑定手机号后，可以在别的设备登录。' : '把手机号或微信绑到当前账号。'}
      </p>
      {error ? <p className="form-error">{error}</p> : null}
      {saved ? <p className="muted">{saved}</p> : null}
      <form className="form" onSubmit={handlePhone}>
        <label>
          手机号
          <input
            name="phone"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            placeholder={user?.phone || '未绑定'}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label>
          {user?.hasPassword ? '登录密码' : '设置密码'}
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" className="btn" disabled={submitting || user?.hasPhone}>
          {user?.hasPhone ? '手机号已绑定' : '绑定手机号'}
        </button>
      </form>
      <button type="button" className="btn btn-ghost" disabled={submitting || user?.hasOpenid} onClick={handleWechat}>
        {user?.hasOpenid ? '微信已绑定' : '绑定当前微信'}
      </button>
      <p className="auth-foot">
        <Link to="/profile">返回我的</Link>
      </p>
    </section>
  )
}
