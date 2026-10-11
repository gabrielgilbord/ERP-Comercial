import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureBootstrap, resetLocalData } from '../src/db/database'
import { upsertProduct } from '../src/services/inventoryService'
import { exportBackup, restoreBackup, validateBackup } from '../src/services/backupService'

describe('copias de seguridad', () => {
  beforeEach(async () => {
    await db.delete()
    db.open()
    await ensureBootstrap()
  })

  it('exporta, valida y restaura productos', async () => {
    await upsertProduct({
      name: 'Tornillo M6',
      sku: 'TOR-M6',
      barcode: '8400000000999',
      description: '',
      category: 'Ferretería',
      brand: '',
      unit: 'ud',
      costCents: 10,
      priceCents: 25,
      taxPercent: 21,
      minStock: 5,
      supplierId: null,
      status: 'active',
      notes: '',
      stock: 3,
    })

    const backup = await exportBackup()
    expect(validateBackup(backup).tables.products).toHaveLength(1)

    await resetLocalData()
    expect(await db.products.count()).toBe(0)

    await restoreBackup(backup, { makeSafetyCopy: false })
    const products = await db.products.toArray()
    expect(products).toHaveLength(1)
    expect(products[0].name).toBe('Tornillo M6')
    expect(products[0].stock).toBe(3)
  })

  it('rechaza copias inválidas', () => {
    expect(() => validateBackup({ app: 'otro', formatVersion: 1, tables: {} })).toThrow(/Faro/)
  })
})
