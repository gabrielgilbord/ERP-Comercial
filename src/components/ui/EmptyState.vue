<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="empty">
    <div class="empty__icon" aria-hidden="true">
      <slot name="icon" />
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <div v-if="$slots.actions" class="empty__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-6);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, var(--surface) 0%, var(--surface-muted) 100%);
}

.empty__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
}

.empty p {
  max-width: 42ch;
  color: var(--text-muted);
}

.empty__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
</style>
