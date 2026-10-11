<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppInput from '../components/ui/AppInput.vue'
import { Truck } from '@lucide/vue'
import type { Supplier } from '../domain/commerce'
import { listSuppliers, upsertSupplier } from '../services/contactsService'

const suppliers = ref<Supplier[]>([])
const showForm = ref(false)
const error = ref('')
const form = ref({ name: '', phone: '', email: '', taxId: '' })

async function refresh() {
  suppliers.value = await listSuppliers()
}
onMounted(refresh)

async function save() {
  error.value = ''
  try {
    if (!form.value.name.trim()) throw new Error('El nombre es obligatorio')
    await upsertSupplier({
      name: form.value.name.trim(),
      phone: form.value.phone,
      email: form.value.email,
      taxId: form.value.taxId,
      address: '',
      notes: '',
    })
    showForm.value = false
    form.value = { name: '', phone: '', email: '', taxId: '' }
    await refresh()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al guardar'
  }
}
</script>

<template>
  <div>
    <PageHeader title="Proveedores" subtitle="Necesarios para registrar compras y recepciones de mercancía.">
      <template #actions>
        <AppButton variant="primary" @click="showForm = !showForm">Nuevo proveedor</AppButton>
      </template>
    </PageHeader>

    <div v-if="showForm" class="form-panel">
      <p v-if="error" class="error">{{ error }}</p>
      <div class="grid">
        <AppInput v-model="form.name" label="Nombre" id="s-name" required />
        <AppInput v-model="form.phone" label="Teléfono" id="s-phone" />
        <AppInput v-model="form.email" label="Email" id="s-email" />
        <AppInput v-model="form.taxId" label="NIF/CIF" id="s-tax" />
      </div>
      <div class="actions">
        <AppButton variant="ghost" @click="showForm = false">Cancelar</AppButton>
        <AppButton variant="primary" @click="save">Guardar</AppButton>
      </div>
    </div>

    <EmptyState
      v-if="!suppliers.length"
      title="Sin proveedores"
      description="Crea un proveedor antes de registrar una compra."
    >
      <template #icon><Truck :size="22" /></template>
      <template #actions>
        <AppButton variant="primary" @click="showForm = true">Crear proveedor</AppButton>
      </template>
    </EmptyState>

    <ul v-else class="list">
      <li v-for="s in suppliers" :key="s.id">
        <strong>{{ s.name }}</strong>
        <span>{{ s.phone || s.email || 'Sin contacto' }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.form-panel { margin-bottom: var(--space-5); padding-bottom: var(--space-5); border-bottom: 1px solid var(--border); }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: var(--space-3); }
.actions { display:flex; gap: var(--space-2); justify-content:flex-end; margin-top: var(--space-4); }
.error { color: var(--danger); }
.list { list-style:none; margin:0; padding:0; }
.list li { display:flex; flex-direction:column; gap:2px; padding: var(--space-3) 0; border-bottom: 1px solid var(--border); }
.list span { color: var(--text-muted); font-size: 13px; }
@media (max-width:720px){ .grid{ grid-template-columns:1fr; } }
</style>
