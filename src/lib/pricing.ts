import type { CartLine } from '../domain/commerce'

export interface LineTotals {
  lineBaseCents: number
  lineTaxCents: number
  lineTotalCents: number
}

/** Precio unitario con impuestos incluidos (modelo TPV habitual en España minorista). */
export function lineTotalsFromCart(line: CartLine): LineTotals {
  const gross = Math.round(line.unitPriceCents * line.quantity * (1 - line.discountPercent / 100))
  const base = Math.round(gross / (1 + line.taxPercent / 100))
  const tax = gross - base
  return { lineBaseCents: base, lineTaxCents: tax, lineTotalCents: gross }
}

export function cartTotals(lines: CartLine[]): {
  subtotalCents: number
  taxCents: number
  totalCents: number
  discountCents: number
} {
  let subtotalCents = 0
  let taxCents = 0
  let totalCents = 0
  let discountCents = 0
  for (const line of lines) {
    const full = line.unitPriceCents * line.quantity
    const totals = lineTotalsFromCart(line)
    discountCents += full - totals.lineTotalCents
    subtotalCents += totals.lineBaseCents
    taxCents += totals.lineTaxCents
    totalCents += totals.lineTotalCents
  }
  return { subtotalCents, taxCents, totalCents, discountCents }
}

export function computeChange(totalCents: number, receivedCents: number): number {
  if (receivedCents < totalCents) return 0
  return receivedCents - totalCents
}

export function estimateMarginPercent(costCents: number, priceCents: number): number | null {
  if (priceCents <= 0) return null
  return Math.round(((priceCents - costCents) / priceCents) * 1000) / 10
}
