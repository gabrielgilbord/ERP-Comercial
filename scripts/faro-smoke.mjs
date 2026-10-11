import { chromium } from 'playwright'
import path from 'node:path'

const base = process.env.BASE_URL || 'http://127.0.0.1:5173'
const out = '/opt/cursor/artifacts/screenshots'
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

// Navigate products via sidebar
await page.locator('.nav-item', { hasText: 'Productos' }).click()
await page.waitForURL('**/productos')
await page.getByRole('button', { name: /Cargar datos demo/i }).first().click()
await page.waitForSelector('table tbody tr')
await page.screenshot({ path: path.join(out, '02-productos-demo.png'), fullPage: true })

// Settings
await page.locator('.nav-item', { hasText: 'Ajustes' }).click()
await page.waitForURL('**/ajustes')
await page.locator('#trade').fill('Tienda Prueba')
await page.locator('#name').fill('Tienda Prueba SL')
await page.getByRole('button', { name: 'Guardar cambios' }).click()
await page.waitForSelector('text=Cambios guardados')
await page.selectOption('select', 'dark')
await page.waitForTimeout(300)
await page.screenshot({ path: path.join(out, '03-ajustes-oscuro.png'), fullPage: true })

// Search
await page.keyboard.press('Control+k')
await page.waitForSelector('.search-panel')
await page.locator('.search-panel input').fill('café')
await page.waitForTimeout(400)
await page.screenshot({ path: path.join(out, '04-busqueda.png') })
await page.keyboard.press('Escape')

// Wizard
await page.goto(base + '/asistente', { waitUntil: 'networkidle' })
await page.waitForSelector('.wizard__brand')
await page.screenshot({ path: path.join(out, '05-asistente.png'), fullPage: true })

// Mobile
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
await mobile.goto(base, { waitUntil: 'networkidle' })
await mobile.waitForSelector('.hero__brand')
await mobile.screenshot({ path: path.join(out, '06-mobile-home.png'), fullPage: true })
await mobile.getByRole('button', { name: 'Abrir menú' }).click()
await mobile.waitForTimeout(300)
await mobile.screenshot({ path: path.join(out, '07-mobile-menu.png') })

// Persist check
await page.goto(base + '/ajustes', { waitUntil: 'networkidle' })
const trade = await page.locator('#trade').inputValue()
log.push('TRADE=' + trade)

console.log(JSON.stringify({ ok: trade === 'Tienda Prueba', trade, log }, null, 2))
await browser.close()
