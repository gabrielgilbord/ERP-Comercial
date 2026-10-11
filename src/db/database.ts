import Dexie, { type Table } from 'dexie'
import type { AppSettings, CompanyProfile, DemoProduct, MetaRecord } from '../domain/types'
import { createId } from '../domain/ids'

export interface OutboxItem {
  id: string
  type: string
  payload: string
  idempotencyKey: string
  createdAt: string
  attempts: number
  lastError: string | null
}

export class FaroDatabase extends Dexie {
  settings!: Table<AppSettings, string>
  companies!: Table<CompanyProfile, string>
  demoProducts!: Table<DemoProduct, string>
  outbox!: Table<OutboxItem, string>
  meta!: Table<MetaRecord, string>

  constructor() {
    super('faro_local_v1')

    this.version(1).stores({
      settings: 'id',
      companies: 'id, name',
      demoProducts: 'id, sku, name, isDemo',
      outbox: 'id, type, idempotencyKey, createdAt',
      meta: 'key',
    })
  }
}

export const db = new FaroDatabase()

export async function ensureBootstrap(): Promise<{
  settings: AppSettings
  company: CompanyProfile
}> {
  const now = new Date().toISOString()

  let settings = await db.settings.get('app')
  if (!settings) {
    settings = {
      id: 'app',
      theme: 'system',
      locale: 'es-ES',
      currency: 'EUR',
      terminalId: createId('term'),
      demoMode: false,
      setupStep: 0,
      setupCompleted: false,
      lastSyncAt: null,
      lastBackupAt: null,
      createdAt: now,
      updatedAt: now,
    }
    await db.settings.put(settings)
  }

  let company = await db.companies.toCollection().first()
  if (!company) {
    company = {
      id: createId('co'),
      name: '',
      tradeName: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'ES',
      businessTemplate: null,
      updatedAt: now,
    }
    await db.companies.put(company)
  }

  await db.meta.put({ key: 'schemaVersion', value: '1' })
  await db.meta.put({ key: 'bootstrappedAt', value: now })

  return { settings, company }
}

export async function resetLocalData(): Promise<void> {
  await Promise.all([
    db.settings.clear(),
    db.companies.clear(),
    db.demoProducts.clear(),
    db.outbox.clear(),
    db.meta.clear(),
  ])
  await ensureBootstrap()
}
