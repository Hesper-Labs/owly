import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { mkdirSync, readdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const FRAMES_DIR = '/tmp/owly-gif-frames';
const OUTPUT = './docs/demo.gif';

const pages = [
  { path: '/', wait: 2500, label: 'Dashboard' },
  { path: '/conversations', wait: 2000, label: 'Conversations' },
  { path: '/customers', wait: 2000, label: 'Customers' },
  { path: '/knowledge', wait: 2000, label: 'Knowledge Base' },
  { path: '/tickets', wait: 2000, label: 'Tickets' },
  { path: '/canned-responses', wait: 2000, label: 'Canned Responses' },
  { path: '/automation', wait: 2000, label: 'Automation' },
  { path: '/channels', wait: 2000, label: 'Channels' },
  { path: '/analytics', wait: 2500, label: 'Analytics' },
  { path: '/team', wait: 2000, label: 'Team' },
  { path: '/business-hours', wait: 2000, label: 'Business Hours' },
  { path: '/admin', wait: 2000, label: 'Administration' },
  { path: '/api-docs', wait: 2000, label: 'API Docs' },
  { path: '/settings', wait: 2000, label: 'Settings' },
];

async function run() {
  mkdirSync(FRAMES_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[placeholder="Enter your username"]', 'admin');
  await page.type('input[placeholder="Enter your password"]', 'admin123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  let frameIndex = 0;

  for (const p of pages) {
    console.log(`Capturing: ${p.label}`);
    await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, p.wait));

    // Take multiple frames for each page (for longer display)
    for (let i = 0; i < 3; i++) {
      const num = String(frameIndex++).padStart(4, '0');
      await page.screenshot({ path: `${FRAMES_DIR}/frame-${num}.png` });
    }
  }

  // Dark mode bonus
  console.log('Capturing: Dark Mode');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await new Promise(r => setTimeout(r, 1000));
  for (let i = 0; i < 3; i++) {
    const num = String(frameIndex++).padStart(4, '0');
    await page.screenshot({ path: `${FRAMES_DIR}/frame-${num}.png` });
  }

  await browser.close();

  // Convert to GIF using ffmpeg
  console.log('Creating GIF...');
  try {
    execSync(`ffmpeg -y -framerate 1 -i ${FRAMES_DIR}/frame-%04d.png -vf "scale=700:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" -loop 0 ${OUTPUT}`, { stdio: 'pipe' });
    console.log(`GIF saved to ${OUTPUT}`);
  } catch (e) {
    console.log('ffmpeg not found, trying convert (ImageMagick)...');
    try {
      execSync(`convert -delay 100 -loop 0 -resize 700x ${FRAMES_DIR}/frame-*.png ${OUTPUT}`, { stdio: 'pipe' });
      console.log(`GIF saved to ${OUTPUT}`);
    } catch {
      console.log('Neither ffmpeg nor ImageMagick found. Installing ffmpeg...');
      execSync('brew install ffmpeg', { stdio: 'inherit' });
      execSync(`ffmpeg -y -framerate 1 -i ${FRAMES_DIR}/frame-%04d.png -vf "scale=700:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" -loop 0 ${OUTPUT}`, { stdio: 'pipe' });
      console.log(`GIF saved to ${OUTPUT}`);
    }
  }
}

run().catch(console.error);
