import * as cheerio from 'cheerio';

interface ReservoirData {
    name: string;
    volume: number; // hm³
    percentage: number; // %
    var1h: number; // +/- hm³
    desembalse: boolean;
}

const RESERVOIRS = [
    { name: 'Arcos', url: 'https://www.embalses.net/pantano-20-arcos.html' },
    { name: 'Bornos', url: 'https://www.embalses.net/pantano-38-bornos.html' },
    { name: 'Guadalcacín', url: 'https://www.embalses.net/pantano-345-guadalcacin.html' },
    { name: 'Hurones', url: 'https://www.embalses.net/pantano-360-los-hurones.html' }
];

export async function scrapeEmbalses(): Promise<ReservoirData[]> {
    const results: ReservoirData[] = [];

    try {
        for (const res of RESERVOIRS) {
            // Embalses blocks headless Playwright, but allows clean native fetches
            const response = await fetch(res.url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) width/1920 Chrome/120.0.0.0 Safari/537.36"
                }
            });

            if (!response.ok) throw new Error(`Fetch failed for ${res.url}`);
            const html = await response.text();

            const $ = cheerio.load(html);

            let volume = 0;
            let percentage = 0;
            let var1h = 0;

            const ogDesc = $('meta[property="og:description"]').attr('content');
            // e.g: "El embalse de Arcos acumula 14 hm3 (100.00%) igual que la semana anterior."
            // e.g: "El embalse de Arcos acumula 14 hm3 (100.00%) 2 hm3 mas que la semana anterior."

            if (ogDesc) {
                const hmMatch = ogDesc.match(/acumula ([\d]+) hm3/i);
                if (hmMatch) volume = parseInt(hmMatch[1], 10);

                const ptMatch = ogDesc.match(/\(([\d\.]+)\%\)/i);
                if (ptMatch) percentage = parseFloat(ptMatch[1]);

                // Variation from "... (X%) Y hm3 mas|menos que ..."
                const varMatch = ogDesc.match(/([\d]+) hm3 (mas|menos)/i);
                if (varMatch) {
                    const amount = parseInt(varMatch[1], 10);
                    var1h = varMatch[2].toLowerCase() === 'mas' ? amount : -amount;
                }
            }

            const desembalse = false; // Add heuristic or ignore for now

            results.push({
                name: res.name,
                volume: isNaN(volume) ? 0 : volume,
                percentage: isNaN(percentage) ? 0 : percentage,
                var1h: isNaN(var1h) ? 0 : var1h,
                desembalse
            });
        }
    } catch (error) {
        console.error('Error in Embalses scraper:', error);
    }

    return results;
}
