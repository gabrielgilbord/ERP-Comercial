<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '../components/ui/PageHeader.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import { formatMoney } from '../lib/money'
import {
  closeCashSession,
  getOpenCashSession,
  listCashSessions,
  openCashSession,
  summarizeCash,
} from '../services/cashService'
import type { CashSession } from '../domain/commerce'

const openSession = ref<CashSession | null>(null)
const sessions = ref<CashSession[]>([])
const opening = ref('100')
const counted = ref('')
const summaryText = ref('')
const error = ref('')
const summary = ref<Awaited<ReturnType<typeof summarizeCash>> | null>(null)

async function refresh() {
  openSession.value = (await getOpenCashSession()) || null
  sessions.value = await listCashSessions()
  if (openSession.value) {
    summary.value = await summarizeCash(openSession.value.id)
  } else {
    summary.value = null
  }
}
onMounted(refresh)

async function openBox() {
  error.value = ''
  try {
    const cents = Math.round(Number(opening.value.replace(',', '.')) * 100)
    if (!Number.isFinite(cents) || cents < 0) throw new Error('Importe de apertura inválido')
    await openCashSession(cents)
    summaryText.value = 'Caja abierta'
    await refresh()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo abrir'
  }
}

async function closeBox() {
  error.value = ''
  try {
    if (!openSession.value) throw new Error('No hay caja abierta')
    const cents = Math.round(Number(counted.value.replace(',', '.')) * 100)
    if (!Number.isFinite(cents) || cents < 0) throw new Error('Efectivo contado inválido')
    const result = await closeCashSession(openSession.value.id, cents)
    summaryText.value = `Caja cerrada. Diferencia: ${formatMoney(result.session.differenceCents || 0)}`
    counted.value = ''
    await refresh()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cerrar'
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Caja"
      subtitle="Apertura, movimientos de cobro y cierre con diferencia. El efectivo no se confunde con tarjeta."
    />

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="summaryText" class="ok">{{ summaryText }}</p>

    <section v-if="!openSession" class="panel">
      <h2>Abrir caja</h2>
      <AppInput v-model="opening" label="Efectivo inicial (€)" id="open" />
      <AppButton variant="primary" @click="openBox">Abrir caja</AppButton>
    </section>

    <section v-else class="panel">
      <h2>Caja abierta</h2>
      <p>Desde {{ new Date(openSession.openedAt).toLocaleString('es-ES') }}</p>
      <ul v-if="summary" class="stats">
        <li><span>Efectivo inicial</span><strong>{{ formatMoney(summary.openingCents) }}</strong></li>
        <li><span>Ventas efectivo</span><strong>{{ formatMoney(summary.cashSalesCents) }}</strong></li>
        <li><span>Ventas tarjeta</span><strong>{{ formatMoney(summary.cardSalesCents) }}</strong></li>
        <li><span>Devoluciones</span><strong>{{ formatMoney(summary.refundsCents) }}</strong></li>
        <li><span>Efectivo esperado</span><strong>{{ formatMoney(summary.expectedCashCents) }}</strong></li>
      </ul>
      <AppInput v-model="counted" label="Efectivo contado (€)" id="counted" />
      <AppButton variant="primary" @click="closeBox">Cerrar caja</AppButton>
    </section>

    <section class="panel">
      <h2>Historial</h2>
      <table v-if="sessions.length">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Apertura</th>
            <th class="num">Inicial</th>
            <th class="num">Contado</th>
            <th class="num">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sessions" :key="s.id">
            <td>{{ s.status === 'open' ? 'Abierta' : 'Cerrada' }}</td>
            <td>{{ new Date(s.openedAt).toLocaleString('es-ES') }}</td>
            <td class="num">{{ formatMoney(s.openingCents) }}</td>
            <td class="num">{{ s.countedCents == null ? '—' : formatMoney(s.countedCents) }}</td>
            <td class="num">{{ s.differenceCents == null ? '—' : formatMoney(s.differenceCents) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">Aún no hay sesiones de caja.</p>
    </section>
  </div>
</template>

<style scoped>
.panel { padding: var(--space-5) 0; border-bottom: 1px solid var(--border); display:grid; gap: var(--space-3); max-width: 560px; }
.panel h2 { font-family: var(--font-sans); font-size: 1rem; }
.stats { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
.stats li { display:flex; justify-content:space-between; }
.error { color: var(--danger); font-weight:600; }
.ok { color: var(--success); font-weight:600; }
.muted { color: var(--text-muted); }
table { width:100%; border-collapse:collapse; font-size:13px; }
th, td { padding:8px; border-bottom:1px solid var(--border); text-align:left; }
.num { text-align:right; font-variant-numeric: tabular-nums; }
</style>
