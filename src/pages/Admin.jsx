import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { applyTheme } from '../game/theme.js'
import { getTheme, saveSettings } from '../api/game.js'
import { setSiteSound } from '../game/sound.js'

const THEMES = [
  { id: 'candy', name: '糖果', text: '粉色糖纸、棒棒糖和糖色藤蔓' },
  { id: 'forest', name: '森林', text: '蓝天、白云和绿色草地' },
]

export function AdminPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    theme: 'candy',
    sound: true,
    undo: true,
    hammer: 3,
    shuffle: 1,
    swap: 1,
  })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    getTheme()
      .then((data) => {
        setForm(data)
        applyTheme(data.theme)
        setSiteSound(data.sound)
      })
      .catch((err) => setError(err.message))
  }, [])

  function patch(next) {
    setForm((current) => ({ ...current, ...next }))
    setSaved('')
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    setSaved('')
    try {
      const data = await saveSettings(form)
      setForm(data)
      applyTheme(data.theme)
      setSiteSound(data.sound)
      setSaved('已保存。主题马上生效，道具数量从下一局开始。')
    } catch (err) {
      setError(err.message)
    }
  }

  if (user && user.role !== 'admin') {
    return (
      <section className="stack">
        <h1>后台设置</h1>
        <p className="muted">没有后台权限。管理员账号需要重新登录一次。</p>
      </section>
    )
  }

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>后台设置</h1>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {saved ? <p className="muted">{saved}</p> : null}
      <form className="form" onSubmit={save}>
        <fieldset className="setting-block">
          <legend>主题</legend>
          <div className="theme-choices">
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`theme-choice${form.theme === item.id ? ' is-on' : ''}`}
                onClick={() => patch({ theme: item.id })}
              >
                <strong>{item.name}</strong>
                <span>{item.text}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="setting-block">
          <legend>音效</legend>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.sound}
              onChange={(event) => patch({ sound: event.target.checked })}
            />
            打开后全站播放音效和背景音乐。保存后生效。
          </label>
        </fieldset>

        <fieldset className="setting-block">
          <legend>对局</legend>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.undo}
              onChange={(event) => patch({ undo: event.target.checked })}
            />
            允许后退上一步
          </label>
          <label>
            每局锤子次数
            <input
              type="number"
              min="0"
              max="9"
              value={form.hammer}
              onChange={(event) => patch({ hammer: Number(event.target.value) })}
            />
          </label>
          <label>
            每局洗牌次数
            <input
              type="number"
              min="0"
              max="9"
              value={form.shuffle}
              onChange={(event) => patch({ shuffle: Number(event.target.value) })}
            />
          </label>
          <label>
            每局交换次数
            <input
              type="number"
              min="0"
              max="9"
              value={form.swap ?? 1}
              onChange={(event) => patch({ swap: Number(event.target.value) })}
            />
          </label>
        </fieldset>

        <button type="submit" className="btn">
          保存设置
        </button>
      </form>
    </section>
  )
}
