import type { Product } from '../domain/commerce'

/**
 * El TPV solo lee catálogo. Alta/edición de productos va al sistema central
 * (hoy: módulo Productos local; mañana: sync desde servidor).
 */
export type CatalogSource = 'local_central' | 'remote_central'

export interface CatalogSnapshot {
  source: CatalogSource
  label: string
  products: Product[]
  fetchedAt: string
}

export interface CatalogPort {
  getSource(): CatalogSource
  getSourceLabel(): string
  listSellable(): Promise<Product[]>
  searchSellable(query: string): Promise<Product[]>
  findByBarcode(barcode: string): Promise<Product | undefined>
  snapshot(): Promise<CatalogSnapshot>
}
