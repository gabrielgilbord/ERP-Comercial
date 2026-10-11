import { db } from '../db/database'
import { createId } from '../domain/ids'
import type { CashMovement, CashSession, PaymentMethod } from '../domain/commerce'

export async function getOpenCashSession(): Promise<CashSession | undefined> {
  return db.cashSessions.filter((s) => s.status === 'open').first()
}

export async function openCashSession(openingCents: number, note = ''): Promise<CashSession> {
  const existing = await getOpenCashSession()
  if (existing) throw new Error('Ya hay una caja abierta')

  const session: CashSession = {
    id: createId('cash'),
    status: 'open',
    openingCents,
    openedAt: new Date().toISOString(),
    closedAt: null,
    countedCents: null,
    expectedCashCents: null,
    differenceCents: null,
    note,
  }

  await db.transaction('rw', db.cashSessions, db.cashMovements, async () => {
    await db.cashSessions.add(session)
    await db.cashMovements.add({
      id: createId('cm'),
      sessionId: session.id,
      type: 'opening',
      method: 'cash',
      amountCents: openingCents,
      saleId: null,
      note: 'Apertura de caja',
      createdAt: session.openedAt,
    })
  })

  return session
}

export async function addCashMovement(input: {
  sessionId: string
  type: CashMovement['type']
  method: PaymentMethod
  amountCents: number
  saleId?: string | null
  note?: string
}): Promise<CashMovement> {
  const session = await db.cashSessions.get(input.sessionId)
  if (!session || session.status !== 'open') throw new Error('La caja no está abierta')

  const movement: CashMovement = {
    id: createId('cm'),
    sessionId: input.sessionId,
    type: input.type,
    method: input.method,
    amountCents: input.amountCents,
    saleId: input.saleId ?? null,
    note: input.note || '',
    createdAt: new Date().toISOString(),
  }
  await db.cashMovements.add(movement)
  return movement
}

export async function summarizeCash(sessionId: string) {
  const movements = await db.cashMovements.where('sessionId').equals(sessionId).toArray()
  const session = await db.cashSessions.get(sessionId)
  if (!session) throw new Error('Sesión de caja no encontrada')

  let cashIn = 0
  let cashOut = 0
  let card = 0
  let other = 0
  let refunds = 0

  for (const m of movements) {
    if (m.type === 'opening') continue
    if (m.type === 'sale_cash' || m.type === 'cash_in') cashIn += m.amountCents
    if (m.type === 'cash_out') cashOut += m.amountCents
    if (m.type === 'refund_cash') refunds += m.amountCents
    if (m.type === 'sale_card') card += m.amountCents
    if (m.type === 'sale_other') other += m.amountCents
  }

  const expectedCash = session.openingCents + cashIn - cashOut - refunds
  return {
    session,
    movements,
    openingCents: session.openingCents,
    cashSalesCents: cashIn,
    cardSalesCents: card,
    otherSalesCents: other,
    cashOutCents: cashOut,
    refundsCents: refunds,
    expectedCashCents: expectedCash,
  }
}

export async function closeCashSession(sessionId: string, countedCents: number, note = '') {
  const summary = await summarizeCash(sessionId)
  if (summary.session.status !== 'open') throw new Error('La caja ya está cerrada')

  const closed: CashSession = {
    ...summary.session,
    status: 'closed',
    closedAt: new Date().toISOString(),
    countedCents,
    expectedCashCents: summary.expectedCashCents,
    differenceCents: countedCents - summary.expectedCashCents,
    note: note || summary.session.note,
  }
  await db.cashSessions.put(closed)
  return { session: closed, summary }
}

export async function listCashSessions(): Promise<CashSession[]> {
  return db.cashSessions.orderBy('openedAt').reverse().toArray()
}
