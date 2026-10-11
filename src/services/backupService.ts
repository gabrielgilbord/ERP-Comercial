import { db, ensureBootstrap, resetLocalData } from '../db/database'

export const BACKUP_FORMAT_VERSION = 1

const TABLE_NAMES = [
  'settings',
  'companies',
  'demoProducts',
  'outbox',
  'meta',
  'products',
  'customers',
  'suppliers',
  'warehouses',
  'stockMovements',
  'sales',
  'saleLines',
  'salePayments',
  'cashSessions',
  'cashMovements',
  'purchases',
  'purchaseLines',
  'documents',
  'returns',
  'returnLines',
  'idempotency',
] as const

export type BackupPayload = {
  formatVersion: number
  app: string
  exportedAt: string
  tables: Record<string, unknown[]>
}

function table(name: (typeof TABLE_NAMES)[number]) {
  return db.table(name)
}

export async function exportBackup(): Promise<BackupPayload> {
  const tables: Record<string, unknown[]> = {}
  for (const name of TABLE_NAMES) {
    tables[name] = await table(name).toArray()
  }
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    app: 'faro',
    exportedAt: new Date().toISOString(),
    tables,
  }
}

export function downloadBackupJson(payload: BackupPayload, filename?: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `faro-backup-${payload.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function validateBackup(raw: unknown): BackupPayload {
  if (!raw || typeof raw !== 'object') throw new Error('Copia de seguridad inválida')
  const data = raw as Partial<BackupPayload>
  if (data.app !== 'faro') throw new Error('El archivo no es una copia de Faro')
  if (data.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new Error(`Versión de copia no soportada (${String(data.formatVersion)})`)
  }
  if (!data.tables || typeof data.tables !== 'object') {
    throw new Error('La copia no incluye tablas')
  }
  for (const name of TABLE_NAMES) {
    if (!(name in data.tables)) throw new Error(`Falta la tabla ${name} en la copia`)
    if (!Array.isArray(data.tables[name])) throw new Error(`Tabla ${name} inválida`)
  }
  return data as BackupPayload
}

export async function restoreBackup(
  raw: unknown,
  options: { makeSafetyCopy?: boolean } = {},
): Promise<{ restoredTables: number; safetyCopy?: BackupPayload }> {
  // Copia plana: IndexedDB no acepta proxies reactivos ni objetos no clonables.
  const plain = JSON.parse(JSON.stringify(raw)) as unknown
  const payload = validateBackup(plain)
  let safetyCopy: BackupPayload | undefined
  if (options.makeSafetyCopy !== false) {
    safetyCopy = await exportBackup()
  }

  await resetLocalData()
  await db.transaction('rw', TABLE_NAMES.map((n) => table(n)), async () => {
    for (const name of TABLE_NAMES) {
      await table(name).clear()
      const rows = payload.tables[name] as object[]
      if (rows.length) await table(name).bulkPut(rows)
    }
  })

  await ensureBootstrap()
  const settings = await db.settings.get('app')
  if (settings) {
    await db.settings.put({
      ...settings,
      lastBackupAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return { restoredTables: TABLE_NAMES.length, safetyCopy }
}

export async function parseBackupFile(file: File): Promise<unknown> {
  const text = await file.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('El archivo no es JSON válido')
  }
}
