const { chromium } = require('playwright');

(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
        
        await page.goto('file:///c:/Users/lifa2/OneDrive/Desktop/Instatools/index.html', { waitUntil: 'networkidle' });
        
        await browser.close();
    } catch (e) {
        console.error('SCRIPT ERROR:', e);
    }
})();
