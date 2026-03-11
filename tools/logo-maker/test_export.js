const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Listen to console and page errors
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.error('BROWSER ERROR:', error));

    try {
        console.log("Navigating to local page...");
        await page.goto('http://127.0.0.1:8080/index.html');
        
        console.log("Waiting for library to load...");
        await page.waitForTimeout(1000);
        
        console.log("Clicking Export (PNG)...");
        // The PNG export button
        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 10000 }),
            page.click('.logo-export-btn[data-format="png"]')
        ]);

        console.log("Download triggered:", await download.path());
        
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await browser.close();
    }
})();
