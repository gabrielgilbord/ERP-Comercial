<script setup lang="ts">
import { Package } from '@lucide/vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'
import { useAppStore } from '../stores/appStore'
import { formatMoney } from '../lib/money'

const app = useAppStore()

async function enableDemo() {
  await app.toggleDemo(true)
}

async function disableDemo() {
  await app.toggleDemo(false)
}
</script>

<template>
  <div>
    <PageHeader
      title="Productos"
      subtitle="Aquí verás tu catálogo. Hoy puedes probar con productos de ejemplo; añadir los tuyos llegará en la siguiente versión."
    >
      <template #actions>
        <AppButton v-if="!app.settings?.demoMode" variant="primary" @click="enableDemo">
          Ver ejemplos
        </AppButton>
        <AppButton v-else variant="secondary" @click="disableDemo">
          Quitar ejemplos
        </AppButton>
      </template>
    </PageHeader>

    <EmptyState
      v-if="!app.demoProducts.length"
      title="Todavía no hay productos"
      description="Puedes cargar unos productos de ejemplo para ver cómo funciona el listado y la búsqueda. Están etiquetados como DEMO y no son tu inventario real."
    >
      <template #icon>
        <Package :size="22" />
      </template>
      <template #actions>
        <AppButton variant="primary" @click="enableDemo">Cargar productos de ejemplo</AppButton>
      </template>
    </EmptyState>

    <div v-else class="table-wrap">
      <p class="banner" role="status">
        Estás viendo productos de ejemplo. Quítalos cuando quieras para dejar el listado vacío.
      </p>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th class="num">Precio</th>
            <th class="num">Cantidad</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in app.demoProducts" :key="p.id">
            <td>{{ p.sku }}</td>
            <td>{{ p.name }}</td>
            <td>{{ p.category }}</td>
            <td class="num">{{ formatMoney(p.priceCents) }}</td>
            <td class="num">{{ p.stock }}</td>
            <td><span class="tag">DEMO</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.banner {
  margin: 0 0 var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  background: var(--warning-soft);
  color: var(--warning);
  font-size: 13px;
  font-weight: 600;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-faint);
  background: var(--surface-muted);
  position: sticky;
  top: 0;
}

tbody tr:hover {
  background: var(--bg-elevated);
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--warning-soft);
  color: var(--warning);
  font-size: 11px;
  font-weight: 700;
}
</style>
