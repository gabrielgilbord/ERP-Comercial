# Faro

Gestión comercial multiplataforma, offline-first y personalizable para pequeños negocios.

> Producto independiente. Fase actual: **1.5 — UX para comerciantes** (sobre el shell de la Fase 1).

## Diagnóstico rápido

El repositorio partía vacío (`README` inicial). Se ha creado la arquitectura base documentada en:

- [`docs/PHASE_0_DIAGNOSIS.md`](docs/PHASE_0_DIAGNOSIS.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/FASE_1.md`](docs/FASE_1.md)

## Stack (Fase 1)

- Vue 3 + TypeScript + Vite
- Pinia + Vue Router
- Dexie (IndexedDB) para persistencia local web
- Vitest para pruebas
- Preview web (Vercel) para probar UX en móvil

Escritorio Windows/macOS: Tauri 2 + SQLite planificado (misma UI, adaptador de persistencia).

## Comandos

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

## Qué funciona ya

- Navegación por tareas, tema claro/oscuro, búsqueda (`Ctrl/Cmd+K`)
- Persistencia local de empresa, preferencias y productos demo
- Asistente inicial con progreso recuperable
- Indicadores honestos de online/offline (sin fingir sync remota)

## Qué no está implementado

TPV, inventario real, campos personalizados, diseñador de documentos, sync, fiscal/VeriFactu e integraciones. Las pantallas correspondientes lo indican explícitamente.
