/**
 * Recorrido de facilidad de uso (automatizado).
 * No sustituye pruebas con personas reales.
 */
import { chromium } from 'playwright'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const base = process.env.BASE_URL || 'http://127.0.0.1:5173'
const out = process.env.OUT || '/opt/cursor/artifacts/screenshots/fase15-after'
const steps = []

function pass(name, detail = '') {
  steps.push({ name, ok: true, detail })
}

function fail(name, detail) {
  steps.push({ name, ok: false, detail })
  throw new Error(`${name}: ${detail}`)
}

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage({ viewport: { width: 1280, height: 800 } })

try {
  await page.goto(base, { waitUntil: 'networkidle' })
  const brand = await page.locator('.hero__brand').textContent()
  if (!brand?.includes('Faro')) fail('Entender Faro', 'No se ve la marca Faro en inicio')
  const purpose = await page.locator('.hero__lead').textContent()
  if (!purpose || purpose.length < 40) fail('Entender Faro', 'Falta explicación del propósito')
  pass('Entender Faro', 'Marca y propósito visibles')
  await page.screenshot({ path: path.join(out, 'ux-01-inicio.png'), fullPage: true })

  await page.getByRole('button', { name: /Empezar|Seguir configuración/i }).first().click()
  await page.waitForURL((url) => url.pathname === '/asistente')
  await page.locator('#wiz-trade').fill('Mercado del Puerto')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: /Tienda o comercio general/i }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: /Sí, cargar ejemplos/i }).click()
  await page.getByRole('button', { name: 'Guardar y salir' }).click()
  await page.waitForURL((url) => url.pathname === '/')
  await page.waitForSelector('.sidebar')
  pass('Onboarding parcial', 'Completó negocio + plantilla + demo y salió guardando')

  await page.locator('.sidebar .nav-item', { hasText: 'Productos' }).click()
  await page.waitForURL((url) => url.pathname === '/productos')
  await page.waitForFunction(() => document.querySelector('h1')?.textContent?.trim() === 'Productos')
  pass('Encontrar función', 'Productos localizado desde el menú')
  await page.screenshot({ path: path.join(out, 'ux-02-productos.png'), fullPage: true })

  await page.locator('.sidebar .nav-item', { hasText: 'Configuración' }).click()
  await page.waitForURL((url) => url.pathname === '/configuracion')
  await page.waitForSelector('#trade', { state: 'visible' })
  if ((await page.locator('#trade').inputValue()) !== 'Mercado del Puerto') {
    fail('Localizar configuración', 'El nombre del negocio no persistió')
  }
  pass('Localizar configuración', 'Configuración accesible y datos persistidos')
  await page.screenshot({ path: path.join(out, 'ux-03-config.png'), fullPage: true })

  const demoChecked = await page.locator('input[type="checkbox"]').isChecked()
  if (!demoChecked) {
    await page.locator('input[type="checkbox"]').check()
  }
  await page.locator('.sidebar .nav-item', { hasText: 'Productos' }).click()
  await page.waitForURL((url) => url.pathname === '/productos')
  await page.waitForSelector('table tbody tr')
  const demoTag = await page.locator('.tag', { hasText: 'DEMO' }).count()
  if (!demoTag) fail('Activar demo', 'No hay filas DEMO')
  pass('Activar demo', 'Productos de ejemplo visibles y etiquetados')

  await page.goto(base, { waitUntil: 'networkidle' })
  const later = await page.locator('#later-title').textContent()
  const now = await page.locator('#now-title').textContent()
  if (!later || !now) fail('Identificar disponibles', 'Faltan secciones de disponibilidad')
  const navCount = await page.locator('.sidebar .nav-item').count()
  if (navCount < 3) fail('Identificar disponibles', `Menú incompleto (${navCount} ítems)`)
  pass('Identificar disponibles', `Menú con ${navCount} entradas operativas`)

  const page2 = await context.newPage()
  await page2.goto(base + '/configuracion', { waitUntil: 'networkidle' })
  const persisted = await page2.locator('#trade').inputValue()
  if (persisted !== 'Mercado del Puerto') {
    fail('Reabrir conservando preferencias', `Esperado Mercado del Puerto, got ${persisted}`)
  }
  pass('Reabrir conservando preferencias', 'Nombre del negocio sigue tras nueva pestaña')

  await page2.goto(base + '/asistente', { waitUntil: 'networkidle' })
  await page2.screenshot({ path: path.join(out, 'ux-04-asistente.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await page.waitForSelector('.sidebar--open')
  await page.screenshot({ path: path.join(out, 'ux-05-mobile-nav.png') })
  pass('Vista móvil', 'Menú reducido usable')

  console.log(JSON.stringify({ ok: true, steps }, null, 2))
} catch (error) {
  console.error(JSON.stringify({ ok: false, steps, error: String(error) }, null, 2))
  process.exitCode = 1
} finally {
  await browser.close()
}

void pathToFileURL
