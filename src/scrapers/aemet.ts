export interface WeatherStationData {
    name: string;
    intensity: number; // mm/h
    dailyAcc: number; // mm
    trend: 'Subiendo' | 'Bajando' | 'Estable';
}

export interface AemetForecastData {
    forecastText: string;
    probabilityPrecipitation: number;
    hydro60DayAcc: number;
    warnings: string[];
}

const AEMET_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJrcmliYW50eGVza0BnbWFpbC5jb20iLCJqdGkiOiJjODVmMDI3NC03YzA0LTQ1ODktYmJkNy0zMDdlZTg3MGFmMDIiLCJpc3MiOiJBRU1FVCIsImlhdCI6MTc3MTc4NTYzNSwidXNlcklkIjoiYzg1ZjAyNzQtN2MwNC00NTg5LWJiZDctMzA3ZWU4NzBhZjAyIiwicm9sZSI6IiJ9.R_1TDlmRsFnyuflIRKFIfOwZecEHYAekkx-ESxdFHfU";

// ID of stations in Cadiz (Grazalema, Ubrique, etc. if available)
// Grazalema: 5973
// Other stations nearby might be relevant. Let's fetch all and filter by province 'Cádiz' or specific substrings
const TARGET_STATIONS = ['Grazalema', 'Ubrique', 'Arcos', 'Jerez', 'Cádiz'];

