<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Clock3 } from '@lucide/vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import AppButton from '../components/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()
</script>

<template>
  <div>
    <PageHeader
      :title="String(route.meta.title || 'Próximamente')"
      :subtitle="String(route.meta.summary || '')"
    />
    <EmptyState
      :title="String(route.meta.headline || 'Esta función aún no está disponible')"
      :description="String(route.meta.nextHint || 'Vuelve al inicio para ver qué puedes hacer hoy.')"
    >
      <template #icon>
        <Clock3 :size="22" />
      </template>
      <template #actions>
        <AppButton variant="primary" @click="router.push('/')">Ir al inicio</AppButton>
        <AppButton variant="secondary" @click="router.push('/productos')">Ver productos</AppButton>
      </template>
    </EmptyState>
  </div>
</template>
