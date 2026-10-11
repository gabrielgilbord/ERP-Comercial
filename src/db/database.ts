import Dexie, { type Table } from 'dexie'
import type { AppSettings, CompanyProfile, DemoProduct, MetaRecord } from '../domain/types'
import type {
  CashMovement,
  CashSession,
  Customer,
  IssuedDocument,
  Product,
  Purchase,
  PurchaseLine,
  ReturnLine,
  ReturnRecord,
  Sale,
  SaleLine,
  SalePayment,
  StockMovement,
  Supplier,
  Warehouse,
} from '../domain/commerce'
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
  products!: Table<Product, string>
  customers!: Table<Customer, string>
  suppliers!: Table<Supplier, string>
  warehouses!: Table<Warehouse, string>
  stockMovements!: Table<StockMovement, string>
  sales!: Table<Sale, string>
  saleLines!: Table<SaleLine, string>
  salePayments!: Table<SalePayment, string>
  cashSessions!: Table<CashSession, string>
  cashMovements!: Table<CashMovement, string>
  purchases!: Table<Purchase, string>
  purchaseLines!: Table<PurchaseLine, string>
  documents!: Table<IssuedDocument, string>
  returns!: Table<ReturnRecord, string>
  returnLines!: Table<ReturnLine, string>
  idempotency!: Table<{ key: string; operation: string; resultId: string; createdAt: string }, string>

  constructor() {
    super('faro_local_v1')

    this.version(1).stores({
      settings: 'id',
      companies: 'id, name',
      demoProducts: 'id, sku, name, isDemo',
      outbox: 'id, type, idempotencyKey, createdAt',
      meta: 'key',
    })

    this.version(2).stores({
      settings: 'id',
      companies: 'id, name',
      demoProducts: 'id, sku, name, isDemo',
      outbox: 'id, type, idempotencyKey, createdAt',
      meta: 'key',
      products: 'id, sku, barcode, name, category, status, supplierId, warehouseId',
      customers: 'id, name, email, phone',
      suppliers: 'id, name, email, phone',
      warehouses: 'id, name, isDefault',
      stockMovements: 'id, productId, warehouseId, type, saleId, purchaseId, idempotencyKey, createdAt',
      sales: 'id, number, status, customerId, cashSessionId, idempotencyKey, createdAt',
      saleLines: 'id, saleId, productId',
      salePayments: 'id, saleId, method',
      cashSessions: 'id, status, openedAt',
      cashMovements: 'id, sessionId, type, saleId, createdAt',
      purchases: 'id, number, supplierId, status, idempotencyKey, createdAt',
      purchaseLines: 'id, purchaseId, productId',
      documents: 'id, kind, number, saleId, cashSessionId, createdAt',
      returns: 'id, saleId, number, idempotencyKey, createdAt',
      returnLines: 'id, returnId, saleLineId, productId',
      idempotency: 'key, operation, resultId',
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

  const warehouseCount = await db.warehouses.count()
  if (warehouseCount === 0) {
    await db.warehouses.put({
      id: createId('wh'),
      name: 'Principal',
      isDefault: true,
      createdAt: now,
    })
  }

  await db.meta.put({ key: 'schemaVersion', value: '2' })
  await db.meta.put({ key: 'bootstrappedAt', value: now })

  return { settings, company }
}

export async function getDefaultWarehouseId(): Promise<string> {
  const wh =
    (await db.warehouses.filter((w) => w.isDefault).first()) ||
    (await db.warehouses.toCollection().first())
  if (!wh) throw new Error('No hay almacén configurado')
  return wh.id
}

export async function resetLocalData(): Promise<void> {
  await Promise.all([
    db.settings.clear(),
    db.companies.clear(),
    db.demoProducts.clear(),
    db.outbox.clear(),
    db.meta.clear(),
    db.products.clear(),
    db.customers.clear(),
    db.suppliers.clear(),
    db.warehouses.clear(),
    db.stockMovements.clear(),
    db.sales.clear(),
    db.saleLines.clear(),
    db.salePayments.clear(),
    db.cashSessions.clear(),
    db.cashMovements.clear(),
    db.purchases.clear(),
    db.purchaseLines.clear(),
    db.documents.clear(),
    db.returns.clear(),
    db.returnLines.clear(),
    db.idempotency.clear(),
  ])
  await ensureBootstrap()
}
