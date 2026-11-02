import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Stars } from './Stars.jsx'

const STATUS_TEXT = {
  won: '过关成功',
  lost: '步数用尽',
  quit: '已退出本局',
  expired: '对局已过期',
}

const TOOL_NAME = { hammer: '锤子', shuffle: '洗牌', swap: '交换' }

function toolText(tools) {
  return Object.entries(tools ?? {})
    .filter(([, count]) => Number(count) > 0)
    .map(([key, count]) => `${TOOL_NAME[key] ?? key} ×${count}`)
    .join('、')
}

export function ResultDialog({ session }) {
  const [shareNote, setShareNote] = useState('')
  const won = session.status === 'won'
  const nextId = session.nextLevelId
  const tools = toolText(session.rewardTools)

  async function share() {
    const text = won
      ? `我在开心消消乐通过了第 ${session.level.id} 关，得分 ${session.score}，${session.stars} 星。`
      : `我在开心消消乐第 ${session.level.id} 关得了 ${session.score} 分。`
    if (navigator.share) {
      try {
        await navigator.share({ title: '开心消消乐', text })
        setShareNote('')
        return
      } catch (err) {
        if (err?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setShareNote('战绩已复制，可以发给朋友')
    } catch {
      setShareNote(text)
    }
  }

  return (
    <div className="cashier-mask" role="presentation">
      <section className="cashier result-dialog" role="dialog" aria-label="结算">
        <p className="eyebrow">{won ? '太棒了' : '再试一次'}</p>
        <h2>{STATUS_TEXT[session.status] ?? '对局结束'}</h2>
        <Stars value={session.stars} />
        <p>
          第 {session.level.id} 关 {session.level.name}
        </p>
        <p className="muted">
          得分 {session.score}，剩余步数 {session.movesLeft}
        </p>
        {session.rewardCoins ? <p>获得 {session.rewardCoins} 金币</p> : null}
        {tools ? <p>获得 {tools}</p> : null}
        {shareNote ? <p className="muted">{shareNote}</p> : null}
        <div className="actions">
          {won && nextId ? (
            <Link to={`/load/${nextId}`} className="btn">
              下一关
            </Link>
          ) : null}
          <Link to={`/load/${session.level.id}`} className="btn btn-ghost">
            再玩一次
          </Link>
          <button type="button" className="btn btn-ghost" onClick={share}>
            分享
          </button>
          <Link to="/levels" className="btn btn-ghost">
            返回关卡
          </Link>
        </div>
      </section>
    </div>
  )
}
