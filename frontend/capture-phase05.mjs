import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\chamo\\.gemini\\antigravity\\brain\\939ff739-c7ed-4912-842b-f43784cf5d1d';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function login(page, username, password) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
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

  // 1. Non-Digital Lab User - Proposal Submission Form
  console.log('Capturing Proposal Submission Page...');
  await login(page, 'demo.nondigitallab', 'DemoNonDigitalLab@2026!');
  await page.goto('http://localhost:5173/proposals/new', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_proposal_submission_form.png'), fullPage: false });

  // 2. Non-Digital Lab User - My Proposals List
  console.log('Capturing My Proposals List...');
  await page.goto('http://localhost:5173/proposals', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_my_proposals_list.png'), fullPage: false });

  // 3. DGM User - Proposal Review List
  console.log('Capturing DGM Proposals Review List...');
  await login(page, 'slt.dgm', 'DGM@SLT2026!');
  await page.goto('http://localhost:5173/proposals', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_dgm_proposals_review.png'), fullPage: false });

  // 4. DGM User - Proposal Evaluation Details Page
  console.log('Capturing DGM Proposal Evaluation Details Page...');
  // Find first proposal link from table/list or navigate
  const proposalLink = await page.$('a[href^="/proposals/"]');
  if (proposalLink) {
    await Promise.all([
      proposalLink.click(),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_dgm_proposal_evaluation_details.png'), fullPage: false });

  // 5. Notifications Page
  console.log('Capturing Notifications Stream...');
  await page.goto('http://localhost:5173/notifications', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_notifications_stream.png'), fullPage: false });

  await browser.close();
  console.log('Phase 05 screenshots captured successfully!');
}

runCapture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
