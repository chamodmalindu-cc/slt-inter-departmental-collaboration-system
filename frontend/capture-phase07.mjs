import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\chamo\\.gemini\\antigravity\\brain\\939ff739-c7ed-4912-842b-f43784cf5d1d';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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

  // 1. Digital Lab Supervisor - Main Chat View
  console.log('Capturing Supervisor Project Chat Page...');
  await login(page, 'demo.digitallab', 'DemoDigitalLab@2026!');
  await page.goto('http://127.0.0.1:5173/messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Type a new message in the chat input and press Enter
  const textarea = await page.$('textarea');
  if (textarea) {
    await textarea.type('SignalR WebSockets connection verified. Telemetry packet streaming initiated.');
    await new Promise(r => setTimeout(r, 400));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 800));
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_project_chat_main_supervisor.png'), fullPage: false });

  // 2. DGM User - Chat View
  console.log('Capturing DGM Project Chat View...');
  await login(page, 'slt.dgm', 'DGM@SLT2026!');
  await page.goto('http://127.0.0.1:5173/messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_project_chat_dgm_view.png'), fullPage: false });

  // 3. Project Requester - Chat View
  console.log('Capturing Requester Project Chat View...');
  await login(page, 'demo.nondigitallab', 'DemoNonDigitalLab@2026!');
  await page.goto('http://127.0.0.1:5173/messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_project_chat_requester_view.png'), fullPage: false });

  // 4. Notifications Stream showing Chat Notifications
  console.log('Capturing Notifications Stream with Chat Events...');
  await page.goto('http://127.0.0.1:5173/notifications', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_chat_notifications_stream.png'), fullPage: false });

  // 5. Proposal Details showing Open Project Chat Button
  console.log('Capturing Proposal Details with Open Chat Button...');
  await page.goto('http://127.0.0.1:5173/proposals/b124ba14-17e2-4399-8af4-7450fe097282', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21_proposal_details_with_chat_button.png'), fullPage: false });

  // 6. Assignment Details showing Open Project Chat Button
  console.log('Capturing Assignment Details with Open Chat Button...');
  await login(page, 'demo.digitallab', 'DemoDigitalLab@2026!');
  await page.goto('http://127.0.0.1:5173/assignments/b59d3c4d-0a2b-4e8a-8775-4a14a09137de', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22_assignment_details_with_chat_button.png'), fullPage: false });

  await browser.close();
  console.log('Phase 07 screenshots captured successfully!');
}

runCapture().catch(err => {
  console.error('Error during Phase 07 capture:', err);
  process.exit(1);
});
