import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  likePost,
  listComments,
  listPosts,
  uploadPhoto,
} from '../api/game.js'
import { Stars } from '../components/Stars.jsx'

const PAGE_SIZE = 12
const CANDY = ['#fb7185', '#c4b5fd', '#5eead4', '#67e8f9', '#93c5fd', '#f9a8d4', '#fde68a']

function timeAgo(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const delta = Date.now() - date.getTime()
  if (delta < 60 * 1000) return '刚刚'
  if (delta < 60 * 60 * 1000) return `${Math.floor(delta / 60000)} 分钟前`
  if (delta < 24 * 60 * 60 * 1000) return `${Math.floor(delta / 3600000)} 小时前`
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

function candyColor(name) {
  const text = name || '?'
  let n = 2166136261
  for (let i = 0; i < text.length; i += 1) n = Math.imul(n ^ text.charCodeAt(i), 16777619)
  return CANDY[Math.abs(n) % CANDY.length]
}

function Face({ author }) {
  const name = author?.name || '?'
  if (author?.avatarUrl) return <img className="post-avatar" src={author.avatarUrl} alt="" />
  return (
    <span className="post-avatar is-letter" style={{ '--candy': candyColor(name) }} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21.3 10.4 19.9C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.4 11.4L12 21.3z" />
    </svg>
  )
}

function BubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-6.2L7 21.6V18H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 4h6l1.2 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.8L9 4zm3 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
      />
    </svg>
  )
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      reject(new Error('请选 jpg、png 或 webp'))
      return
    }
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const max = 1280
      const scale = Math.min(1, max / Math.max(image.width, image.height))
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(image, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('这张图打不开，换 jpg 或 png'))
            return
          }
          if (blob.size > 1.4 * 1024 * 1024) {
            reject(new Error('照片太大了，换一张小一点的'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.82,
      )
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('这张图打不开，换 jpg 或 png'))
    }
    image.src = url
  })
}

