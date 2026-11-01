import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { changePasswordRequest } from '../api/auth.js'

export function PasswordPage() {
  const navigate = useNavigate()
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')

  function update(key, value) {
    setPasswords((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (passwords.newPassword !== passwords.confirm) {
      setError('两次输入的新密码不一致')
      return
    }
    try {
      await changePasswordRequest(passwords.oldPassword, passwords.newPassword)
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="stack auth-stack">
      <h1>修改密码</h1>
      <form className="form" onSubmit={handleSubmit}>
        {error ? <p className="form-error">{error}</p> : null}
        <label>
          当前密码
          <input
            type="password"
            autoComplete="current-password"
            value={passwords.oldPassword}
            onChange={(event) => update('oldPassword', event.target.value)}
          />
        </label>
        <label>
          新密码
          <input
            type="password"
            autoComplete="new-password"
            value={passwords.newPassword}
            onChange={(event) => update('newPassword', event.target.value)}
          />
        </label>
        <label>
          再输入一次
          <input
            type="password"
            autoComplete="new-password"
            value={passwords.confirm}
            onChange={(event) => update('confirm', event.target.value)}
          />
        </label>
        <button type="submit" className="btn">
          保存新密码
        </button>
      </form>
      <p className="auth-foot">
        <Link to="/profile">返回我的</Link>
      </p>
    </section>
  )
}
