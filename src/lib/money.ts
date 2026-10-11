/** Cálculos monetarios en céntimos enteros para evitar errores de float. */

export function eurosToCents(value: number): number {
  return Math.round(value * 100)
}

export function centsToEuros(cents: number): number {
  return cents / 100
}

export function formatMoney(cents: number, currency = 'EUR', locale = 'es-ES'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(centsToEuros(cents))
}

export function applyPercentDiscount(amountCents: number, percent: number): number {
  if (percent < 0 || percent > 100) {
    throw new RangeError('El porcentaje debe estar entre 0 y 100')
  }
  return Math.round(amountCents * (1 - percent / 100))
}

export function computeTaxInclusive(baseCents: number, taxPercent: number): {
  baseCents: number
  taxCents: number
  totalCents: number
} {
  const taxCents = Math.round(baseCents * (taxPercent / 100))
  return {
    baseCents,
    taxCents,
    totalCents: baseCents + taxCents,
  }
}
