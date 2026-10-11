# Arquitectura Faro

## Visión

Núcleo común multiempresa / multiestablecimiento / multiterminal para pequeños negocios, con personalización sin código y operación offline-first.

```
┌─────────────────────────────────────────────────────────┐
│  Presentación (Vue)                                      │
│  Shell · TPV básico · Catálogo central · Caja · Docs …  │
├─────────────────────────────────────────────────────────┤
│  Dominio + estados (Pinia / servicios)                      │
│  ventas · stock · documentos · reglas · permisos         │
├─────────────────────────────────────────────────────────┤
│  Puertos (interfaces)                                    │
│  CatalogPort · PersistencePort · PrintPort · SyncPort …│
├───────────────┬─────────────────┬───────────────────────┤
│ IndexedDB     │ SQLite (Tauri)  │ Adaptadores externos  │
│ (web/preview) │ (Windows/macOS) │ pagos · fiscal · sync │
└───────────────┴─────────────────┴───────────────────────┘
```

## TPV vs catálogo central

- **Productos** es el sistema central del catálogo (alta, precios, IVA, stock mínimo).
- **TPV** solo lee el catálogo vía `CatalogPort` (`src/ports/catalogPort.ts`) y cobra.
- Adaptador actual: `LocalCentralCatalogAdapter` (datos locales). Futuro: adaptador remoto/sync sin reescribir el TPV.

## Identificadores y multi-terminal

- IDs: ULID/UUID v7 generados en cliente (`src/domain/ids.ts`).
- Cada terminal tiene `terminalId` persistido.
- Operaciones críticas (venta, movimiento stock) llevan `idempotencyKey`.
- Sync (Fase 6): cola persistente, reintentos idempotentes, detección de conflictos. **No prometida como perfecta hasta pruebas de desconexión simultánea.**

## Persistencia

- Esquema versionado (`db.version(n).stores(...)`).
- Migraciones locales solo hacia adelante.
- Transacciones para operaciones de negocio.
- Copias de seguridad y restauración: implementadas en `backupService` (JSON versionado).

## Offline y sync

| Señal UI | Fuente real |
|---|---|
| Online/offline | `navigator.onLine` + eventos |
| Última sync | `settings.lastSyncAt` (null hasta Fase 6) |
| Pendientes | `outbox` count (tabla reservada; vacía en Fase 1) |
| Conflictos | `syncConflicts` (reservado) |
| Backup | `settings.lastBackupAt` |

Sync nocturna solo para operaciones no urgentes. Envíos fiscales sujetos a normativa no se aplazan deliberadamente.

## Personalización (Fase 4)

- `customFields`, `formLayouts`, `tableViews`, `businessRules` como entidades de configuración.
- Reglas: DSL tipado SI/ENTONCES, sin JavaScript arbitrario.
- Documentos: plantillas versionadas; documentos emitidos congelan la versión usada.

## Fiscal (Fase 7)

Separación estricta: comercial ≠ fiscal ≠ envíos AEAT. Evaluar proveedor vs nativo antes de implementar. Sin declaraciones de cumplimiento hasta evidencia.

## Seguridad

- Roles y permisos por operación (Fase 2+).
- Aislamiento por `companyId`.
- Credenciales de integraciones solo en almacén seguro de plataforma (nunca en repo).

## Preview Vercel

Misma UI web. Limitaciones: sin impresora nativa, sin cajón, persistencia por origen del navegador. Útil para UX móvil, no para certificación TPV hardware.
