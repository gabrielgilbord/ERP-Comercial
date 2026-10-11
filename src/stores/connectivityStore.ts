import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { countPendingOps } from '../db/repositories'
import type { ConnectivitySnapshot } from '../domain/types'

export const useConnectivityStore = defineStore('connectivity', () => {
  const online = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const pendingOps = ref(0)
  const conflictCount = ref(0)
  const lastSyncAt = ref<string | null>(null)
  const lastBackupAt = ref<string | null>(null)

  const snapshot = computed<ConnectivitySnapshot>(() => ({
    online: online.value,
    pendingOps: pendingOps.value,
    conflictCount: conflictCount.value,
    lastSyncAt: lastSyncAt.value,
    lastBackupAt: lastBackupAt.value,
  }))

  const statusLabel = computed(() => (online.value ? 'En línea' : 'Sin conexión'))

  function bindBrowserEvents() {
    window.addEventListener('online', () => {
      online.value = true
    })
    window.addEventListener('offline', () => {
      online.value = false
    })
  }

  async function refreshCounts(meta?: { lastSyncAt: string | null; lastBackupAt: string | null }) {
    pendingOps.value = await countPendingOps()
    if (meta) {
      lastSyncAt.value = meta.lastSyncAt
      lastBackupAt.value = meta.lastBackupAt
    }
  }

  return {
    online,
    pendingOps,
    conflictCount,
    lastSyncAt,
    lastBackupAt,
    snapshot,
    statusLabel,
    bindBrowserEvents,
    refreshCounts,
  }
})
