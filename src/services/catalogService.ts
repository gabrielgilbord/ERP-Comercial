import type { Product } from '../domain/commerce'
import type { CatalogPort, CatalogSnapshot, CatalogSource } from '../ports/catalogPort'
import {
  findProductByBarcode,
  listProducts,
  searchProducts,
} from './inventoryService'

/**
 * Adaptador actual: el módulo Productos de este dispositivo actúa como
 * sistema central del catálogo. El TPV no crea ni edita productos.
 *
 * Cuando exista sync real, sustituir por RemoteCatalogAdapter sin tocar el TPV.
 */
export class LocalCentralCatalogAdapter implements CatalogPort {
  getSource(): CatalogSource {
    return 'local_central'
  }

  getSourceLabel(): string {
    return 'Catálogo central (este dispositivo · Productos)'
  }

  async listSellable(): Promise<Product[]> {
    const all = await listProducts(false)
    return all.filter((p) => p.status === 'active')
  }

  async searchSellable(query: string): Promise<Product[]> {
    const found = await searchProducts(query)
    return found.filter((p) => p.status === 'active')
  }

  async findByBarcode(barcode: string): Promise<Product | undefined> {
    const product = await findProductByBarcode(barcode)
    if (!product || product.status !== 'active') return undefined
    return product
  }

  async snapshot(): Promise<CatalogSnapshot> {
    const products = await this.listSellable()
    return {
      source: this.getSource(),
      label: this.getSourceLabel(),
      products,
      fetchedAt: new Date().toISOString(),
    }
  }
}

let catalogPort: CatalogPort = new LocalCentralCatalogAdapter()

/** Permite inyectar otro origen (tests o futuro remoto). */
export function setCatalogPort(port: CatalogPort) {
  catalogPort = port
}

export function getCatalogPort(): CatalogPort {
  return catalogPort
}

export async function listSellableProducts() {
  return getCatalogPort().listSellable()
}

export async function searchSellableProducts(query: string) {
  return getCatalogPort().searchSellable(query)
}

export async function findSellableByBarcode(barcode: string) {
  return getCatalogPort().findByBarcode(barcode)
}

export function catalogSourceLabel() {
  return getCatalogPort().getSourceLabel()
}
