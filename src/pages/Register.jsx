import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

const USERNAME_RULE = /^[a-zA-Z0-9_]{3,16}$/
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,32}$/

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!USERNAME_RULE.test(username.trim())) {
      setError('用户名需为 3–16 位字母、数字或下划线')
      return
    }
    if (!PASSWORD_RULE.test(password)) {
      setError('密码需 8–32 位，并同时包含字母和数字')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setSubmitting(true)
    try {
      await register(username.trim(), password)
      navigate('/levels', { replace: true })
    } catch (err) {
      setError(err.message || '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="stack">
      <h1>注册</h1>
      <p>注册成功后会自动登录。</p>
      <form className="form" onSubmit={handleSubmit}>
        {error ? <p className="form-error">{error}</p> : null}
        <label>
          用户名
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          密码
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          确认密码
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? '注册中…' : '注册'}
        </button>
      </form>
      <p>
        已有账号？<Link to="/login">去登录</Link>
      </p>
    </section>
  )
}
