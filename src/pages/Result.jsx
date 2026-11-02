import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSession } from '../api/game.js'
import { ResultDialog } from '../components/ResultDialog.jsx'

export function ResultPage() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getSession(sessionId)
      .then((data) => {
        if (!cancelled) setSession(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (error) {
    return (
      <section className="stack">
        <p className="form-error">{error}</p>
        <Link to="/levels">返回关卡</Link>
      </section>
    )
  }

  if (!session) {
    return (
      <section className="stack">
        <p className="muted">结算加载中…</p>
      </section>
    )
  }

  return <ResultDialog session={session} />
}
