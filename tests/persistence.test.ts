import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureBootstrap, resetLocalData } from '../src/db/database'
import {
  enableDemoData,
  getCompany,
  getSettings,
  searchLocal,
  updateCompany,
  updateSettings,
} from '../src/db/repositories'

describe('persistencia local IndexedDB', () => {
  beforeEach(async () => {
    await db.delete()
    db.open()
    await ensureBootstrap()
  })

  it('inicializa settings y empresa', async () => {
    const settings = await getSettings()
    const company = await getCompany()
    expect(settings.id).toBe('app')
    expect(settings.terminalId).toMatch(/^term_/)
    expect(settings.lastSyncAt).toBeNull()
    expect(company.country).toBe('ES')
  })

  it('persiste cambios de empresa y tema', async () => {
    await updateCompany({ name: 'Comercio Demo SL', tradeName: 'Demo Shop' })
    await updateSettings({ theme: 'dark', setupStep: 2 })

    const company = await getCompany()
    const settings = await getSettings()
    expect(company.name).toBe('Comercio Demo SL')
    expect(company.tradeName).toBe('Demo Shop')
    expect(settings.theme).toBe('dark')
    expect(settings.setupStep).toBe(2)
  })

  it('carga productos demo y busca catálogo real', async () => {
    const products = await enableDemoData()
    expect(products.length).toBeGreaterThan(0)
    expect(products.every((p) => p.isDemo)).toBe(true)

    const { upsertProduct } = await import('../src/services/inventoryService')
    await upsertProduct({
      name: 'Café molido prueba',
      sku: 'CAF-TEST',
      barcode: '',
      description: '',
      category: 'Alimentación',
      brand: '',
      unit: 'ud',
      costCents: 100,
      priceCents: 500,
      taxPercent: 10,
      minStock: 0,
      supplierId: null,
      status: 'active',
      notes: '',
      stock: 1,
    })

    const results = await searchLocal('café')
    expect(results.some((r) => r.kind === 'product')).toBe(true)
  })

  it('reset limpia y vuelve a bootstrap', async () => {
    await updateCompany({ name: 'Temporal' })
    await enableDemoData()
    await resetLocalData()
    const company = await getCompany()
    const settings = await getSettings()
    expect(company.name).toBe('')
    expect(settings.demoMode).toBe(false)
    expect(await db.demoProducts.count()).toBe(0)
  })
})
