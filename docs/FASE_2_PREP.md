# Preparación Fase 2 (sin implementar)

Tras validar la UX de la Fase 1.5, la siguiente entrega funcional será:

## Alcance propuesto

1. **Productos reales** (no solo DEMO): alta, edición, SKU, precio, categoría.
2. **Clientes y proveedores** bajo una zona «Contactos» en la navegación.
3. **Movimientos de stock auditables**: ningún cambio de existencias sin historial (fecha, motivo, origen, usuario cuando exista).
4. Importación CSV básica cuando el flujo esté completo y probado.

## Encaje en la navegación actual

Menú actual (disponible): Inicio · Productos · Configuración.

Ampliación prevista sin saturar:

- Productos → listado + stock resumido
- Contactos → clientes / proveedores (nueva entrada cuando haya pantallas reales)
- Las ventas siguen fuera del menú hasta Fase 3

## Criterios para empezar a implementar

- Revisión humana de la UX 1.5
- Mantener copy no técnico
- Flujos completos y verificables (sin botones vacíos)
- Tests de persistencia y de no editar stock a mano

## Fuera de alcance en Fase 2

TPV, diseñador de tickets, sync remota, VeriFactu, motor de reglas.
