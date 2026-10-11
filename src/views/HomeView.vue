<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, Circle } from '@lucide/vue'
import AppButton from '../components/ui/AppButton.vue'
import { useAppStore } from '../stores/appStore'

const app = useAppStore()
const router = useRouter()

const businessName = computed(
  () => app.company?.tradeName || app.company?.name || '',
)

const setupDone = computed(() => !!app.settings?.setupCompleted)
const hasBusinessName = computed(() => Boolean(businessName.value.trim()))
const demoOn = computed(() => !!app.settings?.demoMode)

const primaryAction = computed(() => {
  if (!setupDone.value && !hasBusinessName.value) {
    return {
      label: 'Empezar en 2 minutos',
      to: '/asistente',
      hint: 'Te pediremos el nombre del negocio y una plantilla sencilla.',
    }
  }
  if (!setupDone.value) {
    return {
      label: 'Seguir configuración',
      to: '/asistente',
      hint: 'Puedes salir cuando quieras: guardamos el progreso.',
    }
  }
  if (!demoOn.value) {
    return {
      label: 'Ver productos de ejemplo',
      to: '/productos',
      hint: 'Útiles para probar. Están marcados como DEMO y no se mezclan con tus datos reales.',
    }
  }
  return {
    label: 'Ir a mis productos',
    to: '/productos',
    hint: 'Tienes productos de ejemplo activos. Quítalos cuando quieras en Productos o Configuración.',
  }
})

const checklist = computed(() => [
  {
    done: hasBusinessName.value,
    label: hasBusinessName.value
      ? `Negocio: ${businessName.value}`
      : 'Aún no has puesto el nombre de tu negocio',
  },
  {
    done: setupDone.value,
    label: setupDone.value
      ? 'Configuración inicial completada'
      : 'Configuración inicial pendiente',
  },
  {
    done: demoOn.value,
    label: demoOn.value
      ? `${app.demoProducts.length} productos de ejemplo activos`
      : 'Sin productos de ejemplo (opcional)',
  },
])

async function toggleDemo() {
  await app.toggleDemo(!demoOn.value)
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <p class="hero__brand">Faro</p>
      <h1>{{ businessName ? `Hola, ${businessName}` : 'Tu negocio, más fácil' }}</h1>
      <p class="hero__lead">
        Faro te ayuda a gestionar un pequeño comercio: productos, ventas y stock, con tus datos
        guardados en este dispositivo. Hoy puedes configurar el negocio y probar con ejemplos.
      </p>
      <div class="hero__cta">
        <AppButton variant="primary" size="lg" @click="router.push(primaryAction.to)">
          {{ primaryAction.label }}
        </AppButton>
        <AppButton variant="secondary" size="lg" @click="router.push('/configuracion')">
          Configuración
        </AppButton>
      </div>
      <p class="hero__hint">{{ primaryAction.hint }}</p>
    </section>

    <section class="section" aria-labelledby="now-title">
      <h2 id="now-title">Qué puedes hacer ahora</h2>
      <ul class="action-list">
        <li>
          <button type="button" @click="router.push('/asistente')">
            <strong>{{ setupDone ? 'Revisar la configuración inicial' : 'Completar la configuración' }}</strong>
            <span>Nombre del negocio, tipo de comercio y preferencias. Se puede retomar.</span>
          </button>
        </li>
        <li>
          <button type="button" @click="router.push('/productos')">
            <strong>Mirar el listado de productos</strong>
            <span>
              {{
                demoOn
                  ? 'Hay productos de ejemplo cargados (marcados DEMO).'
                  : 'Activa productos de ejemplo para ver cómo se verá tu catálogo.'
              }}
            </span>
          </button>
        </li>
        <li>
          <button type="button" @click="toggleDemo">
            <strong>{{ demoOn ? 'Quitar productos de ejemplo' : 'Activar productos de ejemplo' }}</strong>
            <span>
              {{
                demoOn
                  ? 'Vuelves a un catálogo vacío hasta que añadas tus productos reales (próximamente).'
                  : 'Datos de prueba claros. No sustituyen a tu inventario real.'
              }}
            </span>
          </button>
        </li>
      </ul>
    </section>

    <section class="section" aria-labelledby="check-title">
      <h2 id="check-title">Estado de tu preparación</h2>
      <ul class="checklist">
        <li v-for="item in checklist" :key="item.label">
          <CheckCircle2 v-if="item.done" class="ok" :size="18" aria-hidden="true" />
          <Circle v-else class="pending" :size="18" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </li>
      </ul>
    </section>

    <section class="section later" aria-labelledby="later-title">
      <h2 id="later-title">Más adelante</h2>
      <p>
        Ventas con caja, stock, clientes, tickets personalizados e informes. No aparecen en el menú
        todavía para no liar: cuando estén listos, los verás aquí.
      </p>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding: var(--space-5) 0 var(--space-6);
  border-bottom: 1px solid var(--border);
  animation: rise 420ms var(--motion-med) both;
}

.hero__brand {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 5vw, 3.8rem);
  line-height: 1;
  color: var(--accent);
  margin-bottom: var(--space-3);
}

.hero__lead {
  margin-top: var(--space-3);
  max-width: 48ch;
  color: var(--text-muted);
  font-size: 1.05rem;
}

.hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.hero__hint {
  margin-top: var(--space-3);
  max-width: 52ch;
  color: var(--text-faint);
  font-size: 13px;
}

.section {
  padding: var(--space-5) 0;
  animation: rise 480ms var(--motion-med) both;
}

.section + .section {
  border-top: 1px solid var(--border);
}

.section h2 {
  font-family: var(--font-display);
  font-size: 1.35rem;
  margin-bottom: var(--space-4);
}

.action-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.action-list button {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: var(--space-4) 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: color var(--motion-fast);
}

.action-list li:last-child button {
  border-bottom: 0;
}

.action-list button:hover strong {
  color: var(--accent);
}

.action-list strong {
  font-size: 1rem;
}

.action-list span {
  color: var(--text-muted);
  font-size: 13px;
  max-width: 60ch;
}

.checklist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.checklist li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.ok {
  color: var(--success);
}

.pending {
  color: var(--text-faint);
}

.later p {
  max-width: 56ch;
  color: var(--text-muted);
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
