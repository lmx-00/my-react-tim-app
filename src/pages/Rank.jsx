import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addFriend, getLeaderboard, giftStamina, removeFriend } from '../api/game.js'
import { useAuth } from '../auth/useAuth.js'

const PAGE_SIZE = 50

function Crown({ rank }) {
  const color = rank === 1 ? '#f5b301' : rank === 2 ? '#b9c4d4' : '#e09a62'
  return (
    <svg className="rank-crown" viewBox="0 0 24 16" aria-hidden="true">
      <path fill={color} d="M2 14h20l-1.2-8-4.2 3.2L12 2 7.4 9.2 3.2 6z" />
    </svg>
  )
}

function RankRow({ item, scoreMode, onRemove, onGift }) {
  return (
    <li className={`${item.me ? 'is-me' : ''} ${item.rank <= 3 ? `is-top is-${item.rank}` : ''}`}>
      <strong>
        {item.rank <= 3 ? <Crown rank={item.rank} /> : null}
        {item.rank}
      </strong>
      <span>{item.username}</span>
      <em>
        {scoreMode ? `${item.score} 分` : `${item.totalStars} 星 · ${item.maxCleared} 关`}
        {onGift && !item.me ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onGift(item.username)}>
            送体力
          </button>
        ) : null}
        {onRemove && !item.me ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemove(item.username)}>
            移除
          </button>
        ) : null}
      </em>
    </li>
  )
}

export function RankPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('all')
  const [levelId, setLevelId] = useState(1)
  const [levelDraft, setLevelDraft] = useState('')
  const [friendName, setFriendName] = useState('')
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [mine, setMine] = useState(null)
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    let cancelled = false
    getLeaderboard({
      page,
      pageSize: PAGE_SIZE,
      scope: tab === 'friends' ? 'friends' : 'all',
      levelId: tab === 'level' ? levelId : undefined,
    })
      .then((data) => {
        if (cancelled) return
        setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]))
        setTotal(data.total)
        setMine(data.me)
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, tab, levelId, reload])

  function switchTab(next) {
    setTab(next)
    setPage(1)
    setItems([])
    setLoading(true)
    setError('')
    setNote('')
  }

  function lookUpLevel(event) {
    event.preventDefault()
    const text = levelDraft.trim()
    if (!text) {
      setLevelId(1)
      setPage(1)
      setItems([])
      setLoading(true)
      setError('')
      setReload((value) => value + 1)
      return
    }
    const next = Number(text)
    if (!Number.isInteger(next) || next < 1 || next > 1000) {
      setError('关卡号要在 1 到 1000 之间')
      return
    }
    setLevelId(next)
    setPage(1)
    setItems([])
    setLoading(true)
    setError('')
  }

  async function add(event) {
    event.preventDefault()
    setError('')
    try {
      await addFriend(friendName.trim())
      setFriendName('')
      setPage(1)
      setItems([])
      setLoading(true)
      setReload((value) => value + 1)
    } catch (err) {
      setError(err.message)
    }
  }

  async function gift(username) {
    setError('')
    setNote('')
    try {
      await giftStamina(username)
      setNote(`已送给 ${username} 1 点体力`)
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(username) {
    setError('')
    try {
      await removeFriend(username)
      setPage(1)
      setItems([])
      setLoading(true)
      setReload((value) => value + 1)
    } catch (err) {
      setError(err.message)
    }
  }

  const rest = Math.max(0, total - items.length)
  const showMine = mine && mine.rank && !items.some((item) => item.me)
  const scoreMode = tab === 'level'
  const hint = tab === 'friends' ? '只排你和加过的好友' : scoreMode ? `第 ${levelId} 关最高分` : '按累计星星，星星相同比通关数'

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>排行榜</h1>
        <p className="muted">{hint}</p>
      </div>
      <div className="actions">
        <button type="button" className={`btn btn-sm${tab === 'all' ? ' is-on' : ' btn-ghost'}`} onClick={() => switchTab('all')}>
          全服
        </button>
        <button type="button" className={`btn btn-sm${tab === 'friends' ? ' is-on' : ' btn-ghost'}`} onClick={() => switchTab('friends')}>
          好友
        </button>
        <button type="button" className={`btn btn-sm${tab === 'level' ? ' is-on' : ' btn-ghost'}`} onClick={() => switchTab('level')}>
          单关
        </button>
      </div>

      {tab === 'friends' ? (
        <form className="friend-add" onSubmit={add}>
          <input
            value={friendName}
            placeholder="对方的账号名或昵称"
            onChange={(event) => setFriendName(event.target.value)}
          />
          <button type="submit" className="btn btn-sm">
            加好友
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              const link = `${window.location.origin}/?invite=${user?.username ?? ''}`
              const text = `来开心消消乐加我好友：${link}`
              if (navigator.share) {
                try {
                  await navigator.share({ title: '开心消消乐', text, url: link })
                  return
                } catch (err) {
                  if (err?.name === 'AbortError') return
                }
              }
              try {
                await navigator.clipboard.writeText(text)
                setError('邀请链接已复制，发给微信好友打开就能加上')
              } catch {
                setError(text)
              }
            }}
          >
            邀请微信好友
          </button>
        </form>
      ) : null}

      {tab === 'level' ? (
        <form className="friend-add" onSubmit={lookUpLevel}>
          <input
            inputMode="numeric"
            value={levelDraft}
            onChange={(event) => setLevelDraft(event.target.value)}
          />
          <button type="submit" className="btn btn-sm">
            查看
          </button>
        </form>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
      {note ? <p className="muted">{note}</p> : null}
      {loading && !items.length ? <p className="muted">排行加载中…</p> : null}
      {!loading && !error && !items.length ? (
        <p className="muted">
          {tab === 'friends' ? (
            <>
              还没有好友。加好友后每天可以送 1 点体力，也可以去<Link to="/community">社区</Link>看看。
            </>
          ) : scoreMode ? (
            '这一关还没有成绩。'
          ) : (
            '还没有人上榜。'
          )}
        </p>
      ) : null}

      {items.length ? (
        <ol className="rank-list">
          {items.map((item) => (
            <RankRow
              key={`${item.rank}-${item.username}`}
              item={item}
              scoreMode={scoreMode}
              onRemove={tab === 'friends' ? remove : null}
              onGift={tab === 'friends' ? gift : null}
            />
          ))}
          {showMine ? (
            <>
              <li className="rank-gap" aria-hidden="true">
                ···
              </li>
              <RankRow item={mine} scoreMode={scoreMode} />
            </>
          ) : null}
        </ol>
      ) : null}

      {rest ? (
        <div className="pager">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={loading}
            onClick={() => {
              setLoading(true)
              setPage(page + 1)
            }}
          >
            {loading ? '加载中…' : `加载更多（还有 ${rest} 人）`}
          </button>
        </div>
      ) : null}
    </section>
  )
}
