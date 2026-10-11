<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from './stores/appStore'
import { useThemeStore } from './stores/themeStore'
import { useConnectivityStore } from './stores/connectivityStore'

const app = useAppStore()
const theme = useThemeStore()
const connectivity = useConnectivityStore()

onMounted(async () => {
  connectivity.bindBrowserEvents()
  await app.init()
  if (app.settings) {
    theme.initFromSettings(app.settings.theme)
    await connectivity.refreshCounts({
      lastSyncAt: app.settings.lastSyncAt,
      lastBackupAt: app.settings.lastBackupAt,
    })
  }
})
</script>

<template>
  <div v-if="app.bootError" class="boot-error">
    <h1>Faro</h1>
    <p>No se pudo iniciar la base local: {{ app.bootError }}</p>
  </div>
  <div v-else-if="!app.ready" class="boot">
    <p class="boot__brand">Faro</p>
    <p>Preparando datos locales…</p>
  </div>
  <RouterView v-else />
</template>

<style scoped>
.boot,
.boot-error {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-5);
  background: var(--bg);
}

.boot__brand,
.boot-error h1 {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--accent);
}

.boot p:last-child,
.boot-error p {
  color: var(--text-muted);
}
</style>
