import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureBootstrap, resetLocalData } from '../src/db/database'
import { upsertProduct } from '../src/services/inventoryService'
import { upsertCustomer, upsertSupplier } from '../src/services/contactsService'
import { createAndReceivePurchase } from '../src/services/purchaseService'
import { closeCashSession, openCashSession, summarizeCash } from '../src/services/cashService'
import { completeSale, createPartialReturn, getSaleDetail } from '../src/services/salesService'
import { createIdempotencyKey } from '../src/domain/ids'

describe('ciclo comercial persistente', () => {
  beforeEach(async () => {
    await db.delete()
    db.open()
    await ensureBootstrap()
  })

  it('compra → venta → stock → caja → devolución sin duplicar', async () => {
    const supplier = await upsertSupplier({
      name: 'Proveedor Demo',
      email: '',
      phone: '',
      taxId: '',
      address: '',
      notes: '',
    })
    const customer = await upsertCustomer({
      name: 'Cliente Demo',
      email: '',
      phone: '',
      taxId: '',
      address: '',
      notes: '',
    })
    const product = await upsertProduct({
      name: 'Café 250g',
      sku: 'CAF-250',
      barcode: '8410000000001',
      description: '',
      category: 'Alimentación',
      brand: '',
      unit: 'ud',
      costCents: 200,
      priceCents: 499,
      taxPercent: 10,
      minStock: 2,
      supplierId: supplier.id,
      status: 'active',
      notes: '',
      stock: 0,
    })

    await createAndReceivePurchase({
      supplierId: supplier.id,
      lines: [{ productId: product.id, quantity: 10, unitCostCents: 200, taxPercent: 10 }],
      idempotencyKey: 'pur-1',
    })
    // reintento idempotente
    await createAndReceivePurchase({
      supplierId: supplier.id,
      lines: [{ productId: product.id, quantity: 10, unitCostCents: 200, taxPercent: 10 }],
      idempotencyKey: 'pur-1',
    })

    let fresh = await db.products.get(product.id)
    expect(fresh?.stock).toBe(10)

    const session = await openCashSession(10000)
    const saleKey = createIdempotencyKey()
    const first = await completeSale({
      customerId: customer.id,
      lines: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: 2,
          unitPriceCents: product.priceCents,
          taxPercent: product.taxPercent,
          discountPercent: 0,
          stockAvailable: 10,
        },
      ],
      payments: [{ method: 'cash', amountCents: 998, receivedCents: 1000 }],
      idempotencyKey: saleKey,
    })
    const second = await completeSale({
      customerId: customer.id,
      lines: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: 2,
          unitPriceCents: product.priceCents,
          taxPercent: product.taxPercent,
          discountPercent: 0,
          stockAvailable: 10,
        },
      ],
      payments: [{ method: 'cash', amountCents: 998, receivedCents: 1000 }],
      idempotencyKey: saleKey,
    })
    expect(second.sale.id).toBe(first.sale.id)
    expect(first.sale.changeCents).toBe(2)

    fresh = await db.products.get(product.id)
    expect(fresh?.stock).toBe(8)

    const summary = await summarizeCash(session.id)
    expect(summary.cashSalesCents).toBe(998)
    expect(summary.expectedCashCents).toBe(10000 + 998)

    const detail = await getSaleDetail(first.sale.id)
    await createPartialReturn({
      saleId: first.sale.id,
      reason: 'Prueba',
      restock: true,
      lines: [{ saleLineId: detail.lines[0].id, quantity: 1 }],
      idempotencyKey: 'ret-1',
    })
    fresh = await db.products.get(product.id)
    expect(fresh?.stock).toBe(9)

    await expect(
      createPartialReturn({
        saleId: first.sale.id,
        reason: 'Exceso',
        restock: true,
        lines: [{ saleLineId: detail.lines[0].id, quantity: 2 }],
        idempotencyKey: 'ret-over',
      }),
    ).rejects.toThrow(/máx/)

    const closed = await closeCashSession(session.id, 10900)
    expect(closed.session.status).toBe('closed')
    expect(closed.summary.refundsCents).toBeGreaterThan(0)
  })

  it('reset limpia comercio', async () => {
    await upsertProduct({
      name: 'X',
      sku: 'X1',
      barcode: '',
      description: '',
      category: 'G',
      brand: '',
      unit: 'ud',
      costCents: 0,
      priceCents: 100,
      taxPercent: 21,
      minStock: 0,
      supplierId: null,
      status: 'active',
      notes: '',
      stock: 1,
    })
    await resetLocalData()
    expect(await db.products.count()).toBe(0)
    expect(await db.warehouses.count()).toBe(1)
  })
})
