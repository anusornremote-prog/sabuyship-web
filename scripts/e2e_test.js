const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'] 
  });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to Login page...");
    await page.goto('https://www.sabuyship.com/login');
    
    console.log("Typing credentials...");
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'sabuy@admin.com');
    await page.type('input[name="password"]', '123456');
    
    console.log("Submitting login form...");
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log("Logged in successfully. Current URL:", page.url());
    
    // Take a screenshot of the dashboard
    await page.screenshot({ path: 'screenshot_dashboard.png' });
    
    console.log("Navigating to Inquiry page...");
    await page.goto('https://www.sabuyship.com/inquiry');
    await page.waitForSelector('input[name="serviceType"]');
    
    console.log("Selecting IMPORT_ONLY...");
    await page.click('input[value="IMPORT_ONLY"]');
    
    console.log("Waiting for form to render correctly...");
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: 'screenshot_inquiry_page.png' });
    
    console.log("Screenshots captured! Exiting.");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();
