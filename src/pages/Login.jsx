import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { rememberWechat, storedWechat } from '../auth/wechat.js'

export function LoginPage() {
  const { login, loginPhone, sendPhoneCode, loginPhoneCode, loginGuest, loginWechat } = useAuth()
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('username')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname ?? '/levels'
  rememberWechat(location.search)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'code') {
        if (!/^1\d{10}$/.test(phone) || !/^\d{6}$/.test(code)) {
          setError('请输入手机号和 6 位验证码')
          return
        }
        await loginPhoneCode(phone, code)
      } else if (mode === 'phone') {
        if (!/^1\d{10}$/.test(phone)) {
          setError('请输入 11 位手机号')
          return
        }
        await loginPhone(phone, password)
      } else {
        if (!username.trim() || !password) {
          setError('请输入用户名和密码')
          return
        }
        await login(username.trim(), password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function enterAsGuest() {
    setError('')
    setSubmitting(true)
    try {
      await loginGuest()
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || '游客登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function enterWithWechat() {
    setError('')
    const current = storedWechat()
    if (!current.openid) {
      setError('请从微信小程序打开游戏，才能使用微信登录')
      return
    }
    setSubmitting(true)
    try {
      await loginWechat(current)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || '微信登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="stack auth-stack">
      <h1>登录</h1>
      <p className="lede">登录后才能进入关卡、对局和记录。</p>
      <div className="auth-switch">
        <button type="button" className={mode === 'username' ? 'is-on' : ''} onClick={() => setMode('username')}>
          用户名
        </button>
        <button type="button" className={mode === 'phone' ? 'is-on' : ''} onClick={() => setMode('phone')}>
          手机号
        </button>
        <button type="button" className={mode === 'code' ? 'is-on' : ''} onClick={() => setMode('code')}>
          验证码
        </button>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        {error ? <p className="form-error">{error}</p> : null}
        {mode === 'phone' || mode === 'code' ? (
          <label>
            手机号
            <input
              name="phone"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
        ) : (
          <label>
            用户名
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
        )}
        {mode === 'code' ? (
          <label>
            验证码
            <input
              name="code"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
        ) : (
          <label>
            密码
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        )}
        {mode === 'code' ? (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={submitting}
            onClick={async () => {
              setError('')
              setDevCode('')
              try {
                const data = await sendPhoneCode(phone)
                if (data.devCode) setDevCode(data.devCode)
              } catch (err) {
                setError(err.message)
              }
            }}
          >
            获取验证码
          </button>
        ) : null}
        {devCode ? <p className="muted">短信服务还没配置，本次验证码是 {devCode}</p> : null}
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? '登录中…' : '登录'}
        </button>
      </form>
      <div className="auth-methods">
        <button type="button" className="btn btn-ghost" disabled={submitting} onClick={enterAsGuest}>
          游客进入
        </button>
        <button type="button" className="btn btn-ghost" disabled={submitting} onClick={enterWithWechat}>
          微信一键登录
        </button>
      </div>
      <p className="muted">同一台设备再点游客进入，会回到原来的游客号。</p>
      <p className="auth-foot">
        还没有账号？<Link to="/register">去注册</Link>
      </p>
      <p className="auth-foot">
        <Link to="/agreement">用户协议</Link>
        <span> · </span>
        <Link to="/privacy">隐私政策</Link>
      </p>
    </section>
  )
}
