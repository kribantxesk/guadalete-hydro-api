export interface RiverStationData {
    name: string;
    level: number;
    flow: number;
    history: number[];
    alertLvl: 1 | 2 | 3;
}

const STATIONS = [
    { id: '219', name: 'Est. 219 (Junta de los Ríos)', url: 'https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/219R02' },
    { id: '220', name: 'Est. 220 (Barca de la Florida)', url: 'https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/220R02' },
    { id: '212', name: 'Est. 212 (Jerez)', url: 'https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/212R02' } // Assuming this exists, fallback if not
];

export async function scrapeSaih(): Promise<RiverStationData[]> {
    const results: RiverStationData[] = [];

    try {
        for (const station of STATIONS) {
            const response = await fetch(station.url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) width/1920 Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
                }
            });

            let level = 0;
            let flow = 0; // Not available easily via graph, fallback to 0 or estimated
            let history: number[] = [];

            if (response.ok) {
                const html = await response.text();

                // The data is inside a script tag: var serie1 = [2.85, 2.84, ..., 1.5];
                const match = html.match(/var serie1 = \[([^\]]+)\]/);
                if (match && match[1]) {
                    const valuesArray = match[1].split(',').map(v => v.trim());

                    // Extract valid numbers for history
                    const parsedValues = valuesArray
                        .map(v => parseFloat(v))
                        .filter(v => !isNaN(v));

                    if (parsedValues.length > 0) {
                        level = parsedValues[parsedValues.length - 1]; // last valid number
                        // Take up to 24 last points for the trend graph
                        history = parsedValues.slice(-24);
                    }
                }
            }

            // Calculate alert level based on some thresholds
            let alertLvl: 1 | 2 | 3 = 1;
            if (level > 4) alertLvl = 2;
            if (level > 5.5) alertLvl = 3;

            results.push({
                name: station.name,
                level: isNaN(level) ? 0 : level,
                flow: flow,
                history,
                alertLvl
            });
        }
    } catch (error) {
        console.error('Error in SAIH native scraper:', error);
    }

    return results;
}
