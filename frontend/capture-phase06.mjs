import puppeteer from 'puppeteer';
import fs from 'fs';
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
  await new Promise(r => setTimeout(r, 600));
}

async function runCapture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  // 1. Digital Lab Supervisor - My Assignments (showing Pending Acceptance action cards)
  console.log('Capturing Supervisor My Assignments Page (with Pending Acceptance)...');
  await login(page, 'demo.digitallab', 'DemoDigitalLab@2026!');
  await page.goto('http://127.0.0.1:5173/assignments', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_supervisor_my_assignments.png'), fullPage: false });

  // 2. Click Decline button on the pending card to show Decline modal with mandatory reason
  console.log('Capturing Supervisor Decline Modal...');
  const declineBtn = await page.$('button.bg-rose-50, button[class*="text-rose-700"]');
  if (declineBtn) {
    await declineBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_supervisor_decline_modal.png'), fullPage: false });
  }

  await browser.close();
  console.log('Screenshots re-captured successfully!');
}

runCapture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
