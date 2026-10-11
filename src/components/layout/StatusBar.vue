<script setup lang="ts">
import { computed } from 'vue'
import { CloudOff, Cloud, AlertTriangle, DatabaseBackup } from '@lucide/vue'
import { useConnectivityStore } from '../../stores/connectivityStore'

const connectivity = useConnectivityStore()

const syncLabel = computed(() => {
  if (!connectivity.lastSyncAt) return 'Sync remota: no configurada'
  return `Última sync: ${new Date(connectivity.lastSyncAt).toLocaleString('es-ES')}`
})

const backupLabel = computed(() => {
  if (!connectivity.lastBackupAt) return 'Copia: pendiente de configurar'
  return `Copia: ${new Date(connectivity.lastBackupAt).toLocaleString('es-ES')}`
})
</script>

<template>
  <footer class="statusbar" aria-live="polite">
    <div class="statusbar__item" :class="connectivity.online ? 'is-online' : 'is-offline'">
      <Cloud v-if="connectivity.online" :size="14" />
      <CloudOff v-else :size="14" />
      <span>{{ connectivity.statusLabel }}</span>
    </div>
    <div class="statusbar__item">
      <span>{{ syncLabel }}</span>
    </div>
    <div class="statusbar__item">
      <span>Pendientes: {{ connectivity.pendingOps }}</span>
    </div>
    <div v-if="connectivity.conflictCount > 0" class="statusbar__item is-warn">
      <AlertTriangle :size="14" />
      <span>Conflictos: {{ connectivity.conflictCount }}</span>
    </div>
    <div class="statusbar__item">
      <DatabaseBackup :size="14" />
      <span>{{ backupLabel }}</span>
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
