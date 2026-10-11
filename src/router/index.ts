import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/asistente',
      name: 'setup',
      component: () => import('../views/SetupWizardView.vue'),
      meta: { title: 'Asistente inicial' },
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
          path: 'tpv',
          name: 'pos',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'TPV',
            module: 'TPV y ventas',
            phase: 'Fase 3',
            summary:
              'Búsqueda, códigos de barras, carrito, caja y tickets configurables. Aún no operativo.',
          },
        },
        {
          path: 'productos',
          name: 'products',
          component: () => import('../views/ProductsView.vue'),
          meta: { title: 'Productos' },
        },
        {
          path: 'clientes',
          name: 'customers',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Clientes',
            module: 'Clientes',
            phase: 'Fase 2',
            summary: 'Fichas de clientes, historial y campos personalizados. Pendiente de implementación.',
          },
        },
        {
          path: 'inventario',
          name: 'inventory',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Inventario',
            module: 'Inventario',
            phase: 'Fase 2',
            summary:
              'Movimientos auditables, almacenes y ajustes. El stock no se editará sin historial.',
          },
        },
        {
          path: 'personalizar',
          name: 'customize',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Personalizar mi negocio',
            module: 'Personalización',
            phase: 'Fase 4',
            summary:
              'Campos personalizados, formularios, estados y reglas SI/ENTONCES sin JavaScript arbitrario.',
          },
        },
        {
          path: 'documentos',
          name: 'documents',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Diseñador de documentos',
            module: 'Documentos',
            phase: 'Fase 3–4',
            summary:
              'Editor visual de tickets y facturas con plantillas versionadas. No disponible aún.',
          },
        },
        {
          path: 'informes',
          name: 'reports',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Informes',
            module: 'Analítica operativa',
            phase: 'Fase 5',
            summary: 'Mermas, descuadres, márgenes y alertas deterministas. Sin dependencia de IA.',
          },
        },
        {
          path: 'ajustes',
          name: 'settings',
          component: () => import('../views/SettingsView.vue'),
          meta: { title: 'Ajustes' },
        },
      ],
    },
  ],
})

export default router
