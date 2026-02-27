import { scrapeSaih } from './src/scrapers/saih';

async function testSaih() {
    console.log("Testing new native SAIH scraper...");
    const data = await scrapeSaih();
    console.dir(data, { depth: null });
}

testSaih();
