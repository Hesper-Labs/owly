import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:3000';
const DIR = './docs/screenshots';

const pages = [
  { name: '01-login', path: '/login', needsLogout: true },
  { name: '02-dashboard', path: '/' },
  { name: '03-conversations', path: '/conversations' },
  { name: '04-customers', path: '/customers' },
  { name: '05-knowledge-base', path: '/knowledge' },
  { name: '06-canned-responses', path: '/canned-responses' },
  { name: '07-automation', path: '/automation' },
  { name: '08-business-hours', path: '/business-hours' },
  { name: '09-team', path: '/team' },
  { name: '10-tickets', path: '/tickets' },
  { name: '11-sla-rules', path: '/sla' },
  { name: '12-channels', path: '/channels' },
  { name: '13-webhooks', path: '/webhooks' },
  { name: '14-analytics', path: '/analytics' },
  { name: '15-activity-log', path: '/activity' },
  { name: '16-admin', path: '/admin' },
  { name: '17-api-docs', path: '/api-docs' },
  { name: '18-settings', path: '/settings' },
];

async function run() {
  await mkdir(DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Take login screenshot first
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input', { timeout: 5000 });
  await page.screenshot({ path: `${DIR}/01-login.png`, fullPage: false });
  console.log('Screenshot: 01-login');

  // Login
  await page.type('input[placeholder="Enter your username"]', 'admin');
  await page.type('input[placeholder="Enter your password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // Take rest of screenshots
  for (const p of pages.slice(1)) {
    await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `${DIR}/${p.name}.png`, fullPage: false });
    console.log(`Screenshot: ${p.name}`);
  }

  // Dark mode - dashboard
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('owly-theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 }));
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${DIR}/19-dark-mode.png`, fullPage: false });
  console.log('Screenshot: 19-dark-mode');

  // Knowledge base with FAQ selected
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
  });
  await page.goto(`${BASE}/knowledge`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  // Click first category
  const catBtn = await page.$('div[class*="cursor-pointer"]');
  if (catBtn) await catBtn.click();
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: `${DIR}/20-knowledge-detail.png`, fullPage: false });
  console.log('Screenshot: 20-knowledge-detail');

  await browser.close();
  console.log('All screenshots saved to', DIR);
}

run().catch(console.error);
