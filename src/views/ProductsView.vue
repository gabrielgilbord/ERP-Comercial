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
</script>

<template>
  <div>
    <PageHeader
      title="Productos"
      subtitle="En Fase 1 solo se muestran productos de demostración persistidos en IndexedDB. El catálogo real llega en Fase 2."
    >
      <template #actions>
        <AppButton
          v-if="!app.settings?.demoMode"
          variant="primary"
          @click="enableDemo"
        >
          Cargar datos demo
        </AppButton>
        <AppButton v-else variant="secondary" @click="app.toggleDemo(false)">
          Quitar datos demo
        </AppButton>
      </template>
    </PageHeader>

    <EmptyState
      v-if="!app.demoProducts.length"
      title="Todavía no hay productos"
      description="Activa los datos de demostración para probar listados, búsqueda y persistencia local. Están etiquetados como demo y no se mezclan con un catálogo real."
    >
      <template #icon>
        <Package :size="22" />
      </template>
      <template #actions>
        <AppButton variant="primary" @click="enableDemo">Cargar datos demo</AppButton>
      </template>
    </EmptyState>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th class="num">Precio</th>
            <th class="num">Stock demo</th>
            <th>Etiqueta</th>
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
.table-wrap {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  padding: 10px 12px;
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
