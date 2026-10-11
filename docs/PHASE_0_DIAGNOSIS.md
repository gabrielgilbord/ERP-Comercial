# Fase 0 — Diagnóstico y decisiones

## Estado del repositorio (auditoría)

| Elemento | Hallazgo |
|---|---|
| Rama | `main` en commit inicial |
| Contenido | Solo `README.md` (`# ERP-Comercial`) |
| Dependencias | Ninguna previa |
| Arquitectura | Inexistente |
| Funcionalidades | Ninguna implementada |

**Conclusión:** proyecto greenfield. Se arranca arquitectura limpia sin sobrescribir trabajo previo.

## Nombre de producto

**Faro** — gestión comercial offline-first, independiente de Syncbiosis.

## Stack elegido (Fase 1)

| Capa | Tecnología | Motivo |
|---|---|---|
| UI | Vue 3 + TypeScript + Vite | Productividad, tipado, ecosistema maduro |
| Estado | Pinia | Stores claros por dominio |
| Routing | Vue Router | Navegación por tareas |
| Persistencia web | Dexie (IndexedDB) | Offline real en navegador/Vercel preview |
| Persistencia escritorio (plan) | SQLite vía Tauri 2 | Misma API de repositorios, adaptador distinto |
| Iconos | `@lucide/vue` | Iconografía consistente, sin emojis |
| Tests | Vitest + happy-dom | Pruebas de persistencia y dominio |
| Preview móvil | Build estático en Vercel | Misma UI; sin APIs nativas de impresión/caja |

### Alternativas evaluadas

1. **Electron + React** — más peso de runtime; descartado frente a Tauri.
2. **Flutter desktop** — excelente UI, peor encaje con preview web/Vercel del mismo código.
3. **PWA-only** — insuficiente a medio plazo para impresoras térmicas y cajón en escritorio.

**Decisión:** núcleo Vue compartido + adaptadores de plataforma. Fase 1 entrega el shell web ejecutable y la capa de persistencia abstracta. El scaffold Tauri se añade cuando el entorno de build desktop esté disponible; no se afirma compatibilidad de impresoras sin pruebas reales.

## Qué existe / qué falta tras Fase 1

### Implementado (Fase 1)

- Shell de aplicación (sidebar, topbar, status bar)
- Sistema visual (tokens, claro/oscuro)
- Persistencia local IndexedDB con versión de esquema
- Perfil de empresa y preferencias
- Asistente inicial con progreso recuperable
- Indicadores honestos de conectividad / sync (sin fingir sync remota)
- Búsqueda global (estructura; índice local básico)
- Pantallas de módulos con estados vacíos reales (sin botones falsos)

### No implementado aún (explícito)

- TPV completo, caja, arqueos
- Inventario y movimientos auditables
- Campos personalizados persistidos en entidades
- Diseñador de documentos con impresión real
- Motor de reglas
- Sync multi-terminal
- VeriFactu / facturación fiscal
- Integraciones Holded u otros proveedores

## Principios de implementación

1. Flujos completos y verificables antes de pantallas decorativas.
2. No afirmar certificación fiscal, sync perfecta ni compatibilidad de hardware sin pruebas.
3. Cada fase deja la app ejecutable.
4. Secretos fuera del frontend y del repositorio.
