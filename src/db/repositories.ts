import { db } from './database'
import type { AppSettings, CompanyProfile, DemoProduct } from '../domain/types'
import { createId } from '../domain/ids'

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('app')
  if (!settings) throw new Error('Settings no inicializados')
  return settings
}

export async function updateSettings(patch: Partial<Omit<AppSettings, 'id' | 'createdAt'>>): Promise<AppSettings> {
  const current = await getSettings()
  const next: AppSettings = {
    ...current,
    ...patch,
    id: 'app',
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  }
  await db.settings.put(next)
  return next
}

export async function getCompany(): Promise<CompanyProfile> {
  const company = await db.companies.toCollection().first()
  if (!company) throw new Error('Empresa no inicializada')
  return company
}

export async function updateCompany(patch: Partial<Omit<CompanyProfile, 'id'>>): Promise<CompanyProfile> {
  const current = await getCompany()
  const next: CompanyProfile = {
    ...current,
    ...patch,
    id: current.id,
    updatedAt: new Date().toISOString(),
  }
  await db.companies.put(next)
  return next
}

const DEMO_SEED: Omit<DemoProduct, 'id'>[] = [
  { sku: 'DEMO-001', name: 'Café molido 250g', priceCents: 499, stock: 24, category: 'Alimentación', isDemo: true },
  { sku: 'DEMO-002', name: 'Botella agua 1L', priceCents: 120, stock: 80, category: 'Bebidas', isDemo: true },
  { sku: 'DEMO-003', name: 'Cuaderno A5', priceCents: 350, stock: 15, category: 'Papelería', isDemo: true },
  { sku: 'DEMO-004', name: 'Bolígrafo azul', priceCents: 95, stock: 120, category: 'Papelería', isDemo: true },
  { sku: 'DEMO-005', name: 'Servicio reparación', priceCents: 2500, stock: 0, category: 'Servicios', isDemo: true },
]

export async function enableDemoData(): Promise<DemoProduct[]> {
  await db.demoProducts.clear()
  const rows: DemoProduct[] = DEMO_SEED.map((item) => ({ ...item, id: createId('demo') }))
  await db.demoProducts.bulkAdd(rows)
  await updateSettings({ demoMode: true })
  return rows
}

export async function disableDemoData(): Promise<void> {
  await db.demoProducts.clear()
  await updateSettings({ demoMode: false })
}

export async function listDemoProducts(): Promise<DemoProduct[]> {
  return db.demoProducts.toArray()
}

export async function countPendingOps(): Promise<number> {
  return db.outbox.count()
}

export async function searchLocal(query: string): Promise<
  Array<{ kind: 'product' | 'company'; id: string; title: string; subtitle: string }>
> {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results: Array<{ kind: 'product' | 'company'; id: string; title: string; subtitle: string }> = []
  const company = await getCompany()
  if (
    company.name.toLowerCase().includes(q) ||
    company.tradeName.toLowerCase().includes(q)
  ) {
    results.push({
      kind: 'company',
      id: company.id,
      title: company.tradeName || company.name || 'Mi empresa',
      subtitle: 'Perfil de empresa',
    })
  }

  const products = await db.demoProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
    .limit(20)
    .toArray()

  for (const p of products) {
    results.push({
      kind: 'product',
      id: p.id,
      title: p.name,
      subtitle: `${p.sku} · ejemplo`,
    })
  }

  return results
}
