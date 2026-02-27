import { scrapeAemet } from "./src/scrapers/aemet";

async function testAemet() {
    console.log("Testing AEMET API...");
    try {
        const data = await scrapeAemet();
        console.dir(data, { depth: null });
    } catch (e) {
        console.error(e);
    }
}

testAemet();
