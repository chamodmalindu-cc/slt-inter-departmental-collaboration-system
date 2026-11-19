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
  await new Promise(r => setTimeout(r, 800));
}

async function runCapture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  // 1. Supervisor Projects List
  console.log('Capturing Supervisor Projects List...');
  await login(page, 'demo.digitallab', 'DemoDigitalLab@2026!');
  await page.goto('http://127.0.0.1:5173/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23_supervisor_projects_list.png'), fullPage: false });

  // 2. Supervisor Project Details with Lifecycle Timeline & Handover Record
  console.log('Capturing Supervisor Project Details...');
  // Click first view button or go to the first project
  const viewLink = await page.$('a[href*="/projects/"]');
  if (viewLink) {
    await viewLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '24_supervisor_project_details.png'), fullPage: false });

    // Click Progress tab
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.toLowerCase().includes('progress')) {
        await b.click();
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '25_project_progress_updates.png'), fullPage: false });
        break;
      }
    }

    // Click Handover tab
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.toLowerCase().includes('handover')) {
        await b.click();
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '26_project_handover_details.png'), fullPage: false });
        break;
      }
    }

    // Click Ratings tab
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.toLowerCase().includes('ratings')) {
        await b.click();
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '27_project_ratings_evaluation.png'), fullPage: false });
        break;
      }
    }
  }

  // 3. Higher Management Dashboard with completion rate & supervisor performance
  console.log('Capturing Higher Management Dashboard...');
  await login(page, 'slt.management', 'Mgmt@SLT2026!');
  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '28_higher_management_lifecycle_dashboard.png'), fullPage: false });

  await browser.close();
  console.log('Phase 08 screenshots captured successfully!');
}

runCapture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
