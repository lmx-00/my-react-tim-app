import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NO_STAMINA_TEXT, createPost, staminaBlocked, uploadPhoto } from '../api/game.js'
import { useAuth } from '../auth/useAuth.js'
import { makeShareCard } from '../game/shareCard.js'
import { Stars } from './Stars.jsx'

const STATUS_TEXT = {
  won: '过关成功',
  lost: '步数用尽',
  quit: '已退出本局',
  expired: '对局已过期',
}

const TOOL_NAME = { hammer: '锤子', shuffle: '洗牌', swap: '交换', plus: '加五步' }

function toolText(tools) {
  return Object.entries(tools ?? {})
    .filter(([, count]) => Number(count) > 0)
    .map(([key, count]) => `${TOOL_NAME[key] ?? key} ×${count}`)
    .join('、')
}

export function ResultDialog({ session }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [shareNote, setShareNote] = useState('')
  const [blocked, setBlocked] = useState('')
  const [posted, setPosted] = useState(false)
  const [posting, setPosting] = useState(false)
  const won = session.status === 'won'
  const nextId = session.nextLevelId
  const tools = toolText(session.rewardTools)

  async function enter(levelId) {
    setBlocked('')
    try {
      if (await staminaBlocked(levelId)) {
        setBlocked(NO_STAMINA_TEXT)
        return
      }
    } catch (err) {
      setBlocked(err.message)
      return
    }
    navigate(`/load/${levelId}`)
  }

  async function postToCommunity() {
    if (posted || posting) return
    setPosting(true)
    setShareNote('')
    try {
      const payload = { sessionId: session.sessionId }
      try {
        const blob = await makeShareCard(
          session,
          user?.nickname || (user?.isGuest ? '' : user?.username) || '',
        )
        payload.imageUrl = (await uploadPhoto(blob)).url
      } catch {
        // 图没成也把文字发上去
      }
      await createPost(payload)
      setPosted(true)
      setShareNote('已发到社区')
    } catch (err) {
      if (err.code === 'ALREADY_CLAIMED') setPosted(true)
      setShareNote(err.message)
    } finally {
      setPosting(false)
    }
  }

  async function share() {
    const where = Number(session.level.id) === 0 ? '每日挑战' : `第 ${session.level.id} 关`
    const text = won
      ? `我在开心消消乐通过了${where}，得分 ${session.score}，${session.stars} 星。`
      : `我在开心消消乐${where}得了 ${session.score} 分。`
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
          {Number(session.level.id) === 0 ? session.level.name : `第 ${session.level.id} 关 ${session.level.name}`}
        </p>
        <p className="muted">
          得分 {session.score}，剩余步数 {session.movesLeft}
        </p>
        {session.rewardCoins ? <p>获得 {session.rewardCoins} 金币</p> : null}
        {tools ? (
          <p>
            获得 {tools}
            {session.level.id > 0 && session.level.id % 20 === 0 ? (
              <span className="muted">（本章最后一关首次星级奖励）</span>
            ) : null}
          </p>
        ) : null}
        {blocked ? <p className="form-error">{blocked}</p> : null}
        <div className="result-actions">
          {won && nextId ? (
            <>
              <button type="button" className="btn" onClick={() => enter(nextId)}>
                下一关
              </button>
              <div className="result-pair">
                <button type="button" className="btn btn-ghost" onClick={() => enter(session.level.id)}>
                  再玩一次
                </button>
                <Link to="/levels" className="btn btn-ghost">
                  返回关卡
                </Link>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="btn" onClick={() => enter(session.level.id)}>
                再玩一次
              </button>
              <Link to="/levels" className="btn btn-ghost">
                返回关卡
              </Link>
            </>
          )}
          <div className="result-share">
            <button type="button" onClick={postToCommunity} disabled={posted || posting}>
              {posted ? '已发到社区' : posting ? '发送中…' : '发到社区'}
            </button>
            <button type="button" onClick={share}>
              分享
            </button>
          </div>
          {shareNote ? <p className="muted">{shareNote}</p> : null}
        </div>
      </section>
    </div>
  )
}
