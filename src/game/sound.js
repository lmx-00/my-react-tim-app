const MUSIC_KEY = 'hm-music'
const SFX_KEY = 'hm-sfx'

// 后台开关是总闸。玩家只能在总闸打开时，再分开关音乐和音效。
let siteSound = false

function readPref(key) {
  try {
    const value = localStorage.getItem(key)
    if (value == null) return true
    return value === '1'
  } catch {
    return true
  }
}

function writePref(key, on) {
  try {
    localStorage.setItem(key, on ? '1' : '0')
  } catch {
    // 存不下就只在这次页面里生效
  }
}

export function playerAudio() {
  return { music: readPref(MUSIC_KEY), sfx: readPref(SFX_KEY), site: siteSound }
}

export function musicEnabled() {
  return siteSound && readPref(MUSIC_KEY)
}

export function sfxEnabled() {
  return siteSound && readPref(SFX_KEY)
}

export function soundEnabled() {
  return siteSound
}

const MELODY = [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 587.33]
const BEAT = 0.52

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
    if (!musicEnabled()) el.pause()
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
  if (!musicEnabled()) {
    stopBgm()
    return
  }
  const el = bgmElement()
  el.muted = false
  el.volume = 0.35
  el.play()
    .then(() => {
      // play() 落地要等几十毫秒，期间开关可能已经被关掉了
      if (!musicEnabled()) stopBgm()
    })
    .catch(() => {
      // 还没拿到用户手势，等下一次点击再试
    })
}

function sync() {
  if (musicEnabled()) startBgm()
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
    if (!musicEnabled()) return
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
      if (musicEnabled()) startBgm()
    }, false)
  }
}

bindGesture()
sync()

export function setSiteSound(enabled) {
  siteSound = enabled !== false
  sync()
}

export function setMusicEnabled(on) {
  writePref(MUSIC_KEY, on)
  sync()
}

export function setSfxEnabled(on) {
  writePref(SFX_KEY, on)
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
  if (!sfxEnabled()) return
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
