const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'] 
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. Login as Customer
    console.log("Navigating to Login page (Customer)...");
    await page.goto('https://www.sabuyship.com/login', { waitUntil: 'networkidle0' });
    
    await page.waitForSelector('input[name="email"]');
    
    // Clear and type
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="email"]', 'sabuy@admin.com');
    
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="password"]', '123456');
    
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log("Logged in as Customer successfully.");
    
    // Go to Inquiry Page
    console.log("Navigating to Inquiry creation...");
    await page.goto('https://www.sabuyship.com/inquiry', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="serviceType"]');
    
    // Fill out inquiry form
    await page.type('input[placeholder*="http"]', 'https://example.taobao.com/item1');
    await page.click('input[value="CAR"]'); // Check CAR shipping
    
    console.log("Submitting Inquiry...");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // Wait for success
    
    await page.screenshot({ path: path.join(__dirname, 'screenshot_inquiry_success.png') });
    console.log("Inquiry submitted.");
    
    // Logout
    console.log("Logging out...");
    await page.goto('https://www.sabuyship.com/dashboard/profile', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
       const btns = Array.from(document.querySelectorAll('button'));
       const logoutBtn = btns.find(b => b.innerText.includes('ออกจากระบบ') || b.innerText.includes('Logout'));
       if (logoutBtn) logoutBtn.click();
    });
    await page.waitForTimeout(2000);

    // 2. Login as Admin
    console.log("Navigating to Login page (Admin)...");
    await page.goto('https://www.sabuyship.com/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="email"]');
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="email"]', 'test@admin.com');
    
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="password"]', '123456');
    
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log("Logged in as Admin successfully.");

    // Go to Admin Inquiries
    console.log("Navigating to Admin Inquiries...");
    await page.goto('https://www.sabuyship.com/admin/inquiries', { waitUntil: 'networkidle0' });
    
    await page.screenshot({ path: path.join(__dirname, 'screenshot_admin_inquiries.png') });

    // Click "เสนอราคา" on the first item
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const quoteBtn = btns.find(b => b.innerText.includes('เสนอราคา'));
        if (quoteBtn) quoteBtn.click();
    });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: path.join(__dirname, 'screenshot_admin_quote_modal.png') });

    console.log("Deep dive test completed successfully!");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();
