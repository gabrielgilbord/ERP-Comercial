/** Genera un id ordenable lexicográficamente (timestamp + aleatorio). */
export function createId(prefix = ''): string {
  const time = Date.now().toString(36)
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  return prefix ? `${prefix}_${time}${rand}` : `${time}${rand}`
}

export function createIdempotencyKey(): string {
  return createId('idem')
}
