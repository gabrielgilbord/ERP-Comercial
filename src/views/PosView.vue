<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../components/ui/PageHeader.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import { formatMoney } from '../lib/money'
import { cartTotals, computeChange } from '../lib/pricing'
import type { CartLine, Customer, Product } from '../domain/commerce'
import { findProductByBarcode, listProducts, searchProducts } from '../services/inventoryService'
import { listCustomers } from '../services/contactsService'
import { completeSale } from '../services/salesService'
import { getOpenCashSession } from '../services/cashService'
import { createIdempotencyKey } from '../domain/ids'

const router = useRouter()
const products = ref<Product[]>([])
const customers = ref<Customer[]>([])
const cart = ref<CartLine[]>([])
const query = ref('')
const results = ref<Product[]>([])
const customerId = ref('')
const payMethod = ref<'cash' | 'card'>('cash')
const receivedEuros = ref('')
const message = ref('')
const error = ref('')
const lastTicket = ref('')
const cashOpen = ref(false)
const busy = ref(false)
const lastIdempotency = ref('')

const totals = computed(() => cartTotals(cart.value))
const receivedCents = computed(() => Math.round(Number(receivedEuros.value.replace(',', '.')) * 100) || 0)
const changeCents = computed(() =>
  payMethod.value === 'cash' ? computeChange(totals.value.totalCents, receivedCents.value) : 0,
)

async function refresh() {
  products.value = await listProducts()
  customers.value = await listCustomers()
  cashOpen.value = !!(await getOpenCashSession())
}
onMounted(refresh)

async function onSearch() {
  results.value = await searchProducts(query.value)
}

watch(query, () => {
  void onSearch()
})

function addProduct(product: Product) {
  error.value = ''
  const existing = cart.value.find((l) => l.productId === product.id)
  if (existing) {
    if (existing.quantity + 1 > product.stock) {
      error.value = `Stock insuficiente (${product.stock} ud.)`
      return
    }
    existing.quantity += 1
  } else {
    if (product.stock < 1) {
      error.value = `Sin stock: ${product.name}`
      return
    }
    cart.value.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode,
      quantity: 1,
      unitPriceCents: product.priceCents,
      taxPercent: product.taxPercent,
      discountPercent: 0,
      stockAvailable: product.stock,
    })
  }
  query.value = ''
  results.value = []
}

async function onBarcodeEnter() {
  const code = query.value.trim()
  if (!code) return
  const byBarcode = await findProductByBarcode(code)
  if (byBarcode) {
    addProduct(byBarcode)
    return
  }
  await onSearch()
  if (results.value.length === 1) addProduct(results.value[0])
}

function setQty(line: CartLine, value: string) {
  const qty = Number(value)
  if (!Number.isFinite(qty) || qty < 1) return
  if (qty > line.stockAvailable) {
    error.value = `Máximo ${line.stockAvailable} ud. de ${line.productName}`
    return
  }
  line.quantity = qty
}

function removeLine(productId: string) {
  cart.value = cart.value.filter((l) => l.productId !== productId)
}

async function checkout() {
  if (busy.value) return
  error.value = ''
  message.value = ''
  if (!cart.value.length) {
    error.value = 'Añade productos al carrito'
    return
  }
  if (!cashOpen.value) {
    error.value = 'Abre la caja antes de cobrar'
    return
  }
  if (payMethod.value === 'cash' && receivedCents.value < totals.value.totalCents) {
    error.value = 'El efectivo recibido es insuficiente'
    return
  }

  busy.value = true
  const key = lastIdempotency.value || createIdempotencyKey()
  lastIdempotency.value = key
  try {
    const result = await completeSale({
      lines: cart.value.map((l) => ({ ...l })),
      customerId: customerId.value || null,
      payments: [
        {
          method: payMethod.value,
          amountCents: totals.value.totalCents,
          receivedCents: payMethod.value === 'cash' ? receivedCents.value : totals.value.totalCents,
        },
      ],
      idempotencyKey: key,
    })
    lastTicket.value = result.document.payloadJson
    message.value = `Venta ${result.sale.number} cobrada. Ticket ${result.document.number}.`
    cart.value = []
    receivedEuros.value = ''
    lastIdempotency.value = ''
    await refresh()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo completar la venta'
  } finally {
    busy.value = false
  }
}

