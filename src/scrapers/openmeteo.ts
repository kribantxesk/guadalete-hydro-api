export interface CoastalData {
    tides: { status: 'Sube' | 'Baja' | 'Estable'; waveHeight: number };
    wind: { speed: number; direction: string; gusts: number };
}

export async function scrapeOpenMeteoCoastal(): Promise<CoastalData> {
    const result: CoastalData = {
        tides: { status: 'Estable', waveHeight: 0 },
        wind: { speed: 0, direction: 'N', gusts: 0 }
    };

    try {
        // Coordinates for Cadiz coast (Bay of Cadiz): 36.53, -6.29
        const marineUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=36.53&longitude=-6.29&hourly=wave_height,wave_direction&timezone=Europe%2FMadrid';
        const windUrl = 'https://api.open-meteo.com/v1/forecast?latitude=36.53&longitude=-6.29&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Europe%2FMadrid';

        // Fetch Marine Data (Waves)
        const resA = await fetch(marineUrl, { signal: AbortSignal.timeout(15000) });
        if (resA.ok) {
            const dataA = await resA.json();
            // Get the current hour index or just the first available hourly forecast
            const nowHour = new Date().getHours();

            let waveHeight = 0;
            let pastWaveHeight = 0;
            if (dataA.hourly && dataA.hourly.wave_height && dataA.hourly.wave_height.length > nowHour) {
                waveHeight = dataA.hourly.wave_height[nowHour];
                pastWaveHeight = nowHour > 0 ? dataA.hourly.wave_height[nowHour - 1] : waveHeight;
            }

            result.tides.waveHeight = parseFloat(waveHeight.toFixed(2));
            if (waveHeight > pastWaveHeight) result.tides.status = 'Sube';
            else if (waveHeight < pastWaveHeight) result.tides.status = 'Baja';
            else result.tides.status = 'Estable';
        }

        // Fetch Wind Data
        const resB = await fetch(windUrl, { signal: AbortSignal.timeout(15000) });
        if (resB.ok) {
            const dataB = await resB.json();
            if (dataB.current) {
                result.wind.speed = Math.round(dataB.current.wind_speed_10m);
                result.wind.gusts = Math.round(dataB.current.wind_gusts_10m);

                // Simple compass direction mapping
                const deg = dataB.current.wind_direction_10m;
                const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
                const dirStr = dirs[Math.round(deg / 45) % 8];
                result.wind.direction = dirStr;
            }
        }

    } catch (error) {
        console.error('Error fetching Open-Meteo coastal data:', error);
    }

    return result;
}
