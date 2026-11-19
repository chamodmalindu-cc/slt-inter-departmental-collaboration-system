import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\chamo\\.gemini\\antigravity\\brain\\939ff739-c7ed-4912-842b-f43784cf5d1d';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const ROLES = [
  { name: '01_admin_dashboard', username: 'slt.admin', password: 'Admin@SLT2026!' },
  { name: '02_dgm_dashboard', username: 'slt.dgm', password: 'DGM@SLT2026!' },
  { name: '03_higher_management_dashboard', username: 'slt.management', password: 'Mgmt@SLT2026!' },
  { name: '04_digital_lab_dashboard', username: 'demo.digitallab', password: 'DemoDigitalLab@2026!' },
  { name: '05_non_digital_lab_dashboard', username: 'demo.nondigitallab', password: 'DemoNonDigitalLab@2026!' }
];

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  for (const role of ROLES) {
    console.log(`Logging in as ${role.username}...`);
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    // Fill credentials
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });

    await page.type('#username', role.username);
    await page.type('#password', role.password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Give 1 second for any subtle animations or rendering to settle
    await new Promise(r => setTimeout(r, 1000));

    const filePath = path.join(SCREENSHOT_DIR, `${role.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved screenshot: ${filePath}`);
  }

  await browser.close();
  console.log('All 5 role dashboard screenshots successfully captured!');
}

capture().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
