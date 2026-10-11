<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import { ClipboardList } from '@lucide/vue'
import { formatMoney } from '../lib/money'
import type { Product, Purchase, Supplier } from '../domain/commerce'
import { listProducts } from '../services/inventoryService'
import { listSuppliers } from '../services/contactsService'
import { createAndReceivePurchase, listPurchases } from '../services/purchaseService'

const purchases = ref<Purchase[]>([])
const suppliers = ref<Supplier[]>([])
const products = ref<Product[]>([])
const showForm = ref(false)
const error = ref('')
const success = ref('')
const form = ref({
  supplierId: '',
  productId: '',
  quantity: '10',
  unitCost: '',
})

async function refresh() {
  purchases.value = await listPurchases()
  suppliers.value = await listSuppliers()
  products.value = await listProducts()
}
onMounted(refresh)

async function receive() {
  error.value = ''
  success.value = ''
  try {
    if (!form.value.supplierId) throw new Error('Selecciona un proveedor')
    if (!form.value.productId) throw new Error('Selecciona un producto')
    const qty = Number(form.value.quantity)
    const cost = Math.round(Number(form.value.unitCost.replace(',', '.')) * 100)
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('Cantidad inválida')
    if (!Number.isFinite(cost) || cost < 0) throw new Error('Coste inválido')
    const product = products.value.find((p) => p.id === form.value.productId)!
    const purchase = await createAndReceivePurchase({
      supplierId: form.value.supplierId,
      lines: [
        {
          productId: form.value.productId,
          quantity: qty,
          unitCostCents: cost,
          taxPercent: product.taxPercent,
        },
      ],
    })
    success.value = `Compra ${purchase.number} recibida. Stock actualizado.`
    showForm.value = false
    await refresh()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error en la compra'
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Compras"
      subtitle="Registra la recepción de mercancía. El stock aumenta solo cuando recibes."
    >
      <template #actions>
        <AppButton variant="primary" @click="showForm = !showForm">Recibir mercancía</AppButton>
      </template>
    </PageHeader>

    <p v-if="success" class="ok">{{ success }}</p>

    <div v-if="showForm" class="form-panel">
      <p v-if="error" class="error">{{ error }}</p>
      <label class="field">
        <span>Proveedor</span>
        <select v-model="form.supplierId">
          <option value="">Selecciona…</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
      <label class="field">
        <span>Producto</span>
        <select v-model="form.productId">
          <option value="">Selecciona…</option>
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.sku }})</option>
        </select>
      </label>
      <div class="grid">
        <AppInput v-model="form.quantity" label="Cantidad recibida" id="q" />
        <AppInput v-model="form.unitCost" label="Coste unitario (€)" id="cost" />
      </div>
      <div class="actions">
        <AppButton variant="ghost" @click="showForm = false">Cancelar</AppButton>
        <AppButton variant="primary" @click="receive">Confirmar recepción</AppButton>
      </div>
    </div>

    <EmptyState
      v-if="!purchases.length"
      title="Sin compras registradas"
      description="Crea un proveedor y un producto, luego recibe mercancía para aumentar el stock."
    >
      <template #icon><ClipboardList :size="22" /></template>
    </EmptyState>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nº</th>
            <th>Proveedor</th>
            <th>Estado</th>
            <th class="num">Total</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in purchases" :key="p.id">
            <td>{{ p.number }}</td>
            <td>{{ p.supplierName }}</td>
            <td>{{ p.status === 'received' ? 'Recibida' : p.status }}</td>
            <td class="num">{{ formatMoney(p.totalCents) }}</td>
            <td>{{ new Date(p.createdAt).toLocaleString('es-ES') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.form-panel { margin-bottom: var(--space-5); padding-bottom: var(--space-5); border-bottom: 1px solid var(--border); display:grid; gap: var(--space-3); }
.field { display:flex; flex-direction:column; gap:6px; font-weight:600; font-size:13px; }
.field select { min-height:40px; border:1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); padding:0 10px; }
.grid { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: var(--space-3); }
.actions { display:flex; gap: var(--space-2); justify-content:flex-end; }
.error { color: var(--danger); }
.ok { color: var(--success); font-weight:600; margin-bottom: var(--space-3); }
.table-wrap { overflow:auto; }
table { width:100%; border-collapse:collapse; font-size:13px; background: var(--surface); border:1px solid var(--border); }
th, td { padding:10px 12px; border-bottom:1px solid var(--border); text-align:left; }
th { font-size:11px; text-transform:uppercase; color: var(--text-faint); background: var(--surface-muted); }
.num { text-align:right; font-variant-numeric: tabular-nums; }
</style>
