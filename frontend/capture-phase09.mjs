import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\chamo\\.gemini\\antigravity\\brain\\939ff739-c7ed-4912-842b-f43784cf5d1d';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');

async function login(page, username, password) {
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  await page.type('#username', username);
  await page.type('#password', password);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);
  await new Promise(r => setTimeout(r, 1000));
}

async function runCapture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  // 1. ADMIN - Admin Control Center Dashboard
  console.log('Capturing Role 1: Admin Dashboard...');
  await login(page, 'slt.admin', 'Admin@SLT2026!');
  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '29_admin_dashboard_hardened.png'), fullPage: false });

  // 2. DGM - DGM Governance Dashboard
  console.log('Capturing Role 2: DGM Dashboard...');
  await login(page, 'slt.dgm', 'DGM@SLT2026!');
  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '30_dgm_dashboard_live.png'), fullPage: false });

  // 3. HIGHER MANAGEMENT - Executive Portfolio Dashboard & Reports
  console.log('Capturing Role 3: Higher Management Dashboard...');
  await login(page, 'slt.management', 'Mgmt@SLT2026!');
  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '31_higher_management_dashboard_live.png'), fullPage: false });

  console.log('Capturing Role 3: Executive Performance Reports Matrix...');
  await page.goto('http://127.0.0.1:5173/reports', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '32_executive_reports_matrix.png'), fullPage: false });

  // 4. DIGITAL LAB USER - Digital Lab Workspace & Project Handover Details
  console.log('Capturing Role 4: Digital Lab Workspace...');
  await login(page, 'demo.digitallab', 'DemoDigitalLab@2026!');
  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '33_digital_lab_workspace_live.png'), fullPage: false });

  console.log('Capturing Role 4: Project Lifecycle & Handover Details...');
  await page.goto('http://127.0.0.1:5173/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const viewLink = await page.$('a[href*="/projects/"]');
  if (viewLink) {
    await viewLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '34_project_lifecycle_verified.png'), fullPage: false });
  }

  // 5. NON-DIGITAL LAB USER - Department Workspace & Proposal Tracking
  console.log('Capturing Role 5: Non-Digital Lab Department Workspace...');
  await login(page, 'demo.nondigitallab', 'DemoNonDigitalLab@2026!');
  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '35_non_digital_lab_workspace_live.png'), fullPage: false });

  console.log('Capturing Real-Time Project Chat Stream...');
  await page.goto('http://127.0.0.1:5173/messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '36_project_chat_live_stream.png'), fullPage: false });

  await browser.close();
  console.log('Phase 09 screenshots captured successfully!');
}

runCapture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
