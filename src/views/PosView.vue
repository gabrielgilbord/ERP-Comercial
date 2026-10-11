<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../components/ui/PageHeader.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import { formatMoney } from '../lib/money'
import { cartTotals, computeChange } from '../lib/pricing'
import type { CartLine, Customer, Product } from '../domain/commerce'
import {
  catalogSourceLabel,
  findSellableByBarcode,
  listSellableProducts,
  searchSellableProducts,
} from '../services/catalogService'
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
const sourceLabel = ref(catalogSourceLabel())
const searchRef = ref<HTMLInputElement | null>(null)

const totals = computed(() => cartTotals(cart.value))
const receivedCents = computed(() => Math.round(Number(receivedEuros.value.replace(',', '.')) * 100) || 0)
const changeCents = computed(() =>
  payMethod.value === 'cash' ? computeChange(totals.value.totalCents, receivedCents.value) : 0,
)
const visibleProducts = computed(() => (results.value.length ? results.value : products.value.slice(0, 16)))

async function refresh() {
  products.value = await listSellableProducts()
  customers.value = await listCustomers()
  cashOpen.value = !!(await getOpenCashSession())
  sourceLabel.value = catalogSourceLabel()
}
onMounted(async () => {
  await refresh()
  searchRef.value?.focus()
})