function PostCard({ item, onLike, onDelete, onCommented }) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [big, setBig] = useState(false)

  async function showComments() {
    const next = !open
    setOpen(next)
    setError('')
    if (!next || comments.length) return
    try {
      const data = await listComments(item.id)
      setComments(data.items ?? [])
    } catch (err) {
      setError(err.message)
    }
  }

  async function send(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || busy) return
    setBusy(true)
    setError('')
    try {
      const comment = await createComment(item.id, text)
      setComments((current) => [...current, comment])
      setDraft('')
      onCommented(item.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeComment(id) {
    try {
      await deleteComment(id)
      setComments((current) => current.filter((row) => row.id !== id))
      onCommented(item.id, -1)
    } catch (err) {
      setError(err.message)
    }
  }

  const scored = item.score != null
  const chipClass = `post-chip${item.result === 'won' ? ' is-win' : ''}`

  return (
    <article className="post-card">
      <header className="post-head">
        <Face author={item.author} />
        <div className="post-who">
          <strong>{item.author?.name}</strong>
          <time dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
        </div>
        {item.mine ? (
          <button type="button" className="post-del" onClick={() => onDelete(item.id)} aria-label="删除">
            删除
          </button>
        ) : null}
      </header>
      {item.body ? <p className="post-body">{item.body}</p> : null}
      {item.imageUrl ? (
        <button type="button" className="post-photo" onClick={() => setBig(true)}>
          <img src={item.imageUrl} alt="" />
        </button>
      ) : null}
      {big && item.imageUrl ? (
        <div className="cashier-mask" role="presentation" onClick={() => setBig(false)}>
          <img className="post-photo-big" src={item.imageUrl} alt="" />
        </div>
      ) : null}
      {item.levelName ? (
        scored && !item.imageUrl ? (
          <Link className={`${chipClass} is-score`} to={`/load/${item.levelId}`}>
            <span>{item.levelName}</span>
            <strong>
              {item.score}
              <small>分</small>
            </strong>
            {item.stars ? <Stars value={item.stars} /> : null}
          </Link>
        ) : (
          <Link className={chipClass} to={`/load/${item.levelId}`}>
            {item.levelName}
          </Link>
        )
      ) : null}
      <div className="post-actions">
        <button
          type="button"
          className={`post-react${item.liked ? ' is-on' : ''}`}
          aria-label={item.liked ? `已赞 ${item.likeCount}` : `赞 ${item.likeCount}`}
          onClick={() => onLike(item.id)}
        >
          <HeartIcon />
          {item.likeCount}
        </button>
        <button
          type="button"
          className={`post-react${open ? ' is-open' : ''}`}
          aria-label={`评论 ${item.commentCount}`}
          onClick={showComments}
        >
          <BubbleIcon />
          {item.commentCount}
        </button>
      </div>
      {open ? (
        <div className="post-comments">
          {error ? <p className="form-error">{error}</p> : null}
          {comments.length ? (
            <ul>
              {comments.map((row) => (
                <li key={row.id}>
                  <Face author={row.author} />
                  <div>
                    <strong>{row.author?.name}</strong>
                    <p>{row.body}</p>
                  </div>
                  {row.mine ? (
                    <button type="button" className="post-del" onClick={() => removeComment(row.id)} aria-label="删除评论">
                      删除
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">还没有评论，来占第一条。</p>
          )}
          <form className="comment-add" onSubmit={send}>
            <input
              value={draft}
              maxLength={80}
              placeholder="说一句"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className="btn btn-sm" disabled={busy || !draft.trim()}>
              发送
            </button>
          </form>
        </div>
      ) : null}
    </article>
  )
}

export function CommunityPage() {
  const [tab, setTab] = useState('all')
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [body, setBody] = useState('')
  const [levelDraft, setLevelDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    listPosts({ page, pageSize: PAGE_SIZE, scope: tab })
      .then((data) => {
        if (cancelled) return
        setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]))
        setTotal(data.total)
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
  }, [page, tab])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function switchTab(next) {
    setTab(next)
    setPage(1)
    setItems([])
    setLoading(true)
    setError('')
    setNote('')
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview)
    setPhoto(null)
    setPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function pickPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function publish(event) {
    event.preventDefault()
    const text = body.trim()
    if ((!text && !photo) || posting) return
    setPosting(true)
    setError('')
    setNote('')
    try {
      const payload = {}
      if (text) payload.body = text
      const level = Number(levelDraft.trim())
      if (levelDraft.trim() && Number.isInteger(level)) payload.levelId = level
      if (photo) {
        const blob = await compressImage(photo)
        payload.imageUrl = (await uploadPhoto(blob)).url
      }
      const post = await createPost(payload)
      setBody('')
      setLevelDraft('')
      clearPhoto()
      setItems((current) => [post, ...current.filter((item) => item.id !== post.id)])
      setTotal((value) => value + 1)
      setNote('已发到广场')
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  async function toggleLike(id) {
    try {
      const updated = await likePost(id)
      setItems((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(id) {
    try {
      await deletePost(id)
      setItems((current) => current.filter((item) => item.id !== id))
      setTotal((value) => Math.max(0, value - 1))
    } catch (err) {
      setError(err.message)
    }
  }

  function commented(id, delta = 1) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, commentCount: Math.max(0, item.commentCount + delta) } : item,
      ),
    )
  }

  const rest = Math.max(0, total - items.length)
  const hint = tab === 'friends' ? '只看你和好友' : tab === 'me' ? '只看自己发的' : '大家刚发的都在这里'

  return (
    <section className="stack community-page">
      <div className="community-hero">
        <h1>社区</h1>
        <p className="muted">{hint}</p>
      </div>

      <form className="community-compose" onSubmit={publish}>
        <span className="compose-candy" aria-hidden="true" />
        <textarea
          value={body}
          maxLength={140}
          rows={3}
          placeholder="过关心得、卡关求助，也可以配张照片"
          onChange={(event) => setBody(event.target.value)}
        />
        {preview ? (
          <div className="compose-preview">
            <img src={preview} alt="" />
            <button type="button" className="post-del" onClick={clearPhoto}>
              去掉
            </button>
          </div>
        ) : null}
        <div className="compose-bar">
          <label className="compose-level">
            第
            <input
              inputMode="numeric"
              value={levelDraft}
              placeholder="几"
              aria-label="关卡号，可不填"
              onChange={(event) => setLevelDraft(event.target.value)}
            />
            关
          </label>
          <label className="compose-photo">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              onChange={pickPhoto}
            />
            <CameraIcon />
            {photo ? '已选' : '照片'}
          </label>
          <span className="compose-count">{body.length}/140</span>
          <button type="submit" className="btn btn-sm" disabled={posting || (!body.trim() && !photo)}>
            {posting ? '发布中…' : '发布'}
          </button>
        </div>
      </form>

      <div className="community-tabs" role="tablist">
        <button type="button" className={tab === 'all' ? 'is-on' : ''} onClick={() => switchTab('all')}>
          广场
        </button>
        <button type="button" className={tab === 'friends' ? 'is-on' : ''} onClick={() => switchTab('friends')}>
          好友
        </button>
        <button type="button" className={tab === 'me' ? 'is-on' : ''} onClick={() => switchTab('me')}>
          我的
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {note ? <p className="community-note">{note}</p> : null}
      {loading && !items.length ? <p className="muted">动态加载中…</p> : null}
      {!loading && !items.length ? (
        <div className="community-empty">
          <span className="community-empty-face" aria-hidden="true">
            ?
          </span>
          <p>
            {tab === 'friends' ? (
              <>
                还没有好友动态。<Link to="/rank">去加好友</Link>
              </>
            ) : tab === 'me' ? (
              '你还没发过。上面写一句或加张照片就能发。'
            ) : (
              '还没有人说话。来做第一条。'
            )}
          </p>
        </div>
      ) : null}

      <div className="community-list">
        {items.map((item) => (
          <PostCard key={item.id} item={item} onLike={toggleLike} onDelete={remove} onCommented={commented} />
        ))}
      </div>

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
            {loading ? '加载中…' : `再看 ${rest} 条`}
          </button>
        </div>
      ) : null}
    </section>
  )
}
