<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import PageHeader from '../components/ui/PageHeader.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import { formatMoney } from '../lib/money'
import { createPartialReturn, getSaleDetail, listSales } from '../services/salesService'
import { db } from '../db/database'
import type { Sale, SaleLine } from '../domain/commerce'

const sales = ref<Sale[]>([])
const saleId = ref('')
const lines = ref<SaleLine[]>([])
const remaining = reactive<Record<string, number>>({})
const qty = reactive<Record<string, string>>({})
const reason = ref('Producto defectuoso')
const restock = ref(true)
const error = ref('')
const ok = ref('')
const busy = ref(false)

async function refresh() {
  sales.value = (await listSales()).filter((s) => s.status !== 'returned')
}
onMounted(refresh)

async function loadSale() {
  for (const key of Object.keys(qty)) delete qty[key]
  for (const key of Object.keys(remaining)) delete remaining[key]
  if (!saleId.value) {
    lines.value = []
    return
  }
  const detail = await getSaleDetail(saleId.value)
  const prior = await db.returns.where('saleId').equals(saleId.value).toArray()
  const priorIds = new Set(prior.map((r) => r.id))
  const priorLines = (await db.returnLines.toArray()).filter((l) => priorIds.has(l.returnId))
  const already = new Map<string, number>()
  for (const line of priorLines) {
    already.set(line.saleLineId, (already.get(line.saleLineId) || 0) + line.quantity)
  }
  lines.value = detail.lines
  for (const line of detail.lines) {
    const left = line.quantity - (already.get(line.id) || 0)
    remaining[line.id] = left
    qty[line.id] = '0'
  }
}

watch(saleId, () => {
  error.value = ''
  ok.value = ''
  void loadSale()
})

async function submit() {
  if (busy.value) return
  error.value = ''
  ok.value = ''
  busy.value = true
  try {
    const selected = lines.value
      .map((line) => ({ saleLineId: line.id, quantity: Number(qty[line.id] || 0) }))
      .filter((x) => x.quantity > 0)
    if (!selected.length) throw new Error('Indica cuántas unidades devolver')
    const record = await createPartialReturn({
      saleId: saleId.value,
      reason: reason.value,
      restock: restock.value,
      lines: selected,
    })
    await refresh()
    await loadSale()
    ok.value = `Devolución ${record.number} registrada (${formatMoney(record.totalCents)}).`
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo devolver'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Devoluciones"
      subtitle="Localiza una venta, elige cantidades y registra el reembolso con trazabilidad."
    />
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="ok" class="ok">{{ ok }}</p>

    <label class="field">
      <span>Venta original</span>
      <select v-model="saleId">
        <option value="">Selecciona…</option>
        <option v-for="s in sales" :key="s.id" :value="s.id">
          {{ s.number }} · {{ formatMoney(s.totalCents) }} · {{ s.customerName }}
        </option>
      </select>
    </label>

    <div v-if="lines.length" class="panel">
      <div v-for="line in lines" :key="line.id" class="line">
        <div>
          <strong>{{ line.productName }}</strong>
          <span>
            {{ line.quantity }} ud · {{ formatMoney(line.lineTotalCents) }} · pendientes
            {{ remaining[line.id] ?? 0 }}
          </span>
        </div>
        <label class="qty-field">
          <span>Devolver</span>
          <input
            :id="'q-' + line.id"
            v-model="qty[line.id]"
            type="number"
            min="0"
            :max="remaining[line.id] ?? 0"
            :disabled="(remaining[line.id] ?? 0) <= 0"
          />
        </label>
      </div>
      <AppInput v-model="reason" label="Motivo" id="reason" />
      <label class="check">
        <input v-model="restock" type="checkbox" />
        Devolver producto al inventario
      </label>
      <AppButton variant="primary" :disabled="busy" @click="submit">Registrar devolución</AppButton>
    </div>
  </div>
</template>

<style scoped>
.field, .panel { display:grid; gap: var(--space-3); max-width: 640px; }
.field select { min-height:40px; border:1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); padding:0 10px; }
.line { display:grid; grid-template-columns: 1fr 120px; gap: var(--space-3); align-items:end; border-bottom:1px solid var(--border); padding-bottom: var(--space-3); }
.line span { display:block; color: var(--text-muted); font-size:12px; }
.qty-field { display:flex; flex-direction:column; gap:6px; font-size:13px; font-weight:600; }
.qty-field input { min-height:40px; border:1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); padding:0 10px; }
.check { display:flex; gap:8px; align-items:center; }
.error { color: var(--danger); font-weight:600; }
.ok { color: var(--success); font-weight:600; }
</style>
