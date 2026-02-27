import { chromium } from 'playwright';

async function interceptDGT() {
    console.log("Launching browser to inspect DGT network traffic...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Intercept all network responses
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('json') || url.includes('incidencias') || url.includes('api') || url.includes('Elementos')) {
            try {
                // Try to get JSON or text
                const text = await response.text();
                if (text.length > 0 && text.length < 50000) {
                    console.log(`\n[INTERCEPT] ${url}`);
                    console.log(`Length: ${text.length}. Snippet: ${text.substring(0, 200)}`);
                } else if (text.length >= 50000) {
                    console.log(`\n[INTERCEPT HUGE FILE] ${url} (Length: ${text.length})`);
                }
            } catch (e) {
                // Ignore incomplete or unreadable streams
            }
        }
    });

    try {
        await page.goto('https://infocar.dgt.es/etraffic/', { waitUntil: 'networkidle' });
        console.log("Waiting 5 seconds for map data to load...");
        await page.waitForTimeout(5000);
    } catch (e) {
        console.error("Navigation Error:", e);
    }

    await browser.close();
}

interceptDGT();
