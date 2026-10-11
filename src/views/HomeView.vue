<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Package, Settings2, Sparkles, WifiOff } from '@lucide/vue'
import PageHeader from '../components/ui/PageHeader.vue'
import AppButton from '../components/ui/AppButton.vue'
import { useAppStore } from '../stores/appStore'
import { useConnectivityStore } from '../stores/connectivityStore'

const app = useAppStore()
const connectivity = useConnectivityStore()
const router = useRouter()

const greeting = computed(() => {
  const name = app.company?.tradeName || app.company?.name
  return name ? `Hola, ${name}` : 'Bienvenido a Faro'
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <p class="hero__brand">Faro</p>
      <h1>{{ greeting }}</h1>
      <p class="hero__lead">
        Gestión comercial local, clara y personalizable. Esta es la Fase 1: shell, diseño y
        persistencia. Las ventas y el stock llegarán en fases siguientes.
      </p>
      <div class="hero__cta">
        <AppButton variant="primary" size="lg" @click="router.push('/asistente')">
          Continuar configuración
        </AppButton>
        <AppButton variant="secondary" size="lg" @click="router.push('/ajustes')">
          Abrir ajustes
        </AppButton>
      </div>
    </section>

    <PageHeader title="Estado del sistema" subtitle="Solo datos reales del entorno local." />

    <div class="grid">
      <article class="panel">
        <WifiOff v-if="!connectivity.online" :size="20" />
        <Sparkles v-else :size="20" />
        <h3>{{ connectivity.online ? 'Listo para trabajar' : 'Modo sin conexión' }}</h3>
        <p>
          {{
            connectivity.online
              ? 'Hay red, pero la sincronización remota aún no está implementada.'
              : 'Puedes seguir usando datos locales. La sync remota no está activa en Fase 1.'
          }}
        </p>
      </article>

      <article class="panel">
        <Package :size="20" />
        <h3>Catálogo demo</h3>
        <p>
          {{
            app.settings?.demoMode
              ? `${app.demoProducts.length} productos de demostración cargados (etiquetados como demo).`
              : 'Sin datos demo. Actívalos en Ajustes para explorar búsquedas y listados.'
          }}
        </p>
        <AppButton size="sm" @click="router.push('/productos')">Ver productos</AppButton>
      </article>

      <article class="panel">
        <Settings2 :size="20" />
        <h3>Asistente</h3>
        <p>
          {{
            app.settings?.setupCompleted
              ? 'Configuración inicial marcada como completa. Puedes retomarla cuando quieras.'
              : `Progreso del asistente: paso ${(app.settings?.setupStep ?? 0) + 1} de 9.`
          }}
        </p>
        <AppButton size="sm" variant="ghost" @click="router.push('/asistente')">Abrir asistente</AppButton>
      </article>
    </div>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  margin: calc(var(--space-2) * -1) 0 var(--space-6);
  padding: var(--space-6) 0 var(--space-5);
  border-bottom: 1px solid var(--border);
  animation: rise 420ms var(--motion-med) both;
}

.hero__brand {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  line-height: 1;
  color: var(--accent);
  margin-bottom: var(--space-3);
}

.hero__lead {
  margin-top: var(--space-3);
  max-width: 52ch;
  color: var(--text-muted);
  font-size: 1.05rem;
}

.hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--border);
  animation: rise 480ms var(--motion-med) both;
}

.panel:nth-child(2) {
  animation-delay: 60ms;
}

.panel:nth-child(3) {
  animation-delay: 120ms;
}

.panel h3 {
  font-family: var(--font-sans);
  font-weight: 700;
}

.panel p {
  color: var(--text-muted);
  flex: 1;
}

.panel svg {
  color: var(--accent);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
