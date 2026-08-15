import { Hono } from 'hono'
import { requireAuth, type AuthEnv } from '../../../../shared/infrastructure/middlewares/auth.js'
import { walletService } from '../../application/wallet.service.js'
import { purchaseCreditsUseCase } from '../../application/purchase-credits.usecase.js'
import { describeTransaction } from '../../domain/wallet-display.constants.js'

const walletRoutes = new Hono<AuthEnv>()

walletRoutes.use('*', requireAuth)

walletRoutes.get('/balance', async (c) => {
  const user = c.get('user')
  const balance = await walletService.getBalance(user.id)
  return c.json({ balance })
})

const VALID_TYPES = ['deposit', 'withdrawal', 'refund', 'adjustment', 'migration', 'service_payment']
const VALID_SORT_FIELDS = ['created_at', 'amount']

walletRoutes.get('/history', async (c) => {
  const user = c.get('user')
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') ?? 20)))
  const offset = (page - 1) * limit

  const typeParam = c.req.query('type')
  const type = typeParam && VALID_TYPES.includes(typeParam) ? typeParam : undefined

  const sortByParam = c.req.query('sortBy')
  const sortBy = sortByParam && VALID_SORT_FIELDS.includes(sortByParam) ? sortByParam : 'created_at'

  const sortOrder = c.req.query('sortOrder') === 'asc' ? 'asc' : 'desc'

  const { transactions, total } = await walletService.getHistory(user.id, limit, offset, { type, sortBy, sortOrder })
  const enriched = transactions.map((tx) => ({
    ...tx,
    source_description: describeTransaction(tx.source_type, tx.amount),
  }))
  return c.json({ transactions: enriched, total, page, limit })
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

walletRoutes.post('/topups', (c) =>
  c.json(
    {
      error: 'GONE',
      message: 'Tạo mã nạp tiền tại POST /api/deposits',
    },
    410,
  ),
)

export { walletRoutes }
