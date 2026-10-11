import { db, getDefaultWarehouseId } from '../db/database'
import { createId, createIdempotencyKey } from '../domain/ids'
import type {
  CartLine,
  IssuedDocument,
  PaymentMethod,
  ReturnLine,
  ReturnRecord,
  Sale,
  SaleLine,
  SalePayment,
} from '../domain/commerce'
import { cartTotals, computeChange, lineTotalsFromCart } from '../lib/pricing'
import { applyStockChange } from './inventoryService'
import { addCashMovement, getOpenCashSession } from './cashService'

async function nextSaleNumber(): Promise<string> {
  const count = await db.sales.count()
  return `V-${String(count + 1).padStart(5, '0')}`
}

async function nextReturnNumber(): Promise<string> {
  const count = await db.returns.count()
  return `D-${String(count + 1).padStart(5, '0')}`
}

export interface CompleteSaleInput {
  lines: CartLine[]
  customerId?: string | null
  customerName?: string
  payments: Array<{ method: PaymentMethod; amountCents: number; receivedCents?: number }>
  note?: string
  idempotencyKey?: string
}

export async function completeSale(input: CompleteSaleInput): Promise<{
  sale: Sale
  document: IssuedDocument
}> {
  const key = input.idempotencyKey || createIdempotencyKey()
  const existing = await db.idempotency.get(key)
  if (existing) {
    const sale = await db.sales.get(existing.resultId)
    const document = await db.documents.where('saleId').equals(existing.resultId).first()
    if (sale && document) return { sale, document }
  }

  if (!input.lines.length) throw new Error('El carrito está vacío')
  for (const line of input.lines) {
    if (line.quantity <= 0) throw new Error('Cantidad inválida en el carrito')
    if (line.quantity > line.stockAvailable) {
      throw new Error(`Stock insuficiente para ${line.productName}`)
    }
  }

  const totals = cartTotals(input.lines)
  const paid = input.payments.reduce((sum, p) => sum + p.amountCents, 0)
  if (paid < totals.totalCents) throw new Error('El importe pagado es insuficiente')

  const cashPayment = input.payments.find((p) => p.method === 'cash')
  const received = cashPayment?.receivedCents ?? cashPayment?.amountCents ?? 0
  const changeCents = cashPayment ? computeChange(cashPayment.amountCents, received) : 0

  const warehouseId = await getDefaultWarehouseId()
  const cashSession = await getOpenCashSession()
  const now = new Date().toISOString()
  const saleId = createId('sale')
  const number = await nextSaleNumber()

  let customerName = input.customerName || 'Cliente general'
  if (input.customerId) {
    const customer = await db.customers.get(input.customerId)
    if (customer) customerName = customer.name
  }

  const sale: Sale = {
    id: saleId,
    number,
    status: 'completed',
    customerId: input.customerId ?? null,
    customerName,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    paidCents: paid,
    changeCents,
    cashSessionId: cashSession?.id ?? null,
    warehouseId,
    idempotencyKey: key,
    note: input.note || '',
    createdAt: now,
  }

  const saleLines: SaleLine[] = input.lines.map((line) => {
    const lt = lineTotalsFromCart(line)
    return {
      id: createId('sl'),
      saleId,
      productId: line.productId,
      productName: line.productName,
      sku: line.sku,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      discountPercent: line.discountPercent,
      taxPercent: line.taxPercent,
      lineBaseCents: lt.lineBaseCents,
      lineTaxCents: lt.lineTaxCents,
      lineTotalCents: lt.lineTotalCents,
    }
  })

  const payments: SalePayment[] = input.payments.map((p) => ({
    id: createId('pay'),
    saleId,
    method: p.method,
    amountCents: p.amountCents,
    receivedCents: p.method === 'cash' ? (p.receivedCents ?? p.amountCents) : p.amountCents,
    changeCents: p.method === 'cash' ? computeChange(p.amountCents, p.receivedCents ?? p.amountCents) : 0,
    confirmation: 'manual',
  }))

  const company = await db.companies.toCollection().first()
  const document: IssuedDocument = {
    id: createId('doc'),
    kind: 'ticket',
    number: `T-${number}`,
    saleId,
    cashSessionId: cashSession?.id ?? null,
    payloadJson: JSON.stringify({
      companyName: company?.tradeName || company?.name || 'Faro',
      taxId: company?.taxId || '',
      saleNumber: number,
      createdAt: now,
      customerName,
      lines: saleLines.map((l) => ({
        name: l.productName,
        qty: l.quantity,
        unit: l.unitPriceCents,
        total: l.lineTotalCents,
      })),
      subtotal: totals.subtotalCents,
      tax: totals.taxCents,
      total: totals.totalCents,
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amountCents,
        received: p.receivedCents,
        change: p.changeCents,
      })),
      disclaimer: 'Documento comercial interno. No constituye factura fiscal certificada.',
    }),
    createdAt: now,
  }

  await db.transaction(
    'rw',
    [
      db.sales,
      db.saleLines,
      db.salePayments,
      db.products,
      db.stockMovements,
      db.cashSessions,
      db.cashMovements,
      db.documents,
      db.idempotency,
    ],
    async () => {
      await db.sales.add(sale)
      await db.saleLines.bulkAdd(saleLines)
      await db.salePayments.bulkAdd(payments)
      await db.documents.add(document)

      for (const line of saleLines) {
        await applyStockChange({
          productId: line.productId,
          warehouseId,
          type: 'sale_out',
          quantity: line.quantity,
          reason: `Venta ${number}`,
          saleId,
          documentId: document.id,
          idempotencyKey: `${key}:stock:${line.productId}`,
        })
      }

      if (cashSession) {
        for (const payment of payments) {
          const type =
            payment.method === 'cash'
              ? 'sale_cash'
              : payment.method === 'card'
                ? 'sale_card'
                : 'sale_other'
          await addCashMovement({
            sessionId: cashSession.id,
            type,
            method: payment.method,
            amountCents: payment.amountCents,
            saleId,
            note: `Cobro venta ${number}`,
          })
        }
      }

      await db.idempotency.put({
        key,
        operation: 'complete_sale',
        resultId: sale.id,
        createdAt: now,
      })
    },
  )

  return { sale, document }
}

