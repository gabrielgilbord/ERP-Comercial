<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import AppButton from './AppButton.vue'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onKey(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') emit('cancel')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" role="presentation" @click.self="emit('cancel')">
      <div class="dialog" role="dialog" aria-modal="true" :aria-label="title">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        <div class="dialog__actions">
          <AppButton variant="ghost" @click="emit('cancel')">
            {{ cancelLabel || 'Cancelar' }}
          </AppButton>
          <AppButton :variant="danger ? 'danger' : 'primary'" @click="emit('confirm')">
            {{ confirmLabel || 'Confirmar' }}
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: rgb(10 16 14 / 0.45);
  backdrop-filter: blur(2px);
  animation: fade-in var(--motion-fast);
}

.dialog {
  width: min(420px, 100%);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  animation: rise var(--motion-med);
}

.dialog h2 {
  font-size: 1.25rem;
}

.dialog p {
  margin-top: var(--space-3);
  color: var(--text-muted);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