watch(query, () => {
  void searchSellableProducts(query.value).then((list) => {
    results.value = list
  })
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
  searchRef.value?.focus()
}

async function onBarcodeEnter() {
  const code = query.value.trim()
  if (!code) return
  const byBarcode = await findSellableByBarcode(code)
  if (byBarcode) {
    addProduct(byBarcode)
    return
  }
  const list = await searchSellableProducts(code)
  results.value = list
  if (list.length === 1) addProduct(list[0])
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

function bumpQty(line: CartLine, delta: number) {
  setQty(line, String(line.quantity + delta))
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
    searchRef.value?.focus()
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
  const linesHtml = data.lines
    .map(
      (l: { name: string; qty: number; total: number }) =>
        `<div class="row"><span>${l.qty}× ${l.name}</span><span>${(l.total / 100).toFixed(2)} €</span></div>`,
    )
    .join('')
  const paymentsHtml = data.payments
    .map((p: { method: string; amount: number; change: number }) => {
      const changeRow = p.change
        ? `<div class="row"><span>Cambio</span><span>${(p.change / 100).toFixed(2)} €</span></div>`
        : ''
      return `<div class="row"><span>${p.method}</span><span>${(p.amount / 100).toFixed(2)} €</span></div>${changeRow}`
    })
    .join('')
  win.document.open()
  win.document.write('<!doctype html><html><head><title>' + data.saleNumber + '</title>')
  win.document.write(
    '<style>body{font-family:ui-monospace,monospace;font-size:12px;padding:12px;width:280px}h1{font-size:14px;margin:0 0 8px}.row{display:flex;justify-content:space-between;margin:4px 0}hr{border:none;border-top:1px dashed #333;margin:8px 0}.muted{color:#555;font-size:10px}</style></head><body>',
  )
  win.document.write('<h1>' + data.companyName + '</h1>')
  win.document.write('<div class="muted">' + (data.taxId || '') + '</div>')
  win.document.write('<div>Ticket ' + data.saleNumber + '</div>')
  win.document.write('<div>' + new Date(data.createdAt).toLocaleString('es-ES') + '</div>')
  win.document.write('<div>Cliente: ' + data.customerName + '</div><hr/>')
  win.document.write(linesHtml + '<hr/>')
  win.document.write(
    '<div class="row"><strong>TOTAL</strong><strong>' +
      (data.total / 100).toFixed(2) +
      ' €</strong></div>',
  )
  win.document.write(paymentsHtml + '<hr/><p class="muted">' + data.disclaimer + '</p>')
  win.document.write('</body></html>')
  win.document.close()
  win.focus()
  win.print()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'F2') {
    e.preventDefault()
    void checkout()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="pos">
    <PageHeader title="TPV" subtitle="Solo vender y cobrar. Los productos se gestionan en el catálogo central.">
      <template #actions>
        <AppButton v-if="!cashOpen" variant="secondary" @click="router.push('/caja')">Abrir caja</AppButton>
        <AppButton variant="secondary" @click="router.push('/productos')">Catálogo</AppButton>
        <AppButton variant="primary" :disabled="busy || !cart.length" @click="checkout">Cobrar (F2)</AppButton>
      </template>
    </PageHeader>

    <p class="source">{{ sourceLabel }} · sin alta de productos aquí</p>
    <p v-if="!cashOpen" class="warn">Abre la caja antes de cobrar.</p>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="message" class="ok">
      {{ message }}
      <AppButton size="sm" variant="secondary" @click="printTicket">Imprimir ticket</AppButton>
    </p>

    <div class="layout">
      <section class="catalog">
        <label class="field">
          <span>Buscar o escanear</span>
          <input
            id="pos-search"
            ref="searchRef"
            v-model="query"
            type="search"
            placeholder="Código de barras, nombre o referencia"
            autocomplete="off"
            @keydown.enter.prevent="onBarcodeEnter"
          />
        </label>

        <div v-if="!products.length" class="empty">
          No hay productos en el catálogo.
          <AppButton size="sm" variant="secondary" @click="router.push('/productos')">Ir a Productos</AppButton>
        </div>
        <div v-else class="chips">
          <button
            v-for="p in visibleProducts"
            :key="p.id"
            type="button"
            class="chip"
            :disabled="p.stock < 1"
            @click="addProduct(p)"
          >
            <strong>{{ p.name }}</strong>
            <span>{{ formatMoney(p.priceCents) }} · stock {{ p.stock }}</span>
          </button>
        </div>
      </section>

      <section class="cart">
        <h2>Cobro</h2>
        <label class="field">
          <span>Cliente</span>
          <select v-model="customerId">
            <option value="">Cliente general</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>

        <div v-if="!cart.length" class="empty">Escanea o toca un producto.</div>
        <ul v-else class="lines">
          <li v-for="line in cart" :key="line.productId">
            <div>
              <strong>{{ line.productName }}</strong>
              <span>{{ formatMoney(line.unitPriceCents) }}</span>
            </div>
            <div class="qty-ops">
              <button type="button" class="qty-btn" @click="bumpQty(line, -1)">−</button>
              <input
                class="qty"
                type="number"
                min="1"
                :value="line.quantity"
                @change="setQty(line, ($event.target as HTMLInputElement).value)"
              />
              <button type="button" class="qty-btn" @click="bumpQty(line, 1)">+</button>
            </div>
            <AppButton size="sm" variant="ghost" @click="removeLine(line.productId)">Quitar</AppButton>
          </li>
        </ul>

        <div class="totals">
          <div class="row total"><span>Total</span><span>{{ formatMoney(totals.totalCents) }}</span></div>
        </div>

        <div class="pay">
          <label class="field">
            <span>Pago</span>
            <select v-model="payMethod">
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta (manual)</option>
            </select>
          </label>
          <AppInput
            v-if="payMethod === 'cash'"
            v-model="receivedEuros"
            label="Recibido (€)"
            id="received"
          />
          <div v-if="payMethod === 'cash'" class="row">
            <span>Cambio</span>
            <strong>{{ formatMoney(changeCents) }}</strong>
          </div>
          <AppButton variant="primary" size="lg" block :disabled="busy || !cart.length" @click="checkout">
            Confirmar cobro
          </AppButton>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.source { color: var(--text-muted); font-size: 13px; margin: 0 0 var(--space-3); }
.layout { display:grid; grid-template-columns: 1.25fr 1fr; gap: var(--space-5); }
.chips { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: var(--space-2); margin-top: var(--space-3); }
.chip { display:flex; flex-direction:column; align-items:flex-start; gap:4px; padding: var(--space-3); border:1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); cursor:pointer; text-align:left; min-height:64px; }
.chip:disabled { opacity:0.45; cursor:not-allowed; }
.chip span { color: var(--text-muted); font-size:12px; }
.cart h2 { font-family: var(--font-sans); font-size:1rem; margin-bottom: var(--space-3); }
.field { display:flex; flex-direction:column; gap:6px; font-weight:600; font-size:13px; margin-bottom: var(--space-3); }
.field select,
.field input { min-height:44px; border:1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); padding:0 10px; font-size:16px; }
.lines { list-style:none; margin:0; padding:0; display:grid; gap: var(--space-2); }
.lines li { display:grid; grid-template-columns: 1fr auto auto; gap: var(--space-2); align-items:center; padding: var(--space-2) 0; border-bottom:1px solid var(--border); }
.lines span { display:block; color: var(--text-muted); font-size:12px; }
.qty-ops { display:flex; align-items:center; gap:4px; }
.qty-btn { width:36px; height:36px; border:1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); cursor:pointer; font-size:18px; }
.qty { min-height:36px; width:52px; border:1px solid var(--border); border-radius: var(--radius-sm); padding:0 6px; background: var(--surface); text-align:center; }
.totals, .pay { margin-top: var(--space-4); }
.row { display:flex; justify-content:space-between; margin:6px 0; }
.total { font-size:1.35rem; font-weight:700; }
.empty { color: var(--text-muted); padding: var(--space-4) 0; display:flex; gap: var(--space-3); align-items:center; flex-wrap:wrap; }
.warn { color: var(--warning); font-weight:600; }
.error { color: var(--danger); font-weight:600; }
.ok { color: var(--success); font-weight:600; display:flex; gap: var(--space-2); align-items:center; flex-wrap:wrap; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .chips { grid-template-columns: 1fr; }
}
</style>
