import { db } from '../db/database'
import { createId } from '../domain/ids'
import type { Customer, Supplier } from '../domain/commerce'

export async function listCustomers(): Promise<Customer[]> {
  return db.customers.orderBy('name').toArray()
}

export async function upsertCustomer(
  input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<Customer> {
  const now = new Date().toISOString()
  if (input.id) {
    const existing = await db.customers.get(input.id)
    if (!existing) throw new Error('Cliente no encontrado')
    const next = { ...existing, ...input, id: existing.id, updatedAt: now }
    await db.customers.put(next)
    return next
  }
  const customer: Customer = {
    id: createId('cus'),
    name: input.name,
    email: input.email || '',
    phone: input.phone || '',
    taxId: input.taxId || '',
    address: input.address || '',
    notes: input.notes || '',
    createdAt: now,
    updatedAt: now,
  }
  await db.customers.add(customer)
  return customer
}

export async function listSuppliers(): Promise<Supplier[]> {
  return db.suppliers.orderBy('name').toArray()
}

export async function upsertSupplier(
  input: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<Supplier> {
  const now = new Date().toISOString()
  if (input.id) {
    const existing = await db.suppliers.get(input.id)
    if (!existing) throw new Error('Proveedor no encontrado')
    const next = { ...existing, ...input, id: existing.id, updatedAt: now }
    await db.suppliers.put(next)
    return next
  }
  const supplier: Supplier = {
    id: createId('sup'),
    name: input.name,
    email: input.email || '',
    phone: input.phone || '',
    taxId: input.taxId || '',
    address: input.address || '',
    notes: input.notes || '',
    createdAt: now,
    updatedAt: now,
  }
  await db.suppliers.add(supplier)
  return supplier
}
