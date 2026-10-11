<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import { BUSINESS_TEMPLATES, type BusinessTemplateId, type ThemeMode } from '../domain/types'
import { useAppStore } from '../stores/appStore'
import { useThemeStore } from '../stores/themeStore'

const TOTAL_STEPS = 5

const app = useAppStore()
const theme = useThemeStore()
const router = useRouter()

const step = ref(clampStep(app.settings?.setupStep ?? 0))
const saving = ref(false)
const showAdvanced = ref(false)

const form = reactive({
  name: app.company?.name ?? '',
  tradeName: app.company?.tradeName ?? '',
  taxId: app.company?.taxId ?? '',
  email: app.company?.email ?? '',
  template: (app.company?.businessTemplate ?? null) as BusinessTemplateId | null,
  wantDemo: !!app.settings?.demoMode,
})

watch(
  () => app.settings?.setupStep,
  (value) => {
    if (typeof value === 'number') step.value = clampStep(value)
  },
)

const steps = [
  'Tu negocio',
  'Tipo de comercio',
  'Productos de ejemplo',
  'Aspecto',
  'Listo',
]

const title = computed(() => steps[step.value] ?? 'Empezar')

function clampStep(value: number) {
  if (Number.isNaN(value) || value < 0) return 0
  return Math.min(value, TOTAL_STEPS - 1)
}

async function persistStep(next: number) {
  saving.value = true
  try {
    if (step.value === 0) {
      await app.saveCompany({
        name: form.name,
        tradeName: form.tradeName || form.name,
        taxId: form.taxId,
        email: form.email,
      })
    }
    if (step.value === 1 && form.template) {
      await app.saveCompany({ businessTemplate: form.template })
    }
    if (step.value === 2) {
      await app.toggleDemo(form.wantDemo)
    }
    await app.setSetupStep(clampStep(next))
    step.value = clampStep(next)
  } finally {
    saving.value = false
  }
}

async function next() {
  if (step.value >= TOTAL_STEPS - 1) {
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
      tradeName: form.tradeName || form.name,
      taxId: form.taxId,
      email: form.email,
      businessTemplate: form.template,
    })
    await app.toggleDemo(form.wantDemo)
    await app.completeSetup()
    router.push('/')
  } finally {
    saving.value = false
  }
}

async function onThemeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as ThemeMode
  await theme.setMode(value)
}

const canContinue = computed(() => {
  if (step.value === 0) return form.name.trim().length > 0 || form.tradeName.trim().length > 0
  if (step.value === 1) return !!form.template
  return true
})
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
        <p>
          Empieza por cómo quieres que aparezca tu negocio. Se guarda solo en este dispositivo.
          Ejemplo: «Panadería La Espiga».
        </p>
        <div class="form">
          <AppInput
            v-model="form.tradeName"
            label="Nombre del negocio"
            id="wiz-trade"
            placeholder="Ej. Panadería La Espiga"
            required
          />
          <AppInput
            v-model="form.name"
            label="Razón social (si es distinta)"
            id="wiz-name"
            placeholder="Opcional"
            hint="Si no la tienes a mano, puedes dejarla para después."
          />
          <button type="button" class="linkish" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? 'Ocultar datos opcionales' : 'Añadir NIF y email (opcional)' }}
          </button>
          <template v-if="showAdvanced">
            <AppInput v-model="form.taxId" label="NIF/CIF" id="wiz-tax" />
            <AppInput v-model="form.email" label="Email" id="wiz-email" type="email" />
          </template>
        </div>
      </div>

      <div v-else-if="step === 1" class="block">
        <p>Elige la opción más parecida. No bloquea nada: solo nos ayuda a preparar Faro para ti.</p>
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
          ¿Quieres ver Faro con productos de ejemplo? Están marcados como DEMO. Puedes quitarlos
          cuando quieras. La importación de tu CSV real llegará más adelante: no la simulamos.
        </p>
        <button
          type="button"
          class="choice"
          :class="{ 'choice--active': form.wantDemo }"
          @click="form.wantDemo = true"
        >
          <strong>Sí, cargar ejemplos</strong>
          <span>Café, agua, material de papelería… para probar listados y búsqueda.</span>
        </button>
        <button
          type="button"
          class="choice"
          :class="{ 'choice--active': !form.wantDemo }"
          @click="form.wantDemo = false"
        >
          <strong>No, empezar vacío</strong>
          <span>Verás la pantalla de productos sin datos hasta que añadas los tuyos.</span>
        </button>
      </div>

      <div v-else-if="step === 3" class="block">
        <p>Elige el aspecto. Puedes cambiarlo luego en Configuración.</p>
        <label class="pref">
          <span>Tema de la pantalla</span>
          <select :value="theme.mode" @change="onThemeChange">
            <option value="system">Como el del dispositivo</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>
      </div>

      <div v-else class="block">
        <p>Con esto ya puedes moverte por Faro con tranquilidad.</p>
        <ul class="ready-list">
          <li><strong>Disponible hoy:</strong> configuración del negocio, productos de ejemplo y búsqueda.</li>
          <li><strong>Todavía no:</strong> cobros, stock real, clientes, tickets e informes.</li>
          <li><strong>Tus datos:</strong> se guardan en este dispositivo; puedes volver más tarde.</li>
        </ul>
      </div>

      <div class="wizard__actions">
        <AppButton variant="ghost" :disabled="saving" @click="back">
          {{ step === 0 ? 'Salir' : 'Atrás' }}
        </AppButton>
        <div class="wizard__actions-right">
          <AppButton
            v-if="step < steps.length - 1"
            variant="secondary"
            :disabled="saving"
            @click="finish"
          >
            Guardar y salir
          </AppButton>
          <AppButton variant="primary" :disabled="saving || !canContinue" @click="next">
            {{ step === steps.length - 1 ? 'Empezar a usar Faro' : 'Continuar' }}
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

.block > p {
  margin-bottom: var(--space-4);
}

.form {
  display: grid;
  gap: var(--space-3);
}

.linkish {
  border: 0;
  background: transparent;
  color: var(--accent);
  font-weight: 600;
  text-align: left;
  padding: 0;
  cursor: pointer;
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

.choice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  cursor: pointer;
  text-align: left;
  color: var(--text-muted);
}

.choice strong {
  color: var(--text);
}

.choice--active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.pref {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 600;
  color: var(--text);
}

.pref select {
  max-width: 280px;
  min-height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  padding: 0 10px;
}

.ready-list {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: var(--space-3);
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