function printTicket() {
  if (!lastTicket.value) return
  const data = JSON.parse(lastTicket.value)
  const win = window.open('', '_blank', 'width=360,height=640')
  if (!win) return
  win.document.write(`<!doctype html><html><head><title>${data.saleNumber}</title>
  <style>
  body{font-family:ui-monospace,monospace;font-size:12px;padding:12px;width:280px}
  h1{font-size:14px;margin:0 0 8px} .row{display:flex;justify-content:space-between;margin:4px 0}
  hr{border:none;border-top:1px dashed #333;margin:8px 0} .muted{color:#555;font-size:10px}
  </style></head><body>
  <h1>${data.companyName}</h1>
  <div class="muted">${data.taxId || ''}</div>
  <div>Ticket ${data.saleNumber}</div>
  <div>${new Date(data.createdAt).toLocaleString('es-ES')}</div>
  <div>Cliente: ${data.customerName}</div>
  <hr/>
  ${data.lines.map((l: { name: string; qty: number; total: number }) => `<div class="row"><span>${l.qty}× ${l.name}</span><span>${(l.total / 100).toFixed(2)} €</span></div>`).join('')}
  <hr/>
  <div class="row"><strong>TOTAL</strong><strong>${(data.total / 100).toFixed(2)} €</strong></div>
  ${data.payments.map((p: { method: string; amount: number; change: number }) => `<div class="row"><span>${p.method}</span><span>${(p.amount / 100).toFixed(2)} €</span></div>${p.change ? `<div class="row"><span>Cambio</span><span>${(p.change / 100).toFixed(2)} €</span></div>` : ''}`).join('')}
  <hr/><p class="muted">${data.disclaimer}</p>
  <script>window.print()<\/script></body></html>`)
  win.document.close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'F2') {
    e.preventDefault()
    checkout()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="pos">
    <PageHeader title="TPV" subtitle="Busca, escanea, cobra. Atajo: F2 para cobrar.">
      <template #actions>
        <AppButton v-if="!cashOpen" variant="secondary" @click="router.push('/caja')">Abrir caja</AppButton>
        <AppButton variant="primary" :disabled="busy || !cart.length" @click="checkout">Cobrar (F2)</AppButton>
      </template>
    </PageHeader>

    <p v-if="!cashOpen" class="warn">La caja está cerrada. Ábrela antes de cobrar para registrar el efectivo.</p>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="message" class="ok">
      {{ message }}
      <AppButton size="sm" variant="secondary" @click="printTicket">Imprimir / PDF</AppButton>
    </p>

    <div class="layout">
      <section class="catalog">
        <label class="field">
          <span>Buscar o escanear código</span>
          <input
            id="pos-search"
            v-model="query"
            type="search"
            placeholder="Nombre, referencia o código de barras"
            @keydown.enter.prevent="onBarcodeEnter"
          />
        </label>
        <div class="chips">
          <button
            v-for="p in results.length ? results : products.slice(0, 12)"
            :key="p.id"
            type="button"
            class="chip"
            @click="addProduct(p)"
          >
            <strong>{{ p.name }}</strong>
            <span>{{ formatMoney(p.priceCents) }} · stock {{ p.stock }}</span>
          </button>
        </div>
      </section>

      <section class="cart">
        <h2>Carrito</h2>
        <label class="field">
          <span>Cliente</span>
          <select v-model="customerId">
            <option value="">Cliente general</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>

        <div v-if="!cart.length" class="empty">Añade productos para empezar la venta.</div>
        <ul v-else class="lines">
          <li v-for="line in cart" :key="line.productId">
            <div>
              <strong>{{ line.productName }}</strong>
              <span>{{ formatMoney(line.unitPriceCents) }}</span>
            </div>
            <input
              class="qty"
              type="number"
              min="1"
              :value="line.quantity"
              @change="setQty(line, ($event.target as HTMLInputElement).value)"
            />
            <AppButton size="sm" variant="ghost" @click="removeLine(line.productId)">Quitar</AppButton>
          </li>
        </ul>

        <div class="totals">
          <div class="row"><span>Base</span><span>{{ formatMoney(totals.subtotalCents) }}</span></div>
          <div class="row"><span>IVA</span><span>{{ formatMoney(totals.taxCents) }}</span></div>
          <div class="row total"><span>Total</span><span>{{ formatMoney(totals.totalCents) }}</span></div>
        </div>

        <div class="pay">
          <label class="field">
            <span>Método de pago</span>
            <select v-model="payMethod">
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta (registro manual)</option>
            </select>
          </label>
          <p v-if="payMethod === 'card'" class="hint">
            Se registra el cobro manualmente. No hay confirmación de datáfono.
          </p>
          <AppInput
            v-if="payMethod === 'cash'"
            v-model="receivedEuros"
            label="Efectivo recibido (€)"
            id="received"
          />
          <div v-if="payMethod === 'cash'" class="row">
            <span>Cambio</span>
            <strong>{{ formatMoney(changeCents) }}</strong>
          </div>
          <AppButton variant="primary" size="lg" block :disabled="busy" @click="checkout">
            Confirmar cobro
          </AppButton>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.layout { display:grid; grid-template-columns: 1.2fr 1fr; gap: var(--space-5); }
.catalog, .cart { min-width: 0; }
.chips { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: var(--space-2); margin-top: var(--space-3); }
.chip { display:flex; flex-direction:column; align-items:flex-start; gap:4px; padding: var(--space-3); border:1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); cursor:pointer; text-align:left; }
.chip span { color: var(--text-muted); font-size:12px; }
.cart h2 { font-family: var(--font-sans); font-size:1rem; margin-bottom: var(--space-3); }
.field { display:flex; flex-direction:column; gap:6px; font-weight:600; font-size:13px; margin-bottom: var(--space-3); }
.field select,
.field input { min-height:40px; border:1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); padding:0 10px; }
.lines { list-style:none; margin:0; padding:0; display:grid; gap: var(--space-2); }
.lines li { display:grid; grid-template-columns: 1fr 64px auto; gap: var(--space-2); align-items:center; padding: var(--space-2) 0; border-bottom:1px solid var(--border); }
.lines span { display:block; color: var(--text-muted); font-size:12px; }
.qty { min-height:36px; width:64px; border:1px solid var(--border); border-radius: var(--radius-sm); padding:0 8px; background: var(--surface); }
.totals, .pay { margin-top: var(--space-4); }
.row { display:flex; justify-content:space-between; margin:6px 0; }
.total { font-size:1.15rem; font-weight:700; }
.empty { color: var(--text-muted); padding: var(--space-4) 0; }
.warn { color: var(--warning); font-weight:600; }
.error { color: var(--danger); font-weight:600; }
.ok { color: var(--success); font-weight:600; display:flex; gap: var(--space-2); align-items:center; flex-wrap:wrap; }
.hint { color: var(--text-faint); font-size:12px; margin:0 0 var(--space-3); }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .chips { grid-template-columns: 1fr; }
}
</style>
