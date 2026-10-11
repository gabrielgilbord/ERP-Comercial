<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, Package, Settings, X } from '@lucide/vue'
import { useAppStore } from '../../stores/appStore'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const router = useRouter()
const app = useAppStore()

const items = computed(() => [
  { to: '/', label: 'Inicio', icon: Home, match: (path: string) => path === '/' },
  {
    to: '/productos',
    label: 'Productos',
    icon: Package,
    match: (path: string) => path.startsWith('/productos'),
  },
  {
    to: '/configuracion',
    label: 'Configuración',
    icon: Settings,
    match: (path: string) => path.startsWith('/configuracion') || path.startsWith('/ajustes'),
  },
])

function go(to: string) {
  router.push(to)
  emit('close')
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': open }" aria-label="Menú principal">
    <div class="sidebar__brand">
      <div class="brand-mark" aria-hidden="true">F</div>
      <div>
        <div class="brand-name">Faro</div>
        <div class="brand-sub">{{ app.companyDisplayName === 'Faro' ? 'Tu negocio' : app.companyDisplayName }}</div>
      </div>
      <button class="sidebar__close" type="button" aria-label="Cerrar menú" @click="emit('close')">
        <X :size="18" />
      </button>
    </div>

    <nav class="sidebar__nav">
      <p class="nav-hint">Qué quieres hacer</p>
      <button
        v-for="item in items"
        :key="item.to"
        type="button"
        class="nav-item"
        :class="{ 'nav-item--active': item.match(route.path) }"
        @click="go(item.to)"
      >
        <component :is="item.icon" :size="18" :stroke-width="1.75" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar__foot">
      <p>Tus datos se guardan en este dispositivo.</p>
    </div>
  </aside>
  <div v-if="open" class="sidebar-backdrop" @click="emit('close')" />
</template>

<style scoped>
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  color: var(--sidebar-text);
  background: var(--sidebar-bg);
  border-right: 1px solid rgb(255 255 255 / 0.06);
  transform: translateX(0);
  transition: transform var(--motion-med);
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--topbar-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.12);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.15rem;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  line-height: 1.1;
}

.brand-sub {
  font-size: 12px;
  color: var(--sidebar-muted);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__close {
  display: none;
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--sidebar-text);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
}

.sidebar__nav {
  flex: 1;
  overflow: auto;
  padding: var(--space-4) var(--space-3);
}

.nav-hint {
  padding: 0 var(--space-3);
  margin: 0 0 var(--space-3);
  font-size: 12px;
  color: var(--sidebar-muted);
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--sidebar-text);
  cursor: pointer;
  text-align: left;
  font-size: 15px;
  transition: background var(--motion-fast);
}

.nav-item:hover {
  background: rgb(255 255 255 / 0.08);
}

.nav-item--active {
  background: var(--sidebar-active);
  font-weight: 600;
}

.sidebar__foot {
  padding: var(--space-4);
  font-size: 12px;
  color: var(--sidebar-muted);
  border-top: 1px solid rgb(255 255 255 / 0.08);
}

.sidebar__foot p {
  margin: 0;
  line-height: 1.4;
}

.sidebar-backdrop {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    transform: translateX(-105%);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar__close {
    display: grid;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 30;
    background: rgb(0 0 0 / 0.4);
  }
}
</style>
