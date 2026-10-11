<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../components/ui/PageHeader.vue'
import AppInput from '../components/ui/AppInput.vue'
import AppButton from '../components/ui/AppButton.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import { useAppStore } from '../stores/appStore'
import { useThemeStore } from '../stores/themeStore'
import { resetLocalData } from '../db/database'
import type { ThemeMode } from '../domain/types'

const app = useAppStore()
const theme = useThemeStore()
const router = useRouter()
const saved = ref(false)
const confirmReset = ref(false)
const showAdvanced = ref(false)

const form = reactive({
  name: app.company?.name ?? '',
  tradeName: app.company?.tradeName ?? '',
  taxId: app.company?.taxId ?? '',
  email: app.company?.email ?? '',
  phone: app.company?.phone ?? '',
  address: app.company?.address ?? '',
  city: app.company?.city ?? '',
  postalCode: app.company?.postalCode ?? '',
})

watch(
  () => app.company,
  (company) => {
    if (!company) return
    form.name = company.name
    form.tradeName = company.tradeName
    form.taxId = company.taxId
    form.email = company.email
    form.phone = company.phone
    form.address = company.address
    form.city = company.city
    form.postalCode = company.postalCode
  },
  { immediate: true },
)

async function save() {
  await app.saveCompany({ ...form })
  saved.value = true
  window.setTimeout(() => {
    saved.value = false
  }, 2000)
}

async function onThemeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as ThemeMode
  await theme.setMode(value)
}

async function onDemoToggle(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  await app.toggleDemo(checked)
}

async function doReset() {
  confirmReset.value = false
  await resetLocalData()
  await app.init()
  if (app.settings) theme.initFromSettings(app.settings.theme)
  router.push('/asistente')
}
</script>

<template>
  <div>
    <PageHeader
      title="Configuración"
      subtitle="Datos de tu negocio y preferencias. Todo se guarda en este dispositivo."
    >
      <template #actions>
        <AppButton variant="primary" @click="save">Guardar</AppButton>
      </template>
    </PageHeader>

    <p v-if="saved" class="toast" role="status">Guardado correctamente.</p>

    <section class="section">
      <h2>Tu negocio</h2>
      <div class="form-grid">
        <AppInput
          v-model="form.tradeName"
          label="Nombre del negocio"
          id="trade"
          placeholder="Ej. Ferretería Centro"
        />
        <AppInput v-model="form.name" label="Razón social" id="name" />
        <AppInput v-model="form.phone" label="Teléfono" id="phone" />
        <AppInput v-model="form.email" label="Email" id="email" type="email" />
      </div>
      <button type="button" class="linkish" @click="showAdvanced = !showAdvanced">
        {{ showAdvanced ? 'Ocultar dirección y NIF' : 'Mostrar dirección y NIF' }}
      </button>
      <div v-if="showAdvanced" class="form-grid advanced">
        <AppInput v-model="form.taxId" label="NIF/CIF" id="tax" />
        <AppInput v-model="form.address" label="Dirección" id="address" />
        <AppInput v-model="form.city" label="Ciudad" id="city" />
        <AppInput v-model="form.postalCode" label="Código postal" id="postal" />
      </div>
    </section>

    <section class="section">
      <h2>Preferencias</h2>
      <div class="prefs">
        <label class="pref">
          <span>Aspecto</span>
          <select :value="theme.mode" @change="onThemeChange">
            <option value="system">Como el del dispositivo</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>
        <label class="pref pref--row">
          <input type="checkbox" :checked="!!app.settings?.demoMode" @change="onDemoToggle" />
          <span>
            Usar productos de ejemplo (DEMO).
            <em>No se mezclan con un catálogo real; puedes quitarlos cuando quieras.</em>
          </span>
        </label>
        <AppButton variant="secondary" size="sm" @click="router.push('/asistente')">
          Abrir guía de inicio
        </AppButton>
      </div>
    </section>

    <section class="section danger-zone">
      <h2>Borrar datos de este dispositivo</h2>
      <p>
        Elimina la configuración y los productos de ejemplo guardados aquí. No afecta a otros
        ordenadores o móviles.
      </p>
      <AppButton variant="danger" @click="confirmReset = true">Borrar y empezar de nuevo</AppButton>
    </section>

    <ConfirmDialog
      :open="confirmReset"
      title="¿Borrar los datos de este dispositivo?"
      message="Se eliminarán el nombre del negocio, preferencias y productos de ejemplo. No se puede deshacer."
      confirm-label="Borrar todo"
      danger
      @cancel="confirmReset = false"
      @confirm="doReset"
    />
  </div>
</template>

<style scoped>
.section {
  margin-bottom: var(--space-6);
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--border);
}

.section h2 {
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: var(--space-4);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.advanced {
  margin-top: var(--space-4);
}

.linkish {
  margin-top: var(--space-4);
  border: 0;
  background: transparent;
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.prefs {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: flex-start;
}

.pref {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
}

.pref select {
  max-width: 280px;
  min-height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  padding: 0 10px;
}

.pref--row {
  flex-direction: row;
  align-items: flex-start;
  gap: var(--space-3);
  font-weight: 500;
  max-width: 52ch;
}

.pref--row em {
  display: block;
  margin-top: 4px;
  font-style: normal;
  color: var(--text-muted);
  font-size: 12px;
}

.danger-zone p {
  color: var(--text-muted);
  margin-bottom: var(--space-4);
  max-width: 52ch;
}

.toast {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
