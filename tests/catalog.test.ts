import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureBootstrap } from '../src/db/database'
import { upsertProduct } from '../src/services/inventoryService'
import {
  LocalCentralCatalogAdapter,
  findSellableByBarcode,
  listSellableProducts,
  setCatalogPort,
} from '../src/services/catalogService'

describe('catálogo central para TPV', () => {
  beforeEach(async () => {
    await db.delete()
    db.open()
    await ensureBootstrap()
    setCatalogPort(new LocalCentralCatalogAdapter())
  })

  it('el TPV solo ve productos activos del catálogo central', async () => {
    await upsertProduct({
      name: 'Activo',
      sku: 'A1',
      barcode: '8400000000001',
      description: '',
      category: 'G',
      brand: '',
      unit: 'ud',
      costCents: 10,
      priceCents: 100,
      taxPercent: 21,
      minStock: 0,
      supplierId: null,
      status: 'active',
      notes: '',
      stock: 5,
    })
    await upsertProduct({
      name: 'Archivado',
      sku: 'A2',
      barcode: '8400000000002',
      description: '',
      category: 'G',
      brand: '',
      unit: 'ud',
      costCents: 10,
      priceCents: 100,
      taxPercent: 21,
      minStock: 0,
      supplierId: null,
      status: 'archived',
      notes: '',
      stock: 5,
    })

    const sellable = await listSellableProducts()
    expect(sellable.map((p) => p.name)).toEqual(['Activo'])
    expect(await findSellableByBarcode('8400000000001')).toBeTruthy()
    expect(await findSellableByBarcode('8400000000002')).toBeUndefined()
  })
})
