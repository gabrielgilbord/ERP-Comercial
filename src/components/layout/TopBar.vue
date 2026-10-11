<script setup lang="ts">
import { computed } from 'vue'
import { Menu, Moon, Search, Sun } from '@lucide/vue'
import { useThemeStore } from '../../stores/themeStore'
import AppButton from '../ui/AppButton.vue'

defineProps<{ title?: string }>()
const emit = defineEmits<{
  toggleSidebar: []
  openSearch: []
}>()

const theme = useThemeStore()
const isDark = computed(() => theme.resolved === 'dark')

function toggleTheme() {
  theme.setMode(isDark.value ? 'light' : 'dark')
}
</script>

<template>
  <header class="topbar">
    <div class="topbar__left">
      <button class="icon-btn menu-btn" type="button" aria-label="Abrir menú" @click="emit('toggleSidebar')">
        <Menu :size="18" />
      </button>
      <div class="topbar__title">
        <span class="eyebrow">Faro</span>
        <strong>{{ title || 'Inicio' }}</strong>
      </div>
    </div>

    <div class="topbar__actions">
      <button class="search-chip" type="button" @click="emit('openSearch')">
        <Search :size="16" />
        <span>Buscar</span>
        <kbd aria-hidden="true">Ctrl K</kbd>
      </button>
      <AppButton
        variant="ghost"
        size="sm"
        :aria-label="isDark ? 'Usar modo claro' : 'Usar modo oscuro'"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" :size="16" />
        <Moon v-else :size="16" />
      </AppButton>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: var(--topbar-height);
  padding: 0 var(--space-5);
  background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.topbar__left,
.topbar__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.icon-btn {
  display: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
}

.eyebrow {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}

.topbar__title strong {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 550;
}

.search-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
}

.search-chip kbd {
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

@media (max-width: 900px) {
  .icon-btn {
    display: grid;
  }

  .search-chip span,
  .search-chip kbd {
    display: none;
  }

  .topbar {
    padding: 0 var(--space-4);
  }
}
</style>
