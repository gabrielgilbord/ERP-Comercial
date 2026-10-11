# Continuar Faro (siguiente unidad)

Estado: ciclo comercial básico **implementado y probado** (Vitest + Playwright E2E).

## No rehacer

No regenerar modelo Dexie v2, servicios de venta/compra/caja ni el E2E `scripts/e2e-ciclo-comercial.mjs` salvo regresiones.

## Siguiente unidad recomendada

1. **Diseñador visual de tickets** (plantillas versionadas; documentos emitidos inmutables).
2. Importación CSV de productos con mapeo de columnas.
3. Inventario físico (recuento + regularización).
4. Roles/permisos locales con auditoría (documentar límites del modo local).
5. Módulo fiscal desacoplado (investigación AEAT; sin declarar cumplimiento).

## Comprobar antes de seguir

```bash
npm test
npm run dev   # en otra terminal
npm run test:e2e
```
