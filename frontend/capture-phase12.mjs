import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

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

  // 1. Log in as Supervisor and navigate to chat
  console.log('Capturing: Chat Room with Attachment Message Cards...');
  await login(page, 'demo.digitallab', 'DemoDigitalLab@2026!');

  await page.goto('http://127.0.0.1:5173/messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 42: Chat conversation showing attachment cards (PDF, DOCX, PNG) with View and Download buttons
  const screenshot42Path = path.join(SCREENSHOT_DIR, '42_chat_attachment_message_card.png');
  await page.screenshot({ path: screenshot42Path, fullPage: false });
  console.log('Saved 42_chat_attachment_message_card.png');

  // 2. Select a file to demonstrate Attachment Upload UI with Preview Banner
  console.log('Capturing: Chat Attachment Upload UI with Preview Banner...');
  const testUploadFile = path.join(ARTIFACT_DIR, 'scratch', 'demo_spec.pdf');
  fs.writeFileSync(testUploadFile, '%PDF-1.5 Mock Architecture Specification Document for SLT Project');

  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(testUploadFile);
    await new Promise(r => setTimeout(r, 600));

    // Type optional comment in the textarea
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type('Please review the attached SLT System Architecture Specification for handover validation.');
    }
  }

  // Screenshot 41: Chat UI with '+' attachment button, selected file preview card, size, remove action, and Upload & Send button
  const screenshot41Path = path.join(SCREENSHOT_DIR, '41_chat_attachment_upload_ui.png');
  await page.screenshot({ path: screenshot41Path, fullPage: false });
  console.log('Saved 41_chat_attachment_upload_ui.png');

  // 3. Log in as DGM to show DGM's perspective with View / Download controls
  console.log('Capturing: DGM Project Collaboration & File Sharing View...');
  await login(page, 'slt.dgm', 'DGM@SLT2026!');
  await page.goto('http://127.0.0.1:5173/messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const screenshot43Path = path.join(SCREENSHOT_DIR, '43_chat_attachment_download.png');
  await page.screenshot({ path: screenshot43Path, fullPage: false });
  console.log('Saved 43_chat_attachment_download.png');

  await browser.close();
  console.log('Phase 12 screenshots captured successfully!');
}

runCapture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
