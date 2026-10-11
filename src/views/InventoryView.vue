<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import { Warehouse } from '@lucide/vue'
import { formatMoney } from '../lib/money'
import type { Product, StockMovement } from '../domain/commerce'
import { listMovements, listProducts, lowStockProducts } from '../services/inventoryService'

const products = ref<Product[]>([])
const movements = ref<StockMovement[]>([])
const low = ref<Product[]>([])

onMounted(async () => {
  products.value = await listProducts()
  movements.value = await listMovements()
  low.value = await lowStockProducts()
})

const typeLabel: Record<string, string> = {
  initial: 'Stock inicial',
  purchase_in: 'Compra',
  sale_out: 'Venta',
  return_in: 'Devolución',
  adjust_in: 'Ajuste +',
  adjust_out: 'Ajuste -',
  waste: 'Merma',
}
</script>

<template>
  <div>
    <PageHeader
      title="Inventario"
      subtitle="Stock actual y movimientos auditables. No se edita el stock a mano."
    />

    <section v-if="low.length" class="alert">
      <h2>Stock bajo</h2>
      <ul>
        <li v-for="p in low" :key="p.id">{{ p.name }}: {{ p.stock }} (mín. {{ p.minStock }})</li>
      </ul>
    </section>

    <EmptyState
      v-if="!products.length"
      title="Sin stock que mostrar"
      description="Crea productos y recibe compras para generar movimientos."
    >
      <template #icon><Warehouse :size="22" /></template>
    </EmptyState>

    <template v-else>
      <h2 class="section">Existencias</h2>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th class="num">Stock</th>
            <th class="num">Valor coste</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>{{ p.name }}</td>
            <td class="num">{{ p.stock }}</td>
            <td class="num">{{ formatMoney(p.stock * p.costCents) }}</td>
          </tr>
        </tbody>
      </table>

      <h2 class="section">Últimos movimientos</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Motivo</th>
            <th class="num">Cant.</th>
            <th class="num">Stock tras</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in movements.slice(0, 30)" :key="m.id">
            <td>{{ new Date(m.createdAt).toLocaleString('es-ES') }}</td>
            <td>{{ typeLabel[m.type] || m.type }}</td>
            <td>{{ m.reason }}</td>
            <td class="num">{{ m.quantity }}</td>
            <td class="num">{{ m.stockAfter }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.alert { padding: var(--space-4); margin-bottom: var(--space-4); background: var(--warning-soft); color: var(--warning); border-radius: var(--radius-md); }
.alert ul { margin: var(--space-2) 0 0; padding-left: 1.1rem; }
.section { font-family: var(--font-sans); font-size: 1rem; margin: var(--space-5) 0 var(--space-3); }
table { width:100%; border-collapse:collapse; font-size:13px; background: var(--surface); border:1px solid var(--border); margin-bottom: var(--space-4); }
th, td { padding:10px 12px; border-bottom:1px solid var(--border); text-align:left; }
th { font-size:11px; text-transform:uppercase; color: var(--text-faint); background: var(--surface-muted); }
.num { text-align:right; font-variant-numeric: tabular-nums; }
</style>
