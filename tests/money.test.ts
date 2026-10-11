import { describe, expect, it } from 'vitest'
import { applyPercentDiscount, computeTaxInclusive, eurosToCents, formatMoney } from '../src/lib/money'

describe('money', () => {
  it('convierte euros a céntimos sin float sucio', () => {
    expect(eurosToCents(10.1)).toBe(1010)
    expect(eurosToCents(19.99)).toBe(1999)
  })

  it('aplica descuentos porcentuales con redondeo', () => {
    expect(applyPercentDiscount(1000, 10)).toBe(900)
    expect(applyPercentDiscount(999, 33)).toBe(669)
  })

  it('calcula impuesto sobre base', () => {
    expect(computeTaxInclusive(1000, 21)).toEqual({
      baseCents: 1000,
      taxCents: 210,
      totalCents: 1210,
    })
  })

  it('formatea moneda en es-ES', () => {
    const formatted = formatMoney(1234)
    expect(formatted).toContain('12')
    expect(formatted).toMatch(/€|EUR/)
  })
})
