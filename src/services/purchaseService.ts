import { db, getDefaultWarehouseId } from '../db/database'
import { createId, createIdempotencyKey } from '../domain/ids'
import type { Purchase, PurchaseLine } from '../domain/commerce'
import { applyStockChange } from './inventoryService'

async function nextPurchaseNumber(): Promise<string> {
  const count = await db.purchases.count()
  return `C-${String(count + 1).padStart(5, '0')}`
}

export async function createAndReceivePurchase(input: {
  supplierId: string
  lines: Array<{ productId: string; quantity: number; unitCostCents: number; taxPercent: number }>
  note?: string
  idempotencyKey?: string
}): Promise<Purchase> {
  const key = input.idempotencyKey || createIdempotencyKey()
  const existing = await db.idempotency.get(key)
  if (existing) {
    const purchase = await db.purchases.get(existing.resultId)
    if (purchase) return purchase
  }

  if (!input.lines.length) throw new Error('La compra necesita al menos una línea')

  const supplier = await db.suppliers.get(input.supplierId)
  if (!supplier) throw new Error('Proveedor no encontrado')

  const warehouseId = await getDefaultWarehouseId()
  const now = new Date().toISOString()
  const purchaseId = createId('pur')
  const purchaseLines: PurchaseLine[] = []
  let totalCents = 0

  for (const line of input.lines) {
    const product = await db.products.get(line.productId)
    if (!product) throw new Error('Producto de compra no encontrado')
    if (line.quantity <= 0) throw new Error('Cantidad inválida')
    const lineTotal = Math.round(line.unitCostCents * line.quantity * (1 + line.taxPercent / 100))
    totalCents += lineTotal
    purchaseLines.push({
      id: createId('pl'),
      purchaseId,
      productId: product.id,
      productName: product.name,
      quantityOrdered: line.quantity,
      quantityReceived: line.quantity,
      unitCostCents: line.unitCostCents,
      taxPercent: line.taxPercent,
    })
  }

  const purchase: Purchase = {
    id: purchaseId,
    number: await nextPurchaseNumber(),
    supplierId: supplier.id,
    supplierName: supplier.name,
    status: 'received',
    warehouseId,
    totalCents,
    note: input.note || '',
    idempotencyKey: key,
    createdAt: now,
    receivedAt: now,
  }

  await db.transaction(
    'rw',
    db.purchases,
    db.purchaseLines,
    db.products,
    db.stockMovements,
    db.idempotency,
    async () => {
      await db.purchases.add(purchase)
      await db.purchaseLines.bulkAdd(purchaseLines)
      for (const line of purchaseLines) {
        await applyStockChange({
          productId: line.productId,
          warehouseId,
          type: 'purchase_in',
          quantity: line.quantityReceived,
          reason: `Recepción compra ${purchase.number}`,
          purchaseId: purchase.id,
          idempotencyKey: `${key}:${line.productId}`,
        })
        await db.products.update(line.productId, {
          costCents: line.unitCostCents,
          supplierId: supplier.id,
          updatedAt: now,
        })
      }
      await db.idempotency.put({
        key,
        operation: 'purchase_receive',
        resultId: purchase.id,
        createdAt: now,
      })
    },
  )

  return purchase
}

export async function listPurchases(): Promise<Purchase[]> {
  return db.purchases.orderBy('createdAt').reverse().toArray()
}
