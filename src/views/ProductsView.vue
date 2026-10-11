<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Package, Plus } from '@lucide/vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import { formatMoney } from '../lib/money'
import { estimateMarginPercent } from '../lib/pricing'
import type { Product } from '../domain/commerce'
import { listProducts, upsertProduct } from '../services/inventoryService'

const products = ref<Product[]>([])
const query = ref('')
const showForm = ref(false)
const error = ref('')
const form = ref({
  name: '',
  sku: '',
  barcode: '',
  category: 'General',
  costCents: '0',
  priceCents: '',
  taxPercent: '21',
  stock: '0',
  minStock: '0',
})

async function refresh() {
  products.value = await listProducts()
}

onMounted(refresh)

const filtered = () => {
  const q = query.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q),
  )
}

async function save() {
  error.value = ''
  try {
    const price = Math.round(Number(form.value.priceCents.replace(',', '.')) * 100)
    const cost = Math.round(Number(form.value.costCents.replace(',', '.')) * 100)
    if (!form.value.name.trim()) throw new Error('El nombre es obligatorio')
    if (!Number.isFinite(price) || price < 0) throw new Error('Precio inválido')
    await upsertProduct({
      name: form.value.name.trim(),
      sku: form.value.sku.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`,
      barcode: form.value.barcode.trim(),
      description: '',
      category: form.value.category.trim() || 'General',
      brand: '',
      unit: 'ud',
      costCents: Number.isFinite(cost) ? cost : 0,
      priceCents: price,
      taxPercent: Number(form.value.taxPercent) || 21,
      minStock: Number(form.value.minStock) || 0,
      supplierId: null,
      status: 'active',
      notes: '',
      stock: Number(form.value.stock) || 0,
    })
    showForm.value = false
    form.value = {
      name: '',
      sku: '',
      barcode: '',
      category: 'General',
      costCents: '0',
      priceCents: '',
      taxPercent: '21',
      stock: '0',
      minStock: '0',
    }
    await refresh()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo guardar'
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Productos"
      subtitle="Sistema central del catálogo. Aquí das de alta lo que el TPV solo podrá vender y cobrar."
    >
      <template #actions>
        <AppButton variant="primary" @click="showForm = !showForm">
          <Plus :size="16" />
          Nuevo producto
        </AppButton>
      </template>
    </PageHeader>

    <div v-if="showForm" class="form-panel">
      <h2>Alta de producto</h2>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="grid">
        <AppInput v-model="form.name" label="Nombre" id="p-name" required />
        <AppInput v-model="form.sku" label="Referencia" id="p-sku" hint="Si la dejas vacía, se genera sola." />
        <AppInput v-model="form.barcode" label="Código de barras" id="p-bar" />
        <AppInput v-model="form.category" label="Categoría" id="p-cat" />
        <AppInput v-model="form.costCents" label="Coste (€)" id="p-cost" />
        <AppInput v-model="form.priceCents" label="PVP con impuestos (€)" id="p-price" required />
        <AppInput v-model="form.taxPercent" label="IVA %" id="p-tax" />
        <AppInput v-model="form.stock" label="Stock inicial" id="p-stock" />
        <AppInput v-model="form.minStock" label="Stock mínimo" id="p-min" />
      </div>
      <div class="actions">
        <AppButton variant="ghost" @click="showForm = false">Cancelar</AppButton>
        <AppButton variant="primary" @click="save">Guardar producto</AppButton>
      </div>
    </div>

    <AppInput v-model="query" label="Buscar" id="p-search" placeholder="Nombre, referencia o código…" />

    <EmptyState
      v-if="!filtered().length"
      title="No hay productos"
      description="Crea tu primer producto o recibe mercancía desde Compras. Los productos de ejemplo antiguos no aparecen aquí."
    >
      <template #icon><Package :size="22" /></template>
      <template #actions>
        <AppButton variant="primary" @click="showForm = true">Crear producto</AppButton>
      </template>
    </EmptyState>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ref.</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th class="num">Coste</th>
            <th class="num">PVP</th>
            <th class="num">Margen</th>
            <th class="num">Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered()" :key="p.id" :class="{ low: p.minStock > 0 && p.stock <= p.minStock }">
            <td>{{ p.sku }}</td>
            <td>{{ p.name }}</td>
            <td>{{ p.category }}</td>
            <td class="num">{{ formatMoney(p.costCents) }}</td>
            <td class="num">{{ formatMoney(p.priceCents) }}</td>
            <td class="num">
              {{ estimateMarginPercent(p.costCents, p.priceCents) ?? '—' }}%
            </td>
            <td class="num">{{ p.stock }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.form-panel {
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--border);
}
.form-panel h2 {
  font-family: var(--font-sans);
  font-size: 1rem;
  margin-bottom: var(--space-4);
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-top: var(--space-4);
}
.error {
  color: var(--danger);
  margin-bottom: var(--space-3);
}
.table-wrap {
  margin-top: var(--space-4);
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--surface);
  border: 1px solid var(--border);
}
th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}
th {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-faint);
  background: var(--surface-muted);
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
tr.low td:last-child {
  color: var(--warning);
  font-weight: 700;
}
@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
