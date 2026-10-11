<script setup lang="ts">
import { computed } from 'vue'
import { HardDrive, Wifi, WifiOff } from '@lucide/vue'
import { useConnectivityStore } from '../../stores/connectivityStore'

const connectivity = useConnectivityStore()

const connectionLabel = computed(() =>
  connectivity.online ? 'Con internet' : 'Sin internet · puedes seguir trabajando aquí',
)
</script>

<template>
  <footer class="statusbar" aria-live="polite">
    <div class="statusbar__item">
      <HardDrive :size="14" />
      <span>Guardado en este dispositivo</span>
    </div>
    <div class="statusbar__item" :class="connectivity.online ? 'is-online' : 'is-offline'">
      <Wifi v-if="connectivity.online" :size="14" />
      <WifiOff v-else :size="14" />
      <span>{{ connectionLabel }}</span>
    </div>
    <div v-if="connectivity.pendingOps > 0" class="statusbar__item is-warn">
      <span>{{ connectivity.pendingOps }} cambios pendientes de enviar</span>
    </div>
  </footer>
</template>

<style scoped>
.statusbar {
  position: sticky;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
  align-items: center;
  min-height: var(--statusbar-height);
  padding: 4px var(--space-5);
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.statusbar__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.is-online {
  color: var(--success);
}

.is-offline {
  color: var(--warning);
}

.is-warn {
  color: var(--warning);
}

@media (max-width: 720px) {
  .statusbar {
    padding: 6px var(--space-4);
  }
}
</style>
