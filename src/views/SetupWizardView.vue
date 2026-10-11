<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import { BUSINESS_TEMPLATES, type BusinessTemplateId } from '../domain/types'
import { useAppStore } from '../stores/appStore'

const app = useAppStore()
const router = useRouter()

const step = ref(app.settings?.setupStep ?? 0)
const saving = ref(false)

const form = reactive({
  name: app.company?.name ?? '',
  tradeName: app.company?.tradeName ?? '',
  taxId: app.company?.taxId ?? '',
  email: app.company?.email ?? '',
  template: (app.company?.businessTemplate ?? null) as BusinessTemplateId | null,
})

watch(
  () => app.settings?.setupStep,
  (value) => {
    if (typeof value === 'number') step.value = value
  },
)

const steps = [
  'Empresa',
  'Plantilla',
  'Importación',
  'Impresora',
  'Tickets',
  'Impuestos',
  'Usuarios',
  'Venta de prueba',
  'Copias y offline',
]

const title = computed(() => steps[step.value] ?? 'Asistente')

async function persistStep(next: number) {
  saving.value = true
  try {
    if (step.value === 0) {
      await app.saveCompany({
        name: form.name,
        tradeName: form.tradeName,
        taxId: form.taxId,
        email: form.email,
      })
    }
    if (step.value === 1 && form.template) {
      await app.saveCompany({ businessTemplate: form.template })
    }
    await app.setSetupStep(next)
    step.value = next
  } finally {
    saving.value = false
  }
}

async function next() {
  if (step.value >= steps.length - 1) {
    await finish()
    return
  }
  await persistStep(step.value + 1)
}

async function back() {
  if (step.value === 0) {
    router.push('/')
    return
  }
  await persistStep(step.value - 1)
}

async function finish() {
  saving.value = true
  try {
    await app.saveCompany({
      name: form.name,
      tradeName: form.tradeName,
      taxId: form.taxId,
      email: form.email,
      businessTemplate: form.template,
    })
    await app.completeSetup()
    router.push('/')
  } finally {
    saving.value = false
  }
}

async function loadDemoAndContinue() {
  await app.toggleDemo(true)
  await next()
}
</script>

<template>
  <div class="wizard">
    <div class="wizard__panel">
      <p class="wizard__brand">Faro</p>
      <div class="wizard__progress" aria-hidden="true">
        <span
          v-for="(label, index) in steps"
          :key="label"
          class="dot"
          :class="{ 'dot--active': index === step, 'dot--done': index < step }"
        />
      </div>
      <p class="wizard__step">Paso {{ step + 1 }} de {{ steps.length }}</p>
      <h1>{{ title }}</h1>

      <div v-if="step === 0" class="block">
        <p>Configura los datos básicos de tu negocio. Se guardan en este dispositivo.</p>
        <div class="form">
          <AppInput v-model="form.name" label="Razón social" id="wiz-name" />
          <AppInput v-model="form.tradeName" label="Nombre comercial" id="wiz-trade" />
          <AppInput v-model="form.taxId" label="NIF/CIF" id="wiz-tax" />
          <AppInput v-model="form.email" label="Email" id="wiz-email" type="email" />
        </div>
      </div>

      <div v-else-if="step === 1" class="block">
        <p>Elige una plantilla. No crea apps distintas: solo valores iniciales del núcleo común.</p>
        <div class="templates">
          <button
            v-for="item in BUSINESS_TEMPLATES"
            :key="item.id"
            type="button"
            class="template"
            :class="{ 'template--active': form.template === item.id }"
            @click="form.template = item.id"
          >
            <strong>{{ item.label }}</strong>
            <span>{{ item.description }}</span>
          </button>
        </div>
      </div>

      <div v-else-if="step === 2" class="block">
        <p>
          La importación CSV/Excel de productos y clientes reales llega en Fase 2. Mientras tanto
          puedes cargar datos demo claramente etiquetados.
        </p>
        <AppButton variant="secondary" @click="loadDemoAndContinue">
          Cargar demo y continuar
        </AppButton>
      </div>

      <div v-else-if="step === 3" class="block">
        <p>
          La configuración de impresora y lector se implementará con la capa nativa (Tauri) en Fase
          3. En esta preview web no se afirma compatibilidad de hardware.
        </p>
      </div>

      <div v-else-if="step === 4" class="block">
        <p>
          El diseñador visual de tickets es prioritario y se construirá de forma real en Fase 3–4.
          Aquí solo reservamos el paso del asistente.
        </p>
      </div>

      <div v-else-if="step === 5" class="block">
        <p>
          Impuestos y facturación fiscal requieren validación normativa (Fase 7). No se activará
          VeriFactu ni se afirmará cumplimiento hasta entonces.
        </p>
      </div>

      <div v-else-if="step === 6" class="block">
        <p>
          Usuarios, roles y permisos granulares se implementan con el núcleo de operaciones. En Fase
          1 el acceso es local sin autenticación multiusuario.
        </p>
      </div>

      <div v-else-if="step === 7" class="block">
        <p>
          La venta de prueba formará parte del TPV transaccional (Fase 3). Todavía no hay cobros ni
          descuentos de stock.
        </p>
      </div>

      <div v-else class="block">
        <p>
          Faro ya persiste datos en IndexedDB y muestra el estado online/offline. Las copias
          recuperables y la cola de sync llegan en Fase 6.
        </p>
        <ul>
          <li>Base local operativa (esta fase)</li>
          <li>Sync remota: no configurada</li>
          <li>Backup automático: pendiente</li>
        </ul>
      </div>

      <div class="wizard__actions">
        <AppButton variant="ghost" :disabled="saving" @click="back">
          {{ step === 0 ? 'Salir' : 'Atrás' }}
        </AppButton>
        <div class="wizard__actions-right">
          <AppButton v-if="step < steps.length - 1" variant="secondary" :disabled="saving" @click="finish">
            Guardar y salir
          </AppButton>
          <AppButton variant="primary" :disabled="saving || (step === 1 && !form.template)" @click="next">
            {{ step === steps.length - 1 ? 'Terminar' : 'Continuar' }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-5);
  background:
    var(--hero-glow),
    var(--bg);
}

.wizard__panel {
  width: min(720px, 100%);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  animation: rise 360ms var(--motion-med) both;
}

.wizard__brand {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--accent);
  margin-bottom: var(--space-4);
}

.wizard__progress {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: var(--space-3);
}

.dot {
  width: 18px;
  height: 6px;
  border-radius: 99px;
  background: var(--border);
}

.dot--active {
  background: var(--accent);
  width: 28px;
}

.dot--done {
  background: color-mix(in srgb, var(--accent) 55%, var(--border));
}

.wizard__step {
  color: var(--text-faint);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-2);
}

.block {
  margin-top: var(--space-4);
  color: var(--text-muted);
}

.block p,
.block ul {
  margin-bottom: var(--space-4);
}

.form {
  display: grid;
  gap: var(--space-3);
}

.templates {
  display: grid;
  gap: var(--space-3);
}

.template {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  cursor: pointer;
  text-align: left;
  transition:
    border-color var(--motion-fast),
    background var(--motion-fast);
}

.template span {
  color: var(--text-muted);
  font-size: 13px;
}

.template--active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.wizard__actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-6);
  flex-wrap: wrap;
}

.wizard__actions-right {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
