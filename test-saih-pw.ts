import { chromium } from 'playwright';
import * as fs from 'fs';
import * as cheerio from 'cheerio';

async function testSaih() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log("Navigating to Junta de los Rios...");
    await page.goto('https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/219R02', { waitUntil: 'networkidle', timeout: 30000 });

    await page.waitForTimeout(5000);

    const html = await page.content();
    fs.writeFileSync('dump-saih-pw.html', html);
    await page.screenshot({ path: 'saih-219.png', fullPage: true });

    const $ = cheerio.load(html);

    // They probably show some table with 'Nivel' and 'Caudal'
    console.log("Looking for metrics...");

    const tables = $('table');
    console.log(`Found ${tables.length} tables`);

    // find elements that contain 'Nivel' or 'Caudal'
    const allText = $('body').text().replace(/\s+/g, ' ');
    if (allText.toLowerCase().includes('nivel')) {
        console.log("Nivel keyword found in body!");
    }

    await browser.close();
}

testSaih();
