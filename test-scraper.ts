import { scrapeWeathercloud } from './src/scrapers/weathercloud';
import { scrapeSaih } from './src/scrapers/saih';
import { scrapeEmbalses } from './src/scrapers/embalses';

async function test() {
    console.log("Testing Weathercloud...");
    try {
        const w = await scrapeWeathercloud();
        console.dir(w, { depth: null });
    } catch (e) {
        console.error(e);
    }

    console.log("Testing SAIH...");
    try {
        const s = await scrapeSaih();
        console.dir(s, { depth: null });
    } catch (e) {
        console.error(e);
    }

    console.log("Testing Embalses...");
    try {
        const e = await scrapeEmbalses();
        console.dir(e, { depth: null });
    } catch (err) {
        console.error(err);
    }
}

test();
