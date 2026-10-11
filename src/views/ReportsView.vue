<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '../components/ui/PageHeader.vue'
import { formatMoney } from '../lib/money'
import { listSales, salesReport } from '../services/salesService'
import { listProducts } from '../services/inventoryService'
import type { Sale } from '../domain/commerce'

const report = ref<Awaited<ReturnType<typeof salesReport>> | null>(null)
const sales = ref<Sale[]>([])
const inventoryValue = ref(0)

onMounted(async () => {
  report.value = await salesReport()
  sales.value = await listSales()
  const products = await listProducts()
  inventoryValue.value = products.reduce((sum, p) => sum + p.stock * p.costCents, 0)
})
</script>

<template>
  <div>
    <PageHeader
      title="Informes"
      subtitle="Cifras calculadas a partir de ventas y stock reales. Sin datos inventados."
    />

    <div v-if="report" class="grid">
      <div class="stat">
        <span>Ventas registradas</span>
        <strong>{{ report.count }}</strong>
      </div>
      <div class="stat">
        <span>Importe vendido</span>
        <strong>{{ formatMoney(report.totalCents) }}</strong>
      </div>
      <div class="stat">
        <span>Ticket medio</span>
        <strong>{{ formatMoney(report.averageCents) }}</strong>
      </div>
      <div class="stat">
        <span>Valor inventario (coste)</span>
        <strong>{{ formatMoney(inventoryValue) }}</strong>
      </div>
    </div>

    <h2>Últimas ventas</h2>
    <table v-if="sales.length">
      <thead>
        <tr>
          <th>Nº</th>
          <th>Cliente</th>
          <th>Estado</th>
          <th class="num">Total</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in sales.slice(0, 50)" :key="s.id">
          <td>{{ s.number }}</td>
          <td>{{ s.customerName }}</td>
          <td>{{ s.status }}</td>
          <td class="num">{{ formatMoney(s.totalCents) }}</td>
          <td>{{ new Date(s.createdAt).toLocaleString('es-ES') }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="muted">Todavía no hay ventas.</p>
  </div>
</template>

<style scoped>
.grid { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: var(--space-3); margin-bottom: var(--space-5); }
.stat { padding: var(--space-4) 0; border-bottom: 1px solid var(--border); display:flex; flex-direction:column; gap:6px; }
.stat span { color: var(--text-muted); font-size:13px; }
.stat strong { font-size:1.35rem; }
h2 { font-family: var(--font-sans); font-size:1rem; margin-bottom: var(--space-3); }
table { width:100%; border-collapse:collapse; font-size:13px; background: var(--surface); border:1px solid var(--border); }
th, td { padding:10px 12px; border-bottom:1px solid var(--border); text-align:left; }
th { font-size:11px; text-transform:uppercase; color: var(--text-faint); background: var(--surface-muted); }
.num { text-align:right; font-variant-numeric: tabular-nums; }
.muted { color: var(--text-muted); }
@media (max-width:900px){ .grid{ grid-template-columns:1fr 1fr; } }
</style>
