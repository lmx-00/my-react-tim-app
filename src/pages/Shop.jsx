import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { buyShopItem, createRecharge, getShop, notifyWallet, payRecharge } from '../api/game.js'

const CURRENCY = { coins: '金币', diamonds: '钻石', free: '' }

function yuan(amountFen) {
  return `¥${(amountFen / 100).toFixed(amountFen % 100 === 0 ? 0 : 2)}`
}

export function ShopPage() {
  const location = useLocation()
  const [items, setItems] = useState([])
  const [recharge, setRecharge] = useState([])
  const [channels, setChannels] = useState([])
  const [wallet, setWallet] = useState(null)
  const [error, setError] = useState('')
  const [cashier, setCashier] = useState(null)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    let cancelled = false
    getShop()
      .then((data) => {
        if (cancelled) return
        setItems(data.items)
        setRecharge(data.recharge ?? [])
        setChannels(data.channels ?? [])
        setWallet(data.wallet)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) return
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [location.hash, items.length])

  async function buy(id) {
    setError('')
    try {
      const data = await buyShopItem(id)
      setItems(data.items)
      setRecharge(data.recharge ?? [])
      setChannels(data.channels ?? [])
      setWallet(data.wallet)
      notifyWallet()
    } catch (err) {
      setError(err.message)
    }
  }

  async function confirmPay(channel) {
    if (!cashier) return
    setError('')
    setPaying(true)
    try {
      const order = await createRecharge(cashier.id)
      const data = await payRecharge(order.id, channel)
      window.location.assign(data.payUrl)
    } catch (err) {
      setError(err.message)
      setPaying(false)
    }
  }

  const packs = items.filter((item) => item.pack)
  const tools = items.filter((item) => item.reward?.tools)
  const rest = items.filter((item) => !item.pack && !item.reward?.tools)

  return (
    <section className="stack">
      <div className="stack-head">
        <h1>商店</h1>
        <p className="muted">
          体力 {wallet ? `${wallet.stamina}/${wallet.staminaMax}` : '—'} · 金币 {wallet?.coins ?? '—'} · 钻石 {wallet?.diamonds ?? '—'}
        </p>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <h2 id="packs">礼包</h2>
      <div className="shop-list">
        {packs.map((item) => (
          <ShopRow key={item.id} item={item} onBuy={buy} />
        ))}
      </div>
      <h2 id="tools">道具</h2>
      <div className="shop-list">
        {tools.map((item) => (
          <ShopRow key={item.id} item={item} onBuy={buy} />
        ))}
      </div>
      <h2 id="supply">补给和钻石</h2>
      <div className="shop-list">
        {rest.map((item) => (
          <ShopRow key={item.id} item={item} onBuy={buy} />
        ))}
      </div>
      {channels.length ? (
        <>
          <h2>钻石充值</h2>
          <p className="muted">1 元 = 10 颗钻石。点进去会拉起收银台。</p>
          <div className="shop-list">
            {recharge.map((item) => (
              <article key={item.id} className="shop-row">
                <div>
                  <strong>{item.name}</strong>
                  <p className="muted">{yuan(item.amountFen)}</p>
                </div>
                <button type="button" className="btn btn-sm" onClick={() => setCashier(item)}>
                  充值
                </button>
              </article>
            ))}
          </div>
        </>
      ) : null}
      {cashier ? (
        <div className="cashier-mask" role="presentation" onClick={() => (paying ? null : setCashier(null))}>
          <section className="cashier" role="dialog" aria-label="收银台" onClick={(event) => event.stopPropagation()}>
            <h2>收银台</h2>
            <p>{cashier.name}</p>
            <p className="cashier-price">{yuan(cashier.amountFen)}</p>
            <p className="muted">
              {channels.length
                ? '将跳转到支付宝或微信收银台。支付成功后钻石到账。'
                : '服务端还没配置支付宝或微信商户，暂时不能付款。'}
            </p>
            <div className="actions">
              {channels.includes('alipay') ? (
                <button type="button" className="btn" disabled={paying} onClick={() => confirmPay('alipay')}>
                  {paying ? '跳转中…' : '支付宝支付'}
                </button>
              ) : null}
              {channels.includes('wechat') ? (
                <button type="button" className="btn" disabled={paying} onClick={() => confirmPay('wechat')}>
                  {paying ? '跳转中…' : '微信支付'}
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost" disabled={paying} onClick={() => setCashier(null)}>
                取消
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

function ShopRow({ item, onBuy }) {
  const price = item.currency === 'free' ? '免费领取' : `${item.price} ${CURRENCY[item.currency]}`
  return (
    <article className="shop-row">
      <div>
        <strong>{item.name}</strong>
        <p className="muted">{item.text}</p>
      </div>
      <button type="button" className="btn btn-sm" disabled={item.claimed} onClick={() => onBuy(item.id)}>
        {item.claimed ? '已领取' : price}
      </button>
    </article>
  )
}
