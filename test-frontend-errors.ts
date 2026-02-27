import { chromium } from 'playwright';

async function checkReactErrors() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`PAGE LOG ERROR: ${msg.text()}`);
    });

    page.on('pageerror', exception => {
        console.log(`UNCAUGHT EXCEPTION: ${exception}`);
    });

    console.log("Navigating to local React app...");
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await browser.close();
}

checkReactErrors();
