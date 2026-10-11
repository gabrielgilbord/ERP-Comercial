<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import TopBar from './TopBar.vue'
import StatusBar from './StatusBar.vue'
import GlobalSearch from './GlobalSearch.vue'

const route = useRoute()
const sidebarOpen = ref(false)
const searchOpen = ref(false)

function onKeydown(e: KeyboardEvent) {
  const isMod = e.metaKey || e.ctrlKey
  if (isMod && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = true
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="shell">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="shell__main">
      <TopBar
        :title="String(route.meta.title || '')"
        @toggle-sidebar="sidebarOpen = true"
        @open-search="searchOpen = true"
      />
      <main class="shell__content">
        <RouterView v-slot="{ Component }">
          <Transition name="slide-fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
      <StatusBar />
    </div>
    <GlobalSearch :open="searchOpen" @close="searchOpen = false" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  background:
    var(--hero-glow),
    var(--bg);
}

.shell__main {
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.shell__content {
  flex: 1;
  padding: var(--space-5);
  max-width: 1200px;
  width: 100%;
}

@media (max-width: 900px) {
  .shell__main {
    margin-left: 0;
  }

  .shell__content {
    padding: var(--space-4);
  }
}
</style>
