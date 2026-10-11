# Fase 1.5 — Rediseño UX

## Objetivo

Que un comerciante sin perfil técnico entienda Faro desde el primer minuto, antes de ampliar módulos.

## Cambios principales

- Menú reducido a tareas disponibles: Inicio, Productos, Configuración
- Inicio orientado a acciones (sin dashboard de métricas falsas)
- Asistente de 5 pasos útiles, con salida y progreso persistente
- Copy sin jerga (sin «IndexedDB», «Fase», «sync remota» en la UI principal)
- Barra inferior discreta: guardado local + estado de internet
- Configuración con campos esenciales primero
- Prueba Playwright `npm run test:ux`

## Cómo ejecutar

```bash
npm install
npm run dev
npm test
npm run test:ux
```

## Demostración de 2 minutos (persona no técnica)

1. Abrir Faro → leer «Tu negocio, más fácil» y pulsar **Empezar en 2 minutos**.
2. Escribir el nombre del negocio → Continuar → elegir tipo de comercio.
3. Elegir **Sí, cargar ejemplos** → Continuar → elegir aspecto → **Empezar a usar Faro**.
4. Ir a **Productos** y ver la tabla marcada DEMO.
5. Ir a **Configuración**, cambiar el nombre y Guardar.
6. Recargar la página y comprobar que el nombre sigue ahí.
7. En Inicio, leer «Qué puedes hacer ahora» y «Más adelante».

## Limitación

No hay validación con usuarios reales; ver hipótesis en `UX_AUDIT_FASE15.md`.
