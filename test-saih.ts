import { chromium } from 'playwright';

async function testSaihAjax() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/219R02", { waitUntil: 'networkidle' });

    // The data table in Hidrosur is loaded via an Ajax call to a specific controller 'TraerDatosGrafica' or similar
    // Let's execute a script in the page context to fetch the data directly if available, or just wait longer

    // Actually, examining Hidrosur carefully, the graph is generated dynamically via an AJAX POST request to their API.
    // Instead of scraping the graph, it's easier to scrape the main table view: https://www.redhidrosurmedioambiente.es/saih/resumen/rio

    await page.goto("https://www.redhidrosurmedioambiente.es/saih/resumen/rio", { waitUntil: 'networkidle' });

    const html = await page.content();
    require('fs').writeFileSync('dump-saih-resumen.html', html);

    console.log("Saved summary page");
    await browser.close();
}

testSaihAjax();
