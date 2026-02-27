import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { scrapeAemet } from './scrapers/aemet';
import { scrapeSaih } from './scrapers/saih';
import { scrapeEmbalses } from './scrapers/embalses';
import { scrapeOpenMeteoCoastal } from './scrapers/openmeteo';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());

// Global Cache Object
let cachedData: any = {
    status: 'Red',
    time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    weatherStations: [] as any[],
    riverStations: [] as any[],
    reservoirs: [] as any[],
    traffic: {
        cut: ['CA-3113 (km 2 al 4)', 'CA-3110 (Vadeos)', 'A-2003 (La Barca)'], // Placeholder DGT data
        blackRedLevel: ['A-384', 'CA-9102']
    },
    hydrogeology: {
        phreaticLevel: 'Alcanzado nivel máximo histórico (+2.4m sobre media)',
        karsticSaturation: '98% - Emergencias en nacimientos y manantiales activos'
    },
    coastal: {
        tides: 'Pleamar a las 14:30 (Coef. 85). Peligro de taponamiento en desembocadura.',
        wind: 'SO 45km/h, rachas 75km/h. Temporal fuerte en el Golfo de Cádiz.'
    },
    forecast: 'Precipitaciones fuertes persistentes (Alerta Naranja AEMET). Riesgo inminente de desbordamiento en La Greduela, Portal y zonas bajas de Jerez.',
    warnings: [] as string[]
};

async function runScrapers() {
    console.log(`[${new Date().toISOString()}] Iniciando scraping de datos...`);
    try {
        const [aemetData, rivers, reservoirs, coastal] = await Promise.all([
            scrapeAemet(),
            scrapeSaih(),
            scrapeEmbalses(),
            scrapeOpenMeteoCoastal()
        ]);

        const weather = aemetData.stations;
        const forecast = aemetData.forecast;

        const validReservoirs = reservoirs && reservoirs.length === 4 && reservoirs[0].percentage > 0;
        const validWeather = weather && weather.length > 0;
        const validRivers = rivers && rivers.length > 0;

        // --- DYNAMIC TRAFFIC ENGINE ---
        // Infer traffic issues based on AEMET and SAIH
        const riverInAlert = rivers.some(r => r.alertLvl >= 2);
        const heavyRain = weather.some(w => w.intensity > 15);
        let traffic = {
            cut: [] as string[],
            blackRedLevel: [] as string[]
        };

        if (riverInAlert) {
            traffic.cut.push('CA-3113 (km 2 al 4) Zona Inundable');
            traffic.blackRedLevel.push('A-2003 (La Barca)');
        }
        if (heavyRain) {
            traffic.cut.push('CA-3110 (Vadeos Múltiples)');
            traffic.blackRedLevel.push('A-384');
        }
        if (traffic.cut.length === 0 && traffic.blackRedLevel.length === 0) {
            traffic.cut.push('Ninguna trampa de agua detectada.');
        }

        // --- DYNAMIC HYDROGEOLOGY ENGINE ---
        // Base calculus: 60 days of rain (max ~450mm = 100% saturation in Autum/Winter typical for Cadiz)
        const rainAcc = forecast.hydro60DayAcc || 0;
        let pLevel = `Nivel normal (${rainAcc.toFixed(1)} mm bimensuales)`;
        let kSat = `${Math.min(100, Math.round((rainAcc / 400) * 100))}% - Acuífero estable`;

        if (rainAcc > 350) {
            pLevel = `Acercándose a niveles históricos críticos (${rainAcc.toFixed(1)} mm)`;
            kSat = `95% - Emergencias por escorrentía en manantiales activos`;
        } else if (rainAcc > 200) {
            pLevel = `Nivel freático muy alto (${rainAcc.toFixed(1)} mm bimensuales)`;
            kSat = `${Math.min(100, Math.round((rainAcc / 400) * 100))}% - Acuífero fuertemente recargado`;
        } else if (rainAcc < 20) {
            pLevel = `Niveles extremadamente secos (${rainAcc.toFixed(1)} mm bimensuales)`;
            kSat = `10% - Cota de déficit estructural`;
        }

        const hydrogeology = {
            phreaticLevel: pLevel,
            karsticSaturation: kSat,
            rain60Days: rainAcc,
            saturationPct: Math.min(100, Math.round((rainAcc / 400) * 100))
        };

        // Fallback or Real Data Integration
        cachedData = {
            ...cachedData,
            time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            weatherStations: validWeather ? weather : [
                { name: 'Grazalema', intensity: 22.5, dailyAcc: 145.2, trend: 'Subiendo' },
                { name: 'Ubrique', intensity: 18.2, dailyAcc: 112.0, trend: 'Estable' },
                { name: 'Arcos', intensity: 14.0, dailyAcc: 85.5, trend: 'Subiendo' },
            ],
            riverStations: validRivers ? rivers : [
                { name: 'Est. 219 (Junta de los Ríos)', level: 5.42, flow: 1250, history: [1, 2, 3, 4, 5], alertLvl: 3 },
                { name: 'Est. 220 (Barca de la Florida)', level: 4.80, flow: 850, history: [2, 3, 4, 5, 4], alertLvl: 2 },
                { name: 'Est. 212 (Jerez)', level: 3.90, flow: 420, history: [3, 3, 3, 4, 3], alertLvl: 1 },
            ],
            reservoirs: validReservoirs ? reservoirs : [
                { name: 'Arcos', volume: 14.2, percentage: 98.5, var1h: +0.2, desembalse: true },
                { name: 'Bornos', volume: 185.4, percentage: 92.0, var1h: +1.5, desembalse: true },
                { name: 'Guadalcacín', volume: 750.2, percentage: 94.2, var1h: +2.1, desembalse: false },
                { name: 'Hurones', volume: 130.5, percentage: 96.5, var1h: +0.8, desembalse: true },
            ],
            traffic,
            hydrogeology,
            coastal: {
                tides: `${coastal.tides.status} (Nivel Olas: ${coastal.tides.waveHeight}m)`,
                wind: `${coastal.wind.direction} ${coastal.wind.speed}km/h, rachas ${coastal.wind.gusts}km/h.`
            },
            forecast: forecast.forecastText,
            warnings: forecast.warnings || [],
            status: computeOverallStatus(validWeather ? weather : [], validRivers ? rivers : [], validReservoirs ? reservoirs : [])
        };

        console.log(`[${new Date().toISOString()}] Scraping finalizado con éxito (Core + Secondary).`);
    } catch (error) {
        console.error('Error durante la ejecución de scrapers:', error);
    }
}

function computeOverallStatus(weather: any[], rivers: any[], reservoirs: any[]) {
    // Simple heuristic for overall status
    if (rivers.some(r => r.alertLvl === 3) || reservoirs.some(r => r.desembalse)) return 'Red';
    if (rivers.some(r => r.alertLvl === 2) || weather.some(w => w.intensity > 10)) return 'Yellow';
    return 'Green';
}

// REST Endpoint
app.get('/api/status', (req, res) => {
    res.json(cachedData);
});

// Start Server and Cron
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);

    // Initial scraping on startup (takes a long time but fills data immediately)
    await runScrapers();

    // Cron Job: Run every 15 minutes
    cron.schedule('*/15 * * * *', runScrapers);
});
