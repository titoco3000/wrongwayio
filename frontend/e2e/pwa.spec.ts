import { expect, test } from '@playwright/test'

test('manifest is installable', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await request.get(href!)).json()
  expect(manifest).toMatchObject({ display: 'standalone', start_url: '/', short_name: 'WrongWayio' })
  const sizes = manifest.icons.map((i: { sizes: string; purpose?: string }) => `${i.sizes}${i.purpose ? ':' + i.purpose : ''}`)
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512', '512x512:maskable']))
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true)
  expect((await request.get('/icons/apple-touch-icon.png')).ok()).toBe(true)
})

test('viewport covers notches and sets theme color', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/)
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveCount(1)
})

test('app shell loads offline after first visit', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  // wait for the worker to control the page (autoUpdate claims clients)
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.getByText('WrongWayio').first()).toBeVisible()
})

test('sounds and fonts are precached', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  const urls = await page.evaluate(async () => {
    const out: string[] = []
    for (const name of await caches.keys()) for (const r of await (await caches.open(name)).keys()) out.push(new URL(r.url).pathname)
    return out
  })
  expect(urls).toEqual(expect.arrayContaining(['/sounds/clock-alarm.mp3', '/sounds/keyboard/click1.wav', '/fonts/feather-bold/feather-bold.ttf']))
})

test('gift link shows the invite', async ({ page }) => {
  await page.goto('/?premium=gift&from=Anna')
  await expect(page.getByText('gifted you a premium membership')).toBeVisible()
})
