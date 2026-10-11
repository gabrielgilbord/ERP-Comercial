import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/asistente',
      name: 'setup',
      component: () => import('../views/SetupWizardView.vue'),
      meta: { title: 'Empezar' },
    },
    {
      path: '/',
      component: AppShell,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
          meta: { title: 'Inicio' },
        },
        {
          path: 'productos',
          name: 'products',
          component: () => import('../views/ProductsView.vue'),
          meta: { title: 'Productos' },
        },
        {
          path: 'configuracion',
          name: 'settings',
          component: () => import('../views/SettingsView.vue'),
          meta: { title: 'Configuración' },
        },
        // Alias y rutas antiguas: no se muestran en el menú, siguen accesibles.
        { path: 'ajustes', redirect: '/configuracion' },
        {
          path: 'tpv',
          name: 'pos',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Ventas',
            headline: 'Las ventas llegarán pronto',
            summary:
              'Aquí podrás cobrar, abrir caja y emitir tickets. Todavía no está disponible; no se puede vender desde Faro hoy.',
            nextHint: 'Mientras tanto, configura tu negocio y prueba con productos de ejemplo.',
          },
        },
        {
          path: 'clientes',
          name: 'customers',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Clientes',
            headline: 'La agenda de clientes aún no está lista',
            summary: 'Podrás guardar clientes y ver su historial en una próxima versión.',
            nextHint: 'Empieza por tus productos o completa la configuración del negocio.',
          },
        },
        {
          path: 'inventario',
          name: 'inventory',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Stock',
            headline: 'El control de stock llegará pronto',
            summary:
              'Los cambios de existencias se registrarán con fecha y motivo. Aún no puedes ajustar stock.',
            nextHint: 'Prueba el listado de productos de ejemplo para familiarizarte.',
          },
        },
        {
          path: 'personalizar',
          name: 'customize',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Personalizar',
            headline: 'Personalización avanzada, más adelante',
            summary: 'Campos propios, tickets y reglas se configurarán sin programar.',
            nextHint: 'Hoy puedes cambiar el nombre del negocio y el aspecto en Configuración.',
          },
        },
        {
          path: 'documentos',
          name: 'documents',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Tickets y documentos',
            headline: 'El diseño de tickets aún no está disponible',
            summary: 'Más adelante podrás diseñar tickets y facturas con vista previa real.',
            nextHint: 'Vuelve al inicio para ver qué puedes hacer hoy.',
          },
        },
        {
          path: 'informes',
          name: 'reports',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Informes',
            headline: 'Los informes llegarán más adelante',
            summary: 'Ventas, márgenes, mermas y alertas útiles para decidir con datos reales.',
            nextHint: 'Cuando haya ventas e inventario, los informes tendrán sentido.',
          },
        },
      ],
    },
  ],
})

export default router