export async function listSales(): Promise<Sale[]> {
  return db.sales.orderBy('createdAt').reverse().toArray()
}

export async function getSaleDetail(saleId: string) {
  const sale = await db.sales.get(saleId)
  if (!sale) throw new Error('Venta no encontrada')
  const lines = await db.saleLines.where('saleId').equals(saleId).toArray()
  const payments = await db.salePayments.where('saleId').equals(saleId).toArray()
  const document = await db.documents.where('saleId').equals(saleId).first()
  return { sale, lines, payments, document }
}

export async function createPartialReturn(input: {
  saleId: string
  reason: string
  restock: boolean
  lines: Array<{ saleLineId: string; quantity: number }>
  idempotencyKey?: string
}): Promise<ReturnRecord> {
  const key = input.idempotencyKey || createIdempotencyKey()
  const existing = await db.idempotency.get(key)
  if (existing) {
    const ret = await db.returns.get(existing.resultId)
    if (ret) return ret
  }

  const detail = await getSaleDetail(input.saleId)
  if (!input.lines.length) throw new Error('Selecciona líneas a devolver')
  if (detail.sale.status === 'returned') {
    throw new Error('Esta venta ya está completamente devuelta')
  }

  const priorReturns = await db.returns.where('saleId').equals(input.saleId).toArray()
  const priorReturnIds = priorReturns.map((r) => r.id)
  const priorLines =
    priorReturnIds.length === 0
      ? []
      : (await db.returnLines.toArray()).filter((l) => priorReturnIds.includes(l.returnId))
  const alreadyBySaleLine = new Map<string, number>()
  for (const line of priorLines) {
    alreadyBySaleLine.set(line.saleLineId, (alreadyBySaleLine.get(line.saleLineId) || 0) + line.quantity)
  }

  let totalCents = 0
  const returnLines: ReturnLine[] = []
  for (const item of input.lines) {
    const saleLine = detail.lines.find((l) => l.id === item.saleLineId)
    if (!saleLine) throw new Error('Línea de venta no encontrada')
    const already = alreadyBySaleLine.get(saleLine.id) || 0
    const remaining = saleLine.quantity - already
    if (item.quantity <= 0 || item.quantity > remaining) {
      throw new Error(
        `Cantidad de devolución inválida para ${saleLine.productName} (máx. ${remaining})`,
      )
    }
    const unit = Math.round(saleLine.lineTotalCents / saleLine.quantity)
    const lineTotal = unit * item.quantity
    totalCents += lineTotal
    returnLines.push({
      id: createId('rl'),
      returnId: '',
      saleLineId: saleLine.id,
      productId: saleLine.productId,
      quantity: item.quantity,
      lineTotalCents: lineTotal,
    })
    alreadyBySaleLine.set(saleLine.id, already + item.quantity)
  }

  const cashSession = await getOpenCashSession()
  const now = new Date().toISOString()
  const returnId = createId('ret')
  const record: ReturnRecord = {
    id: returnId,
    saleId: input.saleId,
    number: await nextReturnNumber(),
    reason: input.reason,
    totalCents,
    restock: input.restock,
    cashSessionId: cashSession?.id ?? null,
    idempotencyKey: key,
    createdAt: now,
  }
  for (const line of returnLines) line.returnId = returnId

  const allReturned = detail.lines.every((saleLine) => {
    const returnedQty = alreadyBySaleLine.get(saleLine.id) || 0
    return returnedQty >= saleLine.quantity
  })

  await db.transaction(
    'rw',
    [
      db.returns,
      db.returnLines,
      db.sales,
      db.products,
      db.stockMovements,
      db.cashMovements,
      db.cashSessions,
      db.documents,
      db.idempotency,
    ],
    async () => {
      await db.returns.add(record)
      await db.returnLines.bulkAdd(returnLines)
      await db.sales.update(input.saleId, {
        status: allReturned ? 'returned' : 'partially_returned',
      })

      if (input.restock) {
        for (const line of returnLines) {
          await applyStockChange({
            productId: line.productId,
            warehouseId: detail.sale.warehouseId,
            type: 'return_in',
            quantity: line.quantity,
            reason: `Devolución ${record.number}`,
            saleId: input.saleId,
            idempotencyKey: `${key}:stock:${line.productId}`,
          })
        }
      }

      if (cashSession) {
        await addCashMovement({
          sessionId: cashSession.id,
          type: 'refund_cash',
          method: 'cash',
          amountCents: totalCents,
          saleId: input.saleId,
          note: `Devolución ${record.number}`,
        })
      }

      await db.documents.add({
        id: createId('doc'),
        kind: 'return_note',
        number: record.number,
        saleId: input.saleId,
        cashSessionId: cashSession?.id ?? null,
        payloadJson: JSON.stringify({
          returnNumber: record.number,
          saleNumber: detail.sale.number,
          reason: record.reason,
          total: totalCents,
          restock: input.restock,
          lines: returnLines,
          createdAt: now,
        }),
        createdAt: now,
      })

      await db.idempotency.put({
        key,
        operation: 'sale_return',
        resultId: record.id,
        createdAt: now,
      })
    },
  )

  return record
}

export async function salesReport(fromIso?: string, toIso?: string) {
  let sales = await db.sales.toArray()
  if (fromIso) sales = sales.filter((s) => s.createdAt >= fromIso)
  if (toIso) sales = sales.filter((s) => s.createdAt <= toIso)
  const completed = sales.filter((s) => s.status !== 'returned')
  const totalCents = completed.reduce((sum, s) => sum + s.totalCents, 0)
  const count = completed.length
  const byDay = new Map<string, number>()
  for (const sale of completed) {
    const day = sale.createdAt.slice(0, 10)
    byDay.set(day, (byDay.get(day) || 0) + sale.totalCents)
  }
  return {
    count,
    totalCents,
    averageCents: count ? Math.round(totalCents / count) : 0,
    byDay: [...byDay.entries()].map(([day, cents]) => ({ day, cents })),
  }
}
