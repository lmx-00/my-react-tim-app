const STORE_KEY = 'hm-sound'
const MELODY = [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 587.33]
const BEAT = 0.52

// siteSound 是后台的全局开关，personal 是玩家自己在「我的」里的选择，后者优先。
// 默认关闭：后台设置拉回来之前先当作静音，免得刚进页面就去撞浏览器的自动播放拦截。
let siteSound = false
let personal = readPersonal()

function readPersonal() {
  try {
    return localStorage.getItem(STORE_KEY)
  } catch {
    // 隐私模式下读不到，按跟随后台处理
    return null
  }
}

export function personalSound() {
  return personal
}

export function soundEnabled() {
  if (personal === '0') return false
  if (personal === '1') return true
  return siteSound
}

function makeWav() {
  const rate = 22050
  const samples = Math.floor(rate * MELODY.length * BEAT)
  const data = new Float32Array(samples)
  MELODY.forEach((freq, index) => {
    const start = Math.floor(index * BEAT * rate)
    const end = Math.min(samples, Math.floor((index + 0.9) * BEAT * rate))
    for (let sample = start; sample < end; sample += 1) {
      const time = (sample - start) / rate
      const envelope = Math.min(1, time / 0.04) * Math.exp(-time * 1.8)
      data[sample] += Math.sin(2 * Math.PI * freq * time) * envelope * 0.2
    }
  })
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)
  const write = (offset, text) => {
    for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + samples * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, samples * 2, true)
  let offset = 44
  for (let index = 0; index < samples; index += 1) {
    const sample = Math.max(-1, Math.min(1, data[index]))
    view.setInt16(offset, sample * 0x7fff, true)
    offset += 2
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

// 挂在 window 上是为了让 Vite 热更新后仍然复用同一个元素，不会越攒越多
function bgmElement() {
  const cached = window.__hmBgmEl
  if (cached?.isConnected) return cached
  const el = document.createElement('audio')
  el.loop = true
  el.preload = 'auto'
  el.setAttribute('playsinline', '')
  el.setAttribute('webkit-playsinline', '')
  el.dataset.hmBgm = '1'
  el.src = URL.createObjectURL(makeWav())
  // 兜底：不管是谁把它放出来的，只要开关是关的就立刻按回去
  el.addEventListener('play', () => {
    if (!soundEnabled()) el.pause()
  })
  document.body.appendChild(el)
  window.__hmBgmEl = el
  return el
}

function stopBgm() {
  document.querySelectorAll('audio[data-hm-bgm]').forEach((el) => {
    el.pause()
    el.currentTime = 0
  })
}

function startBgm() {
  if (!soundEnabled()) {
    stopBgm()
    return
  }
  const el = bgmElement()
  el.muted = false
  el.volume = 0.35
  el.play()
    .then(() => {
      // play() 落地要等几十毫秒，期间开关可能已经被关掉了
      if (!soundEnabled()) stopBgm()
    })
    .catch(() => {
      // 还没拿到用户手势，等下一次点击再试
    })
}

function sync() {
  if (soundEnabled()) startBgm()
  else stopBgm()
}

// 刷新后浏览器经常拦住自动播放。pointerdown / touchstart 才算用户手势，
// 点开关时不在这里播放，免得同一次点击把刚关掉的音乐又放出来。
function bindGesture() {
  const previous = window.__hmOnGesture
  if (previous) {
    window.removeEventListener('pointerdown', previous, true)
    window.removeEventListener('touchstart', previous, true)
    window.removeEventListener('click', previous, false)
    window.removeEventListener('keyup', previous, false)
  }
  const onGesture = (event) => {
    const target = event.target
    if (target instanceof Element && target.closest('.account-row')) return
    if (!soundEnabled()) return
    startBgm()
  }
  window.__hmOnGesture = onGesture
  window.addEventListener('pointerdown', onGesture, true)
  window.addEventListener('touchstart', onGesture, true)
  window.addEventListener('click', onGesture, false)
  window.addEventListener('keyup', onGesture, false)
  if (!window.__hmWeixin) {
    window.__hmWeixin = true
    document.addEventListener('WeixinJSBridgeReady', () => {
      if (soundEnabled()) startBgm()
    }, false)
  }
}

bindGesture()
sync()

export function setSiteSound(enabled) {
  siteSound = enabled !== false
  sync()
}

export function setPersonalSound(value) {
  personal = value == null ? null : value ? '1' : '0'
  try {
    if (personal == null) localStorage.removeItem(STORE_KEY)
    else localStorage.setItem(STORE_KEY, personal)
  } catch {
    // 写不进去也认，至少这次会话内是对的
  }
  sync()
}

// 音效共用一个 AudioContext，Chrome 单页最多只给 6 个，一次一个很快就抛错
function context() {
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  let current = window.__hmCtx
  if (!current || current.state === 'closed') {
    try {
      current = new Ctor()
    } catch {
      return null
    }
    window.__hmCtx = current
  }
  if (current.state === 'suspended') current.resume().catch(() => {})
  return current
}

export function playSound(kind) {
  if (!soundEnabled()) return
  const current = context()
  if (!current) return
  const notes = { swap: [523], pop: [659, 784], fail: [196], win: [523, 659, 784], tool: [440, 554] }
  const steps = notes[kind] ?? notes.swap
  steps.forEach((freq, index) => {
    const osc = current.createOscillator()
    const gain = current.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(current.destination)
    const start = current.currentTime + index * 0.08
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.05, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
    osc.start(start)
    osc.stop(start + 0.17)
    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
    }
  })
}
