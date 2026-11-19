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

  // 1. Progress Update Form - Text Field Visibility Check
  console.log('Capturing: Progress Update Form (Text Visibility Fix)...');
  await login(page, 'demo.digitallab', 'DemoDigitalLab@2026!');
  
  // Go to projects and find a project with active status
  await page.goto('http://127.0.0.1:5173/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const viewLinks = await page.$$('a[href*="/projects/"]');
  if (viewLinks.length > 0) {
    await viewLinks[0].click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Try finding the Add Progress Update button or navigate directly
    const currentUrl = page.url();
    const projectId = currentUrl.split('/projects/')[1];
    if (projectId) {
      await page.goto(`http://127.0.0.1:5173/projects/${projectId}/progress/new`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 800));
      // Type in text to clearly show dark, high-contrast text visibility
      const descInput = await page.$('textarea');
      if (descInput) {
        await descInput.type('Optical telemetry testing passed 100% benchmark with dark readable font.');
      }
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '37_progress_update_form_text_visibility.png'), fullPage: false });
    }
  }

  // 2. Project Chat Page - Real-time SignalR Active & Restyled
  console.log('Capturing: Real-Time Project Chat Clean View...');
  await page.goto('http://127.0.0.1:5173/messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '38_project_chat_realtime_fixed.png'), fullPage: false });

  // 3. User Profile Page - View-Only Restricted Profile
  console.log('Capturing: View-Only Restricted Profile Page...');
  await page.goto('http://127.0.0.1:5173/profile', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '39_view_only_profile_restricted.png'), fullPage: false });

  // 4. Higher Management Dashboard - Cleaned UI Without Debug Banners
  console.log('Capturing: Higher Management Dashboard (Clean UI)...');
  await login(page, 'slt.management', 'Mgmt@SLT2026!');
  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '40_higher_management_dashboard_cleaned.png'), fullPage: false });

  await browser.close();
  console.log('Phase 10 screenshots captured successfully!');
}

runCapture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
