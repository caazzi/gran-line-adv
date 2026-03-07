const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error')
            console.log(`PAGE ERROR: ${msg.text()}`);
        else
            console.log(`PAGE LOG: ${msg.text()}`);
    });

    page.on('pageerror', error => {
        console.log(`PAGE EXCEPTION: ${error.message}`);
    });

    try {
        const response = await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
        console.log(`Status: ${response.status()}`);
    } catch (err) {
        console.error(`Navigation Error: ${err.message}`);
    }

    await browser.close();
})();
