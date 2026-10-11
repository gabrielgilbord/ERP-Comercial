<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    block?: boolean
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    type: 'button',
    disabled: false,
    block: false,
  },
)
</script>

<template>
  <button
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--block': block }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  transition:
    background var(--motion-fast),
    border-color var(--motion-fast),
    color var(--motion-fast),
    transform var(--motion-fast);
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--block {
  width: 100%;
}

.btn--sm {
  min-height: 32px;
  padding: 0 10px;
  font-size: 13px;
}

.btn--md {
  min-height: 38px;
  padding: 0 14px;
}

.btn--lg {
  min-height: 44px;
  padding: 0 18px;
  font-size: 15px;
}

.btn--primary {
  background: var(--accent);
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn--secondary {
  background: var(--surface);
  border-color: var(--border-strong);
  color: var(--text);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--surface-muted);
}

.btn--ghost {
  background: transparent;
  color: var(--text-muted);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--surface-muted);
  color: var(--text);
}

.btn--danger {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: transparent;
}
</style>
