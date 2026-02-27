import { chromium } from 'playwright';

async function scrapeDgtList() {
    console.log("Launching browser to UI-scrape DGT incidents...");
    const browser = await chromium.launch({ headless: true });

    try {
        const page = await browser.newPage();

        // Go to DGT map (it usually loads the whole map of Spain)
        await page.goto('https://infocar.dgt.es/etraffic/', { waitUntil: 'networkidle' });
        console.log("Page loaded. Waiting 5s for React to render...");
        await page.waitForTimeout(5000);

        // Let's dump the text content of the body to see if there is a list of incidents rendered anywhere,
        // or look for characteristic classes like "incidencia", "panel", "listado"
        const bodyText = await page.evaluate(() => document.body.innerText);
        console.log("Body text length:", bodyText.length);
        console.log("Snippet:\n", bodyText.substring(0, 500));

        // Are there standard list items?
        const listItems = await page.locator('li').count();
        console.log("Number of list items:", listItems);

        // Print HTML snippet to find the exact DOM structure
        const html = await page.content();
        console.log("HTML snippet containing 'Cádiz':", html.substring(html.indexOf('Cádiz') - 100, html.indexOf('Cádiz') + 100));

    } catch (e) {
        console.error("Scraping Error:", e);
    } finally {
        await browser.close();
    }
}

scrapeDgtList();
