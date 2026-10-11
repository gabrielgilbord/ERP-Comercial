import { describe, expect, it } from 'vitest'
import { cartTotals, computeChange, lineTotalsFromCart } from '../src/lib/pricing'
import type { CartLine } from '../src/domain/commerce'

const line = (overrides: Partial<CartLine> = {}): CartLine => ({
  productId: '1',
  productName: 'Test',
  sku: 'T',
  barcode: '',
  quantity: 2,
  unitPriceCents: 1210,
  taxPercent: 21,
  discountPercent: 0,
  stockAvailable: 10,
  ...overrides,
})

describe('pricing', () => {
  it('desglosa IVA incluido', () => {
    const totals = lineTotalsFromCart(line({ quantity: 1, unitPriceCents: 1210 }))
    expect(totals.lineTotalCents).toBe(1210)
    expect(totals.lineBaseCents).toBe(1000)
    expect(totals.lineTaxCents).toBe(210)
  })

  it('aplica descuento porcentual al total', () => {
    const totals = lineTotalsFromCart(line({ quantity: 1, unitPriceCents: 1000, discountPercent: 10, taxPercent: 0 }))
    expect(totals.lineTotalCents).toBe(900)
  })

  it('suma el carrito', () => {
    const totals = cartTotals([line({ quantity: 1, unitPriceCents: 1210 }), line({ quantity: 1, unitPriceCents: 2420 })])
    expect(totals.totalCents).toBe(3630)
  })

  it('calcula cambio', () => {
    expect(computeChange(1250, 2000)).toBe(750)
    expect(computeChange(1250, 1000)).toBe(0)
  })
})
