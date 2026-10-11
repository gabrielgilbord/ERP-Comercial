<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@lucide/vue'
import { searchLocal } from '../../db/repositories'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const query = ref('')
const results = ref<Awaited<ReturnType<typeof searchLocal>>>([])
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.open,
  async (open) => {
    if (open) {
      query.value = ''
      results.value = []
      await nextTick()
      inputRef.value?.focus()
    }
  },
)

watch(query, async (value) => {
  results.value = await searchLocal(value)
})

function select(item: (typeof results.value)[number]) {
  if (item.kind === 'company') router.push('/configuracion')
  else router.push('/productos')
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="search-overlay" @click.self="emit('close')" @keydown="onKey">
      <div class="search-panel" role="dialog" aria-label="Búsqueda global">
        <div class="search-panel__input">
          <Search :size="18" />
          <input
            ref="inputRef"
            v-model="query"
            type="search"
            placeholder="Buscar un producto o tu negocio…"
            aria-label="Buscar"
          />
          <kbd>Esc</kbd>
        </div>
        <ul v-if="results.length" class="search-panel__results">
          <li v-for="item in results" :key="item.id">
            <button type="button" @click="select(item)">
              <strong>{{ item.title }}</strong>
              <span>{{ item.subtitle }}</span>
            </button>
          </li>
        </ul>
        <p v-else-if="query.trim()" class="search-panel__empty">No encontramos nada con ese texto.</p>
        <p v-else class="search-panel__empty">
          Escribe el nombre de un producto de ejemplo o el de tu negocio.
        </p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  justify-content: center;
  padding: 12vh var(--space-4) var(--space-4);
  background: rgb(10 16 14 / 0.4);
  backdrop-filter: blur(2px);
}

.search-panel {
  width: min(560px, 100%);
  max-height: min(70vh, 520px);
  overflow: auto;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  animation: rise var(--motion-med);
}

.search-panel__input {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
}

.search-panel__input input {
  flex: 1;
  border: 0;
  background: transparent;
  min-height: 28px;
}

.search-panel__input input:focus {
  outline: none;
  box-shadow: none;
}

kbd {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border);
  color: var(--text-faint);
}

.search-panel__results {
  list-style: none;
  margin: 0;
  padding: var(--space-2);
}

.search-panel__results button {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--space-3);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.search-panel__results button:hover {
  background: var(--surface-muted);
}

.search-panel__results span {
  font-size: 12px;
  color: var(--text-muted);
}

.search-panel__empty {
  padding: var(--space-5);
  color: var(--text-muted);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