export async function scrapeAemet(): Promise<{ stations: WeatherStationData[], forecast: AemetForecastData }> {
    const results: WeatherStationData[] = [];
    const forecastData: AemetForecastData = {
        forecastText: "Periodo Estable",
        probabilityPrecipitation: 0,
        hydro60DayAcc: 0,
        warnings: []
    };

    try {
        // 1. Request the data URL
        const urlRequest = `https://opendata.aemet.es/opendata/api/observacion/convencional/todas?api_key=${AEMET_API_KEY}`;
        const response1 = await fetch(urlRequest);
        if (!response1.ok) throw new Error(`AEMET API request failed: ${response1.status}`);
        const data1 = await response1.json();

        if (data1.estado !== 200) {
            throw new Error(`AEMET returned state ${data1.estado}: ${data1.descripcion}`);
        }

        // 2. Fetch the actual data payload
        const response2 = await fetch(data1.datos);
        if (!response2.ok) throw new Error("Failed to fetch AEMET data payload");
        const observations = await response2.json();

        const latestByStation = new Map<string, any>();

        // Loop observations (they come ordered or we can pick the latest)
        for (const obs of observations) {
            if (obs.prov === 'CÁDIZ' || obs.prov === 'CADIZ' || TARGET_STATIONS.some(ts => obs.ubi.includes(ts.toUpperCase()))) {
                const ubi = obs.ubi;
                // keep the most recent observation for this station
                if (!latestByStation.has(ubi) || obs.fint > latestByStation.get(ubi).fint) {
                    latestByStation.set(ubi, obs);
                }
            }
        }

        // 3. Parse and format results
        const finalResults = new Map<string, WeatherStationData>();

        for (const [ubi, obs] of latestByStation.entries()) {
            let matchedName = TARGET_STATIONS.find(ts => ubi.includes(ts.toUpperCase()));
            if (matchedName) {
                // Keep the max precipitation if multiple stations match one city
                const existing = finalResults.get(matchedName);
                const prec = obs.prec || 0;

                if (!existing || prec > existing.dailyAcc) {
                    finalResults.set(matchedName, {
                        name: matchedName,
                        intensity: prec, // approximating intensity from period precip
                        dailyAcc: prec,
                        trend: prec > 0.5 ? 'Subiendo' : (prec === 0 ? 'Bajando' : 'Estable')
                    });
                }
            }
        }

        // Ensure all required frontend stations exist even if data is missing
        for (const st of ['Grazalema', 'Ubrique', 'Arcos']) {
            if (finalResults.has(st)) {
                results.push(finalResults.get(st)!);
            } else {
                results.push({ name: st, intensity: 0, dailyAcc: 0, trend: 'Estable' });
            }
        }

        // === PART 2: Forecast for Jerez/Cadiz ===
        try {
            const predUrl = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/11020?api_key=${AEMET_API_KEY}`;
            const resPred = await fetch(predUrl, { signal: AbortSignal.timeout(5000) });
            const datPred = await resPred.json();

            if (datPred.estado === 200) {
                const r2 = await fetch(datPred.datos);
                const data = await r2.json();
                const today = data[0].prediccion.dia[0];

                const prob = today.probPrecipitacion[0]?.value || 0;
                forecastData.probabilityPrecipitation = parseInt(prob);

                const desc = today.estadoCielo[0]?.descripcion || "Despejado";
                forecastData.forecastText = `Cielo ${desc} con ${prob}% de probabilidad de lluvia.`;
            }
        } catch (e) {
            console.error('Error fetching AEMET forecast:', e);
        }

        // === PART 3: 60-Day Historical Rain for Hydrogeology ===
        try {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 60); // Changed from 30 to 60 days
            const formatDate = (date: Date) => date.toISOString().split('T')[0] + "T00:00:00UTC";

            // Jerez Airport Station ID: 5960
            const histUrl = `https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/datos/fechaini/${formatDate(start)}/fechafin/${formatDate(end)}/estacion/5960?api_key=${AEMET_API_KEY}`;
            const resHist = await fetch(histUrl, { signal: AbortSignal.timeout(5000) });
            const datHist = await resHist.json();

            if (datHist.estado === 200) {
                const dataRes = await fetch(datHist.datos);
                const dataHist = await dataRes.json();
                let totalPrec = 0;
                dataHist.forEach((day: any) => {
                    let p = day.prec;
                    if (p === 'Ip') p = '0.0';
                    if (p) totalPrec += parseFloat(p.replace(',', '.'));
                });
                forecastData.hydro60DayAcc = totalPrec;
            }
        } catch (e) {
            console.error('Error fetching AEMET 60-day history:', e);
        }

        // === PART 4: Weather Warnings (Avisos) for Cadiz ===
        try {
            const avisosUrl = `https://opendata.aemet.es/opendata/api/avisos/nacional?api_key=${AEMET_API_KEY}`;
            const resAvisos = await fetch(avisosUrl, { signal: AbortSignal.timeout(5000) });
            const datAvisos = await resAvisos.json();

            if (datAvisos.estado === 200) {
                const dataRes = await fetch(datAvisos.datos);
                const avisosArray = await dataRes.json();

                // Usually returns an array or an object depending on the active alerts
                // The structure usually has avisos with a 'nombreAviso', 'nivel', and 'provincia' or geographical ID
                // We'll filter loosely for Cadiz
                const activeWarnings = new Set<string>();

                if (Array.isArray(avisosArray)) {
                    avisosArray.forEach((aviso: any) => {
                        const area = (aviso.zonaGeografica || aviso.name || '').toUpperCase();
                        if (area.includes('CÁDIZ') || area.includes('CADIZ') || area.includes('GRAZALEMA')) {
                            const level = aviso.nivelAviso || 'Amarillo'; // default to yellow if missing
                            const fenomeno = aviso.nombreElemento || aviso.tipoAviso || 'Meteo';
                            activeWarnings.add(`Alerta ${level}: ${fenomeno} en ${aviso.zonaGeografica}`);
                        }
                    });
                }

                if (activeWarnings.size > 0) {
                    forecastData.warnings = Array.from(activeWarnings);
                }
            }
        } catch (e) {
            console.error('Error fetching AEMET warnings:', e);
        }

    } catch (error) {
        console.error('Error in AEMET API fetch:', error);
    }

    return { stations: results, forecast: forecastData };
}
