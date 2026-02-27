import { chromium } from 'playwright';
import fs from 'fs';

async function dump() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log("Dumping Weathercloud...");
    await page.goto("https://app.weathercloud.net/d9740161080#current", { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait for vue rendering
    const htmlW = await page.content();
    fs.writeFileSync('dump-weather.html', htmlW);

    console.log("Dumping SAIH...");
    await page.goto("https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/219R02", { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    const htmlS = await page.content();
    fs.writeFileSync('dump-saih.html', htmlS);

    console.log("Dumping Embalses...");
    await page.goto("https://www.embalses.net/pantano-20-arcos.html", { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    const htmlE = await page.content();
    fs.writeFileSync('dump-embalses.html', htmlE);

    await browser.close();
    console.log("Done");
}

dump();
