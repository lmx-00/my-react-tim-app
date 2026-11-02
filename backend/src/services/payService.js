import crypto from 'crypto'
import { config } from '../config.js'
import { AppError } from '../lib/errors.js'

function pem(raw, kind) {
  const text = String(raw ?? '').trim()
  if (!text) return ''
  if (text.includes('BEGIN')) return text.replace(/\\n/g, '\n')
  const body = text.replace(/\s+/g, '').match(/.{1,64}/g).join('\n')
  return `-----BEGIN ${kind}-----\n${body}\n-----END ${kind}-----\n`
}

function signContent(params) {
  return Object.keys(params)
    .filter((key) => key !== 'sign' && key !== 'sign_type' && params[key] !== undefined && params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
}

export function paymentChannels() {
  const channels = []
  if (config.alipayAppId && config.alipayPrivateKey && config.alipayPublicKey && config.payNotifyBase) {
    channels.push('alipay')
  }
  if (
    config.wechatAppId
    && config.wechatMchId
    && config.wechatMchSerial
    && config.wechatMchPrivateKey
    && config.wechatApiV3Key
    && config.payNotifyBase
  ) {
    channels.push('wechat')
  }
  return channels
}

export function buildAlipayUrl(order) {
  const bizContent = JSON.stringify({
    out_trade_no: order.outTradeNo,
    total_amount: (order.amountFen / 100).toFixed(2),
    subject: `${order.diamonds}钻石`,
    product_code: 'QUICK_WAP_WAY',
  })
  const params = {
    app_id: config.alipayAppId,
    method: 'alipay.trade.wap.pay',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    version: '1.0',
    notify_url: `${config.payNotifyBase}/api/pay/alipay/notify`,
    return_url: `${config.clientOrigin}/shop`,
    biz_content: bizContent,
  }
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signContent(params), 'utf8')
  params.sign = signer.sign(pem(config.alipayPrivateKey, 'PRIVATE KEY'), 'base64')
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  return `https://openapi.alipay.com/gateway.do?${query}`
}

export function verifyAlipayNotify(params) {
  const sign = params.sign
  if (!sign || !config.alipayPublicKey) return false
  const verifier = crypto.createVerify('RSA-SHA256')
  verifier.update(signContent(params), 'utf8')
  return verifier.verify(pem(config.alipayPublicKey, 'PUBLIC KEY'), sign, 'base64')
}

function wechatAuth(method, path, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString('hex')
  const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(message)
  const signature = signer.sign(pem(config.wechatMchPrivateKey, 'PRIVATE KEY'), 'base64')
  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechatMchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${config.wechatMchSerial}",signature="${signature}"`
}

export async function buildWechatH5Url(order, clientIp) {
  const path = '/v3/pay/transactions/h5'
  const payload = {
    appid: config.wechatAppId,
    mchid: config.wechatMchId,
    description: `${order.diamonds}钻石`,
    out_trade_no: order.outTradeNo,
    notify_url: `${config.payNotifyBase}/api/pay/wechat/notify`,
    amount: { total: order.amountFen, currency: 'CNY' },
    scene_info: {
      payer_client_ip: clientIp || '127.0.0.1',
      h5_info: { type: 'Wap' },
    },
  }
  const body = JSON.stringify(payload)
  const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: wechatAuth('POST', path, body),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
  })
  const data = await response.json()
  if (!response.ok || !data.h5_url) {
    throw new AppError(502, 'WECHAT_PAY_FAILED', data.message || '微信收银台创建失败')
  }
  const redirect = encodeURIComponent(`${config.clientOrigin}/shop`)
  return `${data.h5_url}&redirect_url=${redirect}`
}

export function decryptWechatResource(resource) {
  const key = Buffer.from(config.wechatApiV3Key, 'utf8')
  const ciphertext = Buffer.from(resource.ciphertext, 'base64')
  const authTag = ciphertext.subarray(ciphertext.length - 16)
  const data = ciphertext.subarray(0, ciphertext.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(resource.nonce, 'utf8'))
  decipher.setAuthTag(authTag)
  if (resource.associated_data) decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'))
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'))
}
