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
        { path: '', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: 'Inicio' } },
        { path: 'tpv', name: 'pos', component: () => import('../views/PosView.vue'), meta: { title: 'TPV' } },
        { path: 'productos', name: 'products', component: () => import('../views/ProductsView.vue'), meta: { title: 'Productos' } },
        { path: 'inventario', name: 'inventory', component: () => import('../views/InventoryView.vue'), meta: { title: 'Inventario' } },
        { path: 'compras', name: 'purchases', component: () => import('../views/PurchasesView.vue'), meta: { title: 'Compras' } },
        { path: 'proveedores', name: 'suppliers', component: () => import('../views/SuppliersView.vue'), meta: { title: 'Proveedores' } },
        { path: 'clientes', name: 'customers', component: () => import('../views/CustomersView.vue'), meta: { title: 'Clientes' } },
        { path: 'caja', name: 'cash', component: () => import('../views/CashView.vue'), meta: { title: 'Caja' } },
        { path: 'devoluciones', name: 'returns', component: () => import('../views/ReturnsView.vue'), meta: { title: 'Devoluciones' } },
        { path: 'informes', name: 'reports', component: () => import('../views/ReportsView.vue'), meta: { title: 'Informes' } },
        { path: 'configuracion', name: 'settings', component: () => import('../views/SettingsView.vue'), meta: { title: 'Configuración' } },
        { path: 'ajustes', redirect: '/configuracion' },
        {
          path: 'personalizar',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Personalizar',
            headline: 'Personalización avanzada, más adelante',
            summary: 'Campos propios y reglas se configurarán sin programar.',
            nextHint: 'Hoy el ciclo comercial completo ya está operativo.',
          },
        },
        {
          path: 'documentos',
          component: () => import('../views/ComingSoonView.vue'),
          meta: {
            title: 'Diseñador de documentos',
            headline: 'El diseñador visual llegará pronto',
            summary: 'Los tickets ya se generan al cobrar; el editor visual es el siguiente paso.',
            nextHint: 'Cobra una venta en el TPV y usa Imprimir / PDF.',
          },
        },
      ],
    },
  ],
})

export default router
