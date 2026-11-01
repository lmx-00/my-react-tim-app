import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

function markWechat() {
  const root = document.documentElement
  const ua = navigator.userAgent || ''
  if (/MicroMessenger/i.test(ua)) root.classList.add('in-wechat')
  if (window.__wxjs_environment === 'miniprogram') root.classList.add('in-miniprogram')
}

markWechat()
document.addEventListener('WeixinJSBridgeReady', markWechat, false)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
