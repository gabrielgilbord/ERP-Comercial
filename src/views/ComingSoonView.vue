<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Construction } from '@lucide/vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()
</script>

<template>
  <div>
    <PageHeader
      :title="String(route.meta.title || 'Módulo')"
      :subtitle="String(route.meta.summary || '')"
    />
    <EmptyState
      :title="`${route.meta.module || 'Este módulo'} aún no está implementado`"
      :description="`Planificado en ${route.meta.phase || 'una fase posterior'}. No hay datos simulados ni acciones falsas aquí.`"
    >
      <template #icon>
        <Construction :size="22" />
      </template>
      <template #actions>
        <AppButton variant="primary" @click="router.push('/')">Volver al inicio</AppButton>
        <AppButton variant="secondary" @click="router.push('/asistente')">Asistente</AppButton>
      </template>
    </EmptyState>
  </div>
</template>
