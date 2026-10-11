# Ciclo comercial Faro (implementado)

## Flujo funcional

1. Configurar empresa  
2. Crear proveedor y producto en el **catálogo central** (módulo Productos)  
3. Recibir compra → stock ↑  
4. Abrir caja  
5. Vender en **TPV básico** (solo buscar/escanear/cobrar; no da de alta productos)  
6. Devolver parcialmente → stock ↑ + reembolso en caja  
7. Cerrar caja con diferencia  
8. Consultar informes  
9. Exportar y restaurar copia de seguridad JSON  

El TPV lee el catálogo vía `CatalogPort`. Hoy el origen es local (`LocalCentralCatalogAdapter`); más adelante puede ser un sistema central remoto sin cambiar la pantalla de cobro.

## Ejecutar

```bash
npm install
npm run dev
npm test
npm run test:e2e
```

El E2E (`npm run test:e2e`) asume Vite en `http://127.0.0.1:5173`.

## Datos de prueba (manual)

1. Configuración → nombre «Comercio Faro Demo».  
2. Proveedores → «Distribuciones Norte».  
3. Productos → «Botella agua 1L», SKU `AGUA-1L`, precio 1,20 €, stock 0.  
4. Clientes → «Ana Pérez».  
5. Compras → recibir 10 ud.  
6. Caja → abrir con 100 €.  
7. TPV → vender 2 ud., cobrar 5 € en efectivo.  
8. Devoluciones → devolver 1 ud.  
9. Caja → cerrar contando 101,20 €.  
10. Informes → comprobar importe vendido.  
11. Configuración → exportar/restaurar JSON.

## Limitaciones honestas

- Ticket imprimible vía diálogo del navegador (no impresora térmica nativa).
- Cobro con tarjeta = registro manual (sin datáfono).
- Sin VeriFactu / certificación fiscal.
- Sin sync multi-dispositivo (IndexedDB local por origen).
- Diseñador visual de plantillas: pendiente (el ticket ya se genera al cobrar).
- Roles/permisos y campos personalizados: preparados parcialmente / pendientes.
