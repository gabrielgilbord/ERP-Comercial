<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, Circle } from '@lucide/vue'
import AppButton from '../components/ui/AppButton.vue'
import { useAppStore } from '../stores/appStore'
import { listProducts } from '../services/inventoryService'
import { getOpenCashSession } from '../services/cashService'
import { listSales } from '../services/salesService'

const app = useAppStore()
const router = useRouter()
const productCount = ref(0)
const salesCount = ref(0)
const cashOpen = ref(false)

onMounted(async () => {
  productCount.value = (await listProducts()).length
  salesCount.value = (await listSales()).length
  cashOpen.value = !!(await getOpenCashSession())
})

const businessName = computed(() => app.company?.tradeName || app.company?.name || '')

const checklist = computed(() => [
  { done: !!businessName.value.trim(), label: businessName.value ? `Negocio: ${businessName.value}` : 'Configura el nombre del negocio' },
  { done: productCount.value > 0, label: productCount.value ? `${productCount.value} productos` : 'Crea tu primer producto' },
  { done: cashOpen.value, label: cashOpen.value ? 'Caja abierta' : 'Abre la caja para cobrar' },
  { done: salesCount.value > 0, label: salesCount.value ? `${salesCount.value} ventas registradas` : 'Aún no hay ventas' },
])
</script>

<template>
  <div class="home">
    <section class="hero">
      <p class="hero__brand">Faro</p>
      <h1>{{ businessName ? `Hola, ${businessName}` : 'Tu TPV y gestión comercial' }}</h1>
      <p class="hero__lead">
        Crea productos, recibe mercancía, vende en el TPV, cobra y cierra caja. Todo queda guardado
        en este dispositivo.
      </p>
      <div class="hero__cta">
        <AppButton variant="primary" size="lg" @click="router.push('/tpv')">Ir al TPV</AppButton>
        <AppButton variant="secondary" size="lg" @click="router.push('/productos')">Productos</AppButton>
      </div>
    </section>

    <section class="section">
      <h2>Empezar a trabajar</h2>
      <ul class="action-list">
        <li><button type="button" @click="router.push('/productos')"><strong>1. Crear productos</strong><span>Nombre, precio, IVA y stock inicial.</span></button></li>
        <li><button type="button" @click="router.push('/proveedores')"><strong>2. Añadir proveedor y comprar</strong><span>Recibe mercancía para aumentar stock.</span></button></li>
        <li><button type="button" @click="router.push('/caja')"><strong>3. Abrir caja</strong><span>Indica el efectivo inicial del día.</span></button></li>
        <li><button type="button" @click="router.push('/tpv')"><strong>4. Vender y cobrar</strong><span>Busca, añade al carrito y confirma el cobro.</span></button></li>
      </ul>
    </section>

    <section class="section">
      <h2>Estado</h2>
      <ul class="checklist">
        <li v-for="item in checklist" :key="item.label">
          <CheckCircle2 v-if="item.done" class="ok" :size="18" />
          <Circle v-else class="pending" :size="18" />
          <span>{{ item.label }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hero { padding: var(--space-5) 0 var(--space-6); border-bottom: 1px solid var(--border); }
.hero__brand { font-family: var(--font-display); font-size: clamp(2.6rem, 5vw, 3.8rem); line-height: 1; color: var(--accent); margin-bottom: var(--space-3); }
.hero__lead { margin-top: var(--space-3); max-width: 48ch; color: var(--text-muted); font-size: 1.05rem; }
.hero__cta { display:flex; flex-wrap:wrap; gap: var(--space-3); margin-top: var(--space-5); }
.section { padding: var(--space-5) 0; border-bottom: 1px solid var(--border); }
.section h2 { font-family: var(--font-display); font-size: 1.35rem; margin-bottom: var(--space-4); }
.action-list, .checklist { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap: var(--space-2); }
.action-list button { width:100%; display:flex; flex-direction:column; align-items:flex-start; gap:4px; padding: var(--space-4) 0; border:0; border-bottom:1px solid var(--border); background:transparent; cursor:pointer; text-align:left; }
.action-list span { color: var(--text-muted); font-size:13px; }
.checklist li { display:flex; align-items:center; gap: var(--space-3); }
.ok { color: var(--success); }
.pending { color: var(--text-faint); }
</style>
