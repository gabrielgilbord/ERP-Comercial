# Fase 1.5 — Auditoría UX y rediseño

## Problemas detectados (antes del cambio)

1. **Navegación saturada:** 9 entradas, la mayoría vacías (TPV, clientes, inventario, personalizar, documentos, informes). Parecía un panel técnico incompleto.
2. **Jerga de desarrollo:** «Fase 1», «IndexedDB», «sync remota», «Analítica operativa», IDs de terminal visibles.
3. **Inicio tipo dashboard:** tres paneles de estado del sistema sin una tarea clara para el comerciante.
4. **Onboarding de 9 pasos:** muchos pasos solo decían «aún no está» (impresora, fiscal, usuarios…), generando frustración.
5. **Estados vacíos fríos:** hablaban de fases internas en lugar del siguiente paso útil.
6. **Barra inferior ruidosa:** sync, pendientes y copias sin valor práctico hoy.
7. **Formulario de ajustes plano:** ocho campos a la vez sin priorizar lo esencial.

## Hipótesis pendientes (sin validación con usuarios reales)

- Un comerciante entiende «Productos de ejemplo» mejor que «datos demo».
- Ocultar módulos futuros en la nav reduce abandono en el primer minuto.
- Un onboarding de 5 pasos se completa más que uno de 9 con placeholders.

> No se afirma que la facilidad de uso esté validada por personas reales.

## Cambios aplicados

| Área | Antes | Después |
|---|---|---|
| Menú | 9 entradas, muchas vacías | 3: Inicio, Productos, Configuración |
| Inicio | Paneles de «estado del sistema» | Acciones claras + checklist + «más adelante» |
| Onboarding | 9 pasos con placeholders técnicos | 5 pasos útiles (negocio, plantilla, ejemplos, aspecto, listo) |
| Copy | IndexedDB, Fase, sync | Lenguaje de comerciante |
| Status | Sync/pendientes/copias | Guardado local + internet |
| Ajustes | 8 campos a la vez + ID terminal | Esenciales + opcionales plegados |
| Pruebas | smoke básico | + `npm run test:ux` recorrido nuevo usuario |

## Preparación Fase 2 (sin implementar)

Productos reales, clientes, proveedores y movimientos de stock auditables. La navegación dejará hueco natural bajo «Productos» y «Contactos» cuando existan flujos completos.
