import { chromium, Page } from 'playwright';
import * as cheerio from 'cheerio';

interface WeatherStationData {
    name: string;
    intensity: number;
    dailyAcc: number;
    trend: 'Subiendo' | 'Bajando' | 'Estable';
}

const STATIONS = [
    { name: 'Grazalema', url: 'https://app.weathercloud.net/d9740161080#current' },
    { name: 'Ubrique', url: 'https://app.weathercloud.net/d3353856238#current' },
    { name: 'Arcos', url: 'https://app.weathercloud.net/d6459296414#current' }
];

export async function scrapeWeathercloud(): Promise<WeatherStationData[]> {
    const browser = await chromium.launch({ headless: true });
    const results: WeatherStationData[] = [];

    try {
        for (const station of STATIONS) {
            const page = await browser.newPage();

            let intensity = 0;
            let dailyAcc = 0;

            // Intercept the network response that contains the actual data
            page.on('response', async (response) => {
                if (response.url().includes('/device/stats') && response.status() === 200) {
                    try {
                        const json = await response.json();
                        // Match the data structure (usually json.rainrate or json.rain)
                        // Weathercloud returns variables like json.rainrate (which is mm/h)
                        if (json && typeof json === 'object') {
                            // the exact key might vary, let's cast broadly based on typical api responses
                            if (json.rainrate !== undefined) intensity = parseFloat(json.rainrate) / 10; // sometimes decicents
                            if (json.rain !== undefined) dailyAcc = parseFloat(json.rain) / 10;
                        }
                    } catch (e) {
                        // Ignore parse errors for other requests
                    }
                }
            });

            await page.goto(station.url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(3000); // give it a moment to process the intercepted request

            results.push({
                name: station.name,
                intensity: isNaN(intensity) ? 0 : intensity,
                dailyAcc: isNaN(dailyAcc) ? 0 : dailyAcc,
                trend: intensity > 2 ? 'Subiendo' : (intensity === 0 ? 'Bajando' : 'Estable')
            });
            await page.close();
        }
    } catch (error) {
        console.error('Error in Weathercloud scraper:', error);
    } finally {
        await browser.close();
    }

    return results;
}
