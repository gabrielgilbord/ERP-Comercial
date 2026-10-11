import { db, getDefaultWarehouseId } from '../db/database'
import { createId, createIdempotencyKey } from '../domain/ids'
import type { Product, StockMovement, StockMovementType } from '../domain/commerce'

export async function listProducts(includeArchived = false): Promise<Product[]> {
  const all = await db.products.orderBy('name').toArray()
  return includeArchived ? all : all.filter((p) => p.status === 'active')
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase()
  if (!q) return listProducts()
  const all = await listProducts()
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  )
}

export async function findProductByBarcode(barcode: string): Promise<Product | undefined> {
  const code = barcode.trim()
  if (!code) return undefined
  return db.products.where('barcode').equals(code).first()
}

export async function upsertProduct(
  input: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'warehouseId' | 'stock'> & {
    id?: string
    warehouseId?: string
    stock?: number
  },
): Promise<Product> {
  const now = new Date().toISOString()
  const warehouseId = input.warehouseId || (await getDefaultWarehouseId())

  if (input.sku) {
    const dup = await db.products.where('sku').equals(input.sku).first()
    if (dup && dup.id !== input.id) throw new Error(`Ya existe un producto con referencia ${input.sku}`)
  }

  if (input.id) {
    const existing = await db.products.get(input.id)
    if (!existing) throw new Error('Producto no encontrado')
    const next: Product = {
      ...existing,
      ...input,
      id: existing.id,
      stock: existing.stock,
      warehouseId: existing.warehouseId,
      updatedAt: now,
    }
    await db.products.put(next)
    return next
  }

  const product: Product = {
    id: createId('prod'),
    sku: input.sku,
    barcode: input.barcode,
    name: input.name,
    description: input.description,
    category: input.category,
    brand: input.brand,
    unit: input.unit || 'ud',
    costCents: input.costCents,
    priceCents: input.priceCents,
    taxPercent: input.taxPercent,
    stock: 0,
    minStock: input.minStock,
    supplierId: input.supplierId,
    warehouseId,
    status: input.status || 'active',
    notes: input.notes || '',
    createdAt: now,
    updatedAt: now,
  }

  await db.transaction('rw', db.products, db.stockMovements, db.idempotency, async () => {
    await db.products.add(product)
    const initial = input.stock ?? 0
    if (initial > 0) {
      await applyStockChange({
        productId: product.id,
        warehouseId,
        type: 'initial',
        quantity: initial,
        reason: 'Stock inicial',
        idempotencyKey: createIdempotencyKey(),
      })
    }
  })

  return (await db.products.get(product.id))!
}

export async function applyStockChange(params: {
  productId: string
  warehouseId: string
  type: StockMovementType
  quantity: number
  reason: string
  documentId?: string | null
  saleId?: string | null
  purchaseId?: string | null
  idempotencyKey: string
}): Promise<StockMovement> {
  if (params.quantity === 0) throw new Error('La cantidad del movimiento no puede ser 0')

  const existingKey = await db.idempotency.get(params.idempotencyKey)
  if (existingKey) {
    const mov = await db.stockMovements.get(existingKey.resultId)
    if (mov) return mov
  }

  const product = await db.products.get(params.productId)
  if (!product) throw new Error('Producto no encontrado')

  const inbound = [
    'initial',
    'purchase_in',
    'return_in',
    'adjust_in',
    'transfer_in',
    'count_adjust',
  ].includes(params.type)

  const delta = inbound ? Math.abs(params.quantity) : -Math.abs(params.quantity)
  const nextStock = product.stock + delta
  if (nextStock < 0) {
    throw new Error(`Stock insuficiente para ${product.name} (disponible: ${product.stock})`)
  }

  const movement: StockMovement = {
    id: createId('mov'),
    productId: params.productId,
    warehouseId: params.warehouseId,
    type: params.type,
    quantity: Math.abs(params.quantity),
    stockAfter: nextStock,
    reason: params.reason,
    documentId: params.documentId ?? null,
    saleId: params.saleId ?? null,
    purchaseId: params.purchaseId ?? null,
    idempotencyKey: params.idempotencyKey,
    createdAt: new Date().toISOString(),
  }

  await db.products.update(product.id, { stock: nextStock, updatedAt: new Date().toISOString() })
  await db.stockMovements.add(movement)
  await db.idempotency.put({
    key: params.idempotencyKey,
    operation: 'stock_movement',
    resultId: movement.id,
    createdAt: movement.createdAt,
  })

  return movement
}

export async function listMovements(productId?: string): Promise<StockMovement[]> {
  if (productId) {
    return db.stockMovements.where('productId').equals(productId).reverse().sortBy('createdAt')
  }
  return db.stockMovements.orderBy('createdAt').reverse().toArray()
}

export async function lowStockProducts(): Promise<Product[]> {
  const products = await listProducts()
  return products.filter((p) => p.minStock > 0 && p.stock <= p.minStock)
}
