<script setup lang="ts">
defineProps<{
  modelValue: string
  label?: string
  type?: string
  placeholder?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  id?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <label class="field" :for="id">
    <span v-if="label" class="field__label">
      {{ label }}
      <span v-if="required" class="req">*</span>
    </span>
    <input
      class="field__input"
      :id="id"
      :type="type || 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="hint" class="field__hint">{{ hint }}</span>
  </label>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.req {
  color: var(--danger);
}

.field__input {
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  transition: border-color var(--motion-fast);
}

.field__input:hover {
  border-color: var(--border-strong);
}

.field__input:focus {
  border-color: var(--accent);
}

.field__input:disabled {
  opacity: 0.6;
  background: var(--surface-muted);
}

.field__hint {
  font-size: 12px;
  color: var(--text-faint);
}
</style>
