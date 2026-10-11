import { chromium } from 'playwright'
import path from 'node:path'

const base = process.env.BASE_URL || 'http://127.0.0.1:5173'
const out = process.env.OUT || '/opt/cursor/artifacts/screenshots'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const log = []

page.on('pageerror', (e) => log.push('PAGEERROR ' + e.message))
page.on('console', (m) => {
  if (m.type() === 'error') log.push('CONSOLE ' + m.text())
})

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.hero__brand, .wizard__brand, .boot__brand')
await page.screenshot({ path: path.join(out, '01-home.png'), fullPage: true })

await page.locator('.nav-item', { hasText: 'Productos' }).click()
await page.waitForURL('**/productos')
await page.getByRole('button', { name: /ejemplo/i }).first().click()
await page.waitForSelector('table tbody tr')
await page.screenshot({ path: path.join(out, '02-productos-demo.png'), fullPage: true })

await page.locator('.nav-item', { hasText: 'Configuración' }).click()
await page.waitForURL('**/configuracion')
await page.locator('#trade').fill('Tienda Prueba')
await page.locator('#name').fill('Tienda Prueba SL')
await page.getByRole('button', { name: 'Guardar' }).click()
await page.waitForSelector('text=Guardado correctamente')
await page.selectOption('select', 'dark')
await page.waitForTimeout(300)
await page.screenshot({ path: path.join(out, '03-ajustes-oscuro.png'), fullPage: true })

await page.keyboard.press('Control+k')
await page.waitForSelector('.search-panel')
await page.locator('.search-panel input').fill('café')
await page.waitForTimeout(400)
await page.screenshot({ path: path.join(out, '04-busqueda.png') })
await page.keyboard.press('Escape')

await page.goto(base + '/asistente', { waitUntil: 'networkidle' })
await page.waitForSelector('.wizard__brand')
await page.screenshot({ path: path.join(out, '05-asistente.png'), fullPage: true })

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
await mobile.goto(base, { waitUntil: 'networkidle' })
await mobile.waitForSelector('.hero__brand')
await mobile.screenshot({ path: path.join(out, '06-mobile-home.png'), fullPage: true })
await mobile.getByRole('button', { name: 'Abrir menú' }).click()
await mobile.waitForTimeout(300)
await mobile.screenshot({ path: path.join(out, '07-mobile-menu.png') })

await page.goto(base + '/configuracion', { waitUntil: 'networkidle' })
const trade = await page.locator('#trade').inputValue()
log.push('TRADE=' + trade)

console.log(JSON.stringify({ ok: trade === 'Tienda Prueba', trade, log }, null, 2))
await browser.close()
