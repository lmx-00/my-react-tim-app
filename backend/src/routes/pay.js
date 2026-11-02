import { Router } from 'express'
import { decryptWechatResource, verifyAlipayNotify } from '../services/payService.js'
import { settlePaidOrder } from '../services/walletService.js'

export const payRouter = Router()

payRouter.post('/alipay/notify', async (req, res) => {
  try {
    if (!verifyAlipayNotify(req.body ?? {})) {
      res.send('failure')
      return
    }
    const status = req.body.trade_status
    if (status === 'TRADE_SUCCESS' || status === 'TRADE_FINISHED') {
      const amountFen = Math.round(Number(req.body.total_amount) * 100)
      const ok = await settlePaidOrder(req.body.out_trade_no, amountFen)
      res.send(ok ? 'success' : 'failure')
      return
    }
    res.send('success')
  } catch (err) {
    console.error(err)
    res.send('failure')
  }
})

payRouter.post('/wechat/notify', async (req, res) => {
  try {
    const payment = decryptWechatResource(req.body?.resource ?? {})
    if (payment.trade_state === 'SUCCESS') {
      const ok = await settlePaidOrder(payment.out_trade_no, payment.amount?.total)
      if (!ok) {
        res.status(500).json({ code: 'FAIL', message: '订单不匹配' })
        return
      }
    }
    res.json({ code: 'SUCCESS', message: '成功' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 'FAIL', message: '解密失败' })
  }
})
