import { Hono } from 'hono'
import { requireAuth, type AuthEnv } from '../../../../shared/infrastructure/middlewares/auth.js'
import { walletService } from '../../application/wallet.service.js'
import { purchaseCreditsUseCase } from '../../application/purchase-credits.usecase.js'
import { createTopupUseCase } from '../../application/wallet-topup.usecase.js'

const walletRoutes = new Hono<AuthEnv>()

walletRoutes.use('*', requireAuth)

walletRoutes.get('/balance', async (c) => {
  const user = c.get('user')
  const balance = await walletService.getBalance(user.id)
  return c.json({ balance })
})

walletRoutes.get('/history', async (c) => {
  const user = c.get('user')
  const limit = Number(c.req.query('limit') ?? 20)
  const offset = Number(c.req.query('offset') ?? 0)
  const transactions = await walletService.getHistory(user.id, limit, offset)
  return c.json({ transactions })
})

walletRoutes.post('/purchase-credits', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const { packageId, caseId, quantity } = body as { packageId: string; caseId: string; quantity: number }

  if (!packageId || !caseId || !quantity || quantity < 1) {
    return c.json({ code: 'VALIDATION_ERROR', message: 'packageId, caseId, quantity >= 1 là bắt buộc' }, 400)
  }

  const result = await purchaseCreditsUseCase(user.id, packageId, caseId, quantity)
  return c.json(result)
})

walletRoutes.post('/topups', async (c) => {
  const user = c.get('user')
  const { amount } = await c.req.json()

  if (!amount || amount < 10000) {
    return c.json({ code: 'VALIDATION_ERROR', message: 'Số tiền tối thiểu 10,000 VND' }, 400)
  }

  const result = await createTopupUseCase(user.id, amount)
  return c.json(result, 201)
})

export { walletRoutes }
