# Fase 1 — Shell, sistema visual y persistencia local

## Funcionalidades

- Aplicación Vue 3 ejecutable (dev + build)
- Navegación lateral por tareas
- Top bar con búsqueda global y tema claro/oscuro
- Status bar con estado de red y sync (valores reales / null honestos)
- Persistencia IndexedDB (Dexie) con esquema v1
- Perfil de empresa y preferencias persistidos
- Asistente inicial con progreso recuperable
- Datos de demostración claramente etiquetados
- Pruebas automatizadas de persistencia y dinero

## Cómo ejecutar

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

```bash
npm test
```

## Cómo probar

1. Abrir la app → completar o saltar el asistente.
2. Cambiar nombre de empresa en Ajustes → recargar → debe persistir.
3. Alternar tema claro/oscuro → debe persistir.
4. Activar/desactivar datos demo en Ajustes.
5. Cortar red del navegador → status bar muestra Offline.
6. Buscar con `Ctrl/Cmd+K`.

## Limitaciones conocidas

- TPV, stock, documentos e impresión: no operativos (pantallas informativas).
- Sync remota: no implementada.
- Tauri desktop: documentado, no empaquetado en esta fase.
- Vercel preview: almacenamiento local del navegador, no compartido entre dispositivos.
