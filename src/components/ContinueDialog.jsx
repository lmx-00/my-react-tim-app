import { useState } from 'react'
import { applyPlus, continueSession, giveUpSession, notifyWallet } from '../api/game.js'

export function ContinueDialog({ session, onUpdate, onQuit }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const plus = session.tools?.plus ?? 0
  const cost = session.continueCost
  const diamonds = session.diamonds ?? 0

  async function run(action) {
    setError('')
    setBusy(true)
    try {
      const data = await action()
      notifyWallet()
      onUpdate(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="cashier-mask" role="presentation">
      <section className="cashier result-dialog" role="dialog" aria-label="加步">
        <p className="eyebrow">还差一点</p>
        <h2>步数用尽</h2>
        <p className="muted">花钻石或用加五步，可以再走几步。不加就本局失败。</p>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="actions">
          {plus > 0 ? (
            <button type="button" className="btn" disabled={busy} onClick={() => run(() => applyPlus(session.sessionId))}>
              用加五步
            </button>
          ) : null}
          {session.canContinue && cost != null ? (
            <button
              type="button"
              className="btn"
              disabled={busy || diamonds < cost}
              onClick={() => run(() => continueSession(session.sessionId))}
            >
              {diamonds < cost ? `钻石不够（要 ${cost}）` : `${cost} 钻石加五步`}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => run(() => giveUpSession(session.sessionId))}
          >
            放弃本局
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onQuit}>
            返回关卡
          </button>
        </div>
      </section>
    </div>
  )
}
