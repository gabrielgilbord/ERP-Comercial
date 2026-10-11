export type ProductStatus = 'active' | 'archived'

export interface Product {
  id: string
  sku: string
  barcode: string
  name: string
  description: string
  category: string
  brand: string
  unit: string
  costCents: number
  priceCents: number
  taxPercent: number
  stock: number
  minStock: number
  supplierId: string | null
  warehouseId: string
  status: ProductStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  taxId: string
  address: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  taxId: string
  address: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Warehouse {
  id: string
  name: string
  isDefault: boolean
  createdAt: string
}

export type StockMovementType =
  | 'initial'
  | 'purchase_in'
  | 'sale_out'
  | 'return_in'
  | 'return_to_supplier'
  | 'adjust_in'
  | 'adjust_out'
  | 'waste'
  | 'transfer_in'
  | 'transfer_out'
  | 'count_adjust'

export interface StockMovement {
  id: string
  productId: string
  warehouseId: string
  type: StockMovementType
  quantity: number
  stockAfter: number
  reason: string
  documentId: string | null
  saleId: string | null
  purchaseId: string | null
  idempotencyKey: string
  createdAt: string
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other'

export interface SaleLine {
  id: string
  saleId: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPriceCents: number
  discountPercent: number
  taxPercent: number
  lineBaseCents: number
  lineTaxCents: number
  lineTotalCents: number
}

export interface SalePayment {
  id: string
  saleId: string
  method: PaymentMethod
  amountCents: number
  receivedCents: number
  changeCents: number
  /** manual = registrado a mano; no implica confirmación de TPV bancario */
  confirmation: 'manual'
}

export type SaleStatus = 'completed' | 'returned' | 'partially_returned'

export interface Sale {
  id: string
  number: string
  status: SaleStatus
  customerId: string | null
  customerName: string
  subtotalCents: number
  discountCents: number
  taxCents: number
  totalCents: number
  paidCents: number
  changeCents: number
  cashSessionId: string | null
  warehouseId: string
  idempotencyKey: string
  note: string
  createdAt: string
}

export type CashSessionStatus = 'open' | 'closed'

export interface CashSession {
  id: string
  status: CashSessionStatus
  openingCents: number
  openedAt: string
  closedAt: string | null
  countedCents: number | null
  expectedCashCents: number | null
  differenceCents: number | null
  note: string
}

export type CashMovementType =
  | 'opening'
  | 'sale_cash'
  | 'sale_card'
  | 'sale_other'
  | 'cash_in'
  | 'cash_out'
  | 'refund_cash'
  | 'adjustment'

export interface CashMovement {
  id: string
  sessionId: string
  type: CashMovementType
  method: PaymentMethod
  amountCents: number
  saleId: string | null
  note: string
  createdAt: string
}

export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled'

export interface PurchaseLine {
  id: string
  purchaseId: string
  productId: string
  productName: string
  quantityOrdered: number
  quantityReceived: number
  unitCostCents: number
  taxPercent: number
}

export interface Purchase {
  id: string
  number: string
  supplierId: string
  supplierName: string
  status: PurchaseStatus
  warehouseId: string
  totalCents: number
  note: string
  idempotencyKey: string
  createdAt: string
  receivedAt: string | null
}

export type DocumentKind = 'ticket' | 'return_note' | 'cash_close'

export interface IssuedDocument {
  id: string
  kind: DocumentKind
  number: string
  saleId: string | null
  cashSessionId: string | null
  /** Snapshot congelado para impresión histórica */
  payloadJson: string
  createdAt: string
}

export interface ReturnRecord {
  id: string
  saleId: string
  number: string
  reason: string
  totalCents: number
  restock: boolean
  cashSessionId: string | null
  idempotencyKey: string
  createdAt: string
}

export interface ReturnLine {
  id: string
  returnId: string
  saleLineId: string
  productId: string
  quantity: number
  lineTotalCents: number
}

export interface CartLine {
  productId: string
  productName: string
  sku: string
  barcode: string
  quantity: number
  unitPriceCents: number
  taxPercent: number
  discountPercent: number
  stockAvailable: number
}
