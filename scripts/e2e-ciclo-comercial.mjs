/**
 * E2E Playwright: ciclo comercial completo en entorno limpio.
 */
import { chromium } from 'playwright'

const base = process.env.BASE_URL || 'http://127.0.0.1:5173'
const out = process.env.OUT || '/opt/cursor/artifacts/screenshots/ciclo-comercial'
const steps = []

function ok(name, detail = '') {
  steps.push({ name, ok: true, detail })
}
function fail(name, detail) {
  steps.push({ name, ok: false, detail })
  throw new Error(`${name}: ${detail}`)
}

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage({ viewport: { width: 1400, height: 900 } })

try {
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases()
    await Promise.all(dbs.map((d) => d.name && indexedDB.deleteDatabase(d.name)))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.hero__brand')
  ok('Entorno limpio', 'IndexedDB borrada')

  // Empresa
  await page.goto(base + '/configuracion', { waitUntil: 'networkidle' })
  await page.fill('#trade', 'Comercio Faro Demo')
  await page.fill('#name', 'Comercio Faro Demo SL')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await page.waitForSelector('text=Guardado correctamente')
  ok('Configurar empresa')

  // Proveedor
  await page.goto(base + '/proveedores', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Nuevo proveedor' }).click()
  await page.fill('#s-name', 'Distribuciones Norte')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await page.waitForSelector('text=Distribuciones Norte')
  ok('Crear proveedor')

  // Producto con stock 0 (compra lo sube) — creamos con stock 0 y compramos 10
  await page.goto(base + '/productos', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Nuevo producto/i }).click()
  await page.fill('#p-name', 'Botella agua 1L')
  await page.fill('#p-sku', 'AGUA-1L')
  await page.fill('#p-bar', '8411111111111')
  await page.fill('#p-cost', '0.40')
  await page.fill('#p-price', '1.20')
  await page.fill('#p-tax', '10')
  await page.fill('#p-stock', '0')
  await page.fill('#p-min', '2')
  await page.getByRole('button', { name: 'Guardar producto' }).click()
  await page.waitForSelector('text=Botella agua 1L')
  ok('Crear producto')

  // Cliente
  await page.goto(base + '/clientes', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  await page.fill('#c-name', 'Ana Pérez')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await page.waitForSelector('text=Ana Pérez')
  ok('Crear cliente')

  // Compra / recepción
  await page.goto(base + '/compras', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Recibir mercancía' }).click()
  await page.locator('select').nth(0).selectOption({ label: 'Distribuciones Norte' })
  const productValue = await page.locator('select').nth(1).locator('option', { hasText: 'Botella agua 1L' }).getAttribute('value')
  if (!productValue) fail('Recibir compra', 'No se encontró el producto en el selector')
  await page.locator('select').nth(1).selectOption(productValue)
  await page.fill('#q', '10')
  await page.fill('#cost', '0.40')
  await page.getByRole('button', { name: 'Confirmar recepción' }).click()
  await page.waitForSelector('.ok')
  const purchaseMsg = (await page.locator('.ok').textContent()) || ''
  if (!/recibida/i.test(purchaseMsg)) fail('Recibir compra', purchaseMsg)
  ok('Recibir compra', purchaseMsg.trim())

  await page.goto(base + '/inventario', { waitUntil: 'networkidle' })
  const stockBeforeSale = (await page.locator('tr', { hasText: 'Botella agua 1L' }).locator('td').nth(1).textContent())?.trim()
  if (stockBeforeSale !== '10') fail('Stock tras compra', `esperado 10, got ${stockBeforeSale}`)
  ok('Stock tras compra', '10')

  // Abrir caja 100€
  await page.goto(base + '/caja', { waitUntil: 'networkidle' })
  await page.fill('#open', '100')
  await page.getByRole('button', { name: 'Abrir caja' }).click()
  await page.waitForSelector('text=Caja abierta')
  ok('Abrir caja')

  // Vender 2
  await page.goto(base + '/tpv', { waitUntil: 'networkidle' })
  await page.waitForSelector('.chip')
  const chipText = await page.locator('.chip').first().innerText()
  if (!/stock 10/i.test(chipText)) fail('Vender y cobrar', `chip inesperado: ${chipText}`)
  await page.locator('.chip').first().click()
  await page.waitForSelector('.lines li')
  await page.locator('.chip').first().click()
  await page.waitForFunction(() => Number(document.querySelector('.lines .qty')?.value || 0) >= 2)
  await page.locator('.cart select').first().selectOption({ label: 'Ana Pérez' })
  await page.fill('#received', '5')
  await page.getByRole('button', { name: 'Confirmar cobro' }).click()
  await page.waitForSelector('.ok, .error')
  if (await page.locator('.error').isVisible()) {
    fail('Vender y cobrar', (await page.locator('.error').textContent()) || 'error')
  }
  await page.screenshot({ path: `${out}/01-venta-cobrada.png`, fullPage: true })
  ok('Vender y cobrar')

  // Stock
  await page.goto(base + '/inventario', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Botella agua 1L')
  const stockCell = page.locator('tr', { hasText: 'Botella agua 1L' }).locator('td').nth(1)
  const stockText = (await stockCell.textContent())?.trim()
  if (stockText !== '8') fail('Verificar stock', `esperado 8, got ${stockText}`)
  await page.screenshot({ path: `${out}/02-stock-actualizado.png`, fullPage: true })
  ok('Stock tras venta', '8 unidades')

  // Devolución parcial 1
  await page.goto(base + '/devoluciones', { waitUntil: 'networkidle' })
  const saleOption = page.locator('select option').nth(1)
  const saleValue = await saleOption.getAttribute('value')
  if (!saleValue) fail('Devolución parcial', 'No hay ventas para devolver')
  await page.locator('select').selectOption(saleValue)
  await page.waitForSelector('input[id^="q-"]')
  await page.locator('input[id^="q-"]').first().fill('1')
  await page.getByRole('button', { name: 'Registrar devolución' }).click()
  await page.waitForSelector('.ok, .error')
  if (await page.locator('.error').isVisible()) {
    fail('Devolución parcial', (await page.locator('.error').textContent()) || 'error')
  }
  const retMsg = (await page.locator('.ok').textContent()) || ''
  if (!/Devolución/i.test(retMsg)) fail('Devolución parcial', retMsg)
  ok('Devolución parcial', retMsg.trim())

  await page.goto(base + '/inventario', { waitUntil: 'networkidle' })
  const stockAfter = (await page.locator('tr', { hasText: 'Botella agua 1L' }).locator('td').nth(1).textContent())?.trim()
  if (stockAfter !== '9') fail('Stock tras devolución', `esperado 9, got ${stockAfter}`)
  ok('Stock tras devolución', '9')

  // Cerrar caja
  await page.goto(base + '/caja', { waitUntil: 'networkidle' })
  await page.fill('#counted', '101.20')
  await page.getByRole('button', { name: 'Cerrar caja' }).click()
  await page.waitForSelector('text=Caja cerrada')
  await page.screenshot({ path: `${out}/03-caja-cerrada.png`, fullPage: true })
  ok('Cerrar caja')

  // Informe
  await page.goto(base + '/informes', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Importe vendido')
  await page.screenshot({ path: `${out}/04-informes.png`, fullPage: true })
  ok('Informe de ventas')

  // Persistencia
  await page.reload({ waitUntil: 'networkidle' })
  await page.goto(base + '/productos', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Botella agua 1L')
  ok('Persistencia tras recarga')

  // Copia de seguridad: exportar → borrar → restaurar
  await page.goto(base + '/configuracion', { waitUntil: 'networkidle' })
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar copia JSON' }).click(),
  ])
  const backupPath = `${out}/faro-backup-e2e.json`
  await download.saveAs(backupPath)
  await page.waitForSelector('[data-testid="backup-ok"]')
  ok('Exportar copia de seguridad')

  await page.getByRole('button', { name: 'Borrar y empezar de nuevo' }).click()
  await page.getByRole('button', { name: 'Borrar todo' }).click()
  await page.waitForURL('**/asistente')
  await page.goto(base + '/productos', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=No hay productos')
  if (await page.locator('table tbody tr', { hasText: 'Botella agua 1L' }).count()) {
    fail('Borrar datos', 'El producto sigue visible tras el reset')
  }
  ok('Datos borrados antes de restaurar')

  await page.goto(base + '/configuracion', { waitUntil: 'networkidle' })
  await page.locator('input[type="file"]').setInputFiles(backupPath)
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click()
  await page.waitForSelector('[data-testid="backup-ok"], [data-testid="backup-error"]')
  if (await page.locator('[data-testid="backup-error"]').isVisible()) {
    fail('Restaurar copia', (await page.locator('[data-testid="backup-error"]').textContent()) || 'error')
  }
  await page.goto(base + '/productos', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Botella agua 1L')
  await page.screenshot({ path: `${out}/05-backup-restaurada.png`, fullPage: true })
  ok('Restaurar copia de seguridad')

  console.log(JSON.stringify({ ok: true, steps }, null, 2))
} catch (error) {
  await page.screenshot({ path: `${out}/error.png`, fullPage: true }).catch(() => {})
  console.error(JSON.stringify({ ok: false, steps, error: String(error) }, null, 2))
  process.exitCode = 1
} finally {
  await browser.close()
}
