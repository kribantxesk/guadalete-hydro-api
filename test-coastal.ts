// Test script to fetch Open-Meteo Marine and Wind data for Cadiz Coast (e.g. near Jerez / Puerto de Santa Maria)
async function testCoastal() {
    try {
        // Coordinates for Cadiz coast (Bay of Cadiz): 36.53, -6.29
        const marineUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=36.53&longitude=-6.29&hourly=wave_height,wave_direction,wave_period&timezone=Europe%2FMadrid';
        const windUrl = 'https://api.open-meteo.com/v1/forecast?latitude=36.53&longitude=-6.29&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Europe%2FMadrid';

        console.log("Fetching Marine Data...");
        const res1 = await fetch(marineUrl);
        const data1 = await res1.json();
        console.log("Marine wave height (current):", data1.hourly.wave_height[0], "meters");

        console.log("Fetching Wind Data...");
        const res2 = await fetch(windUrl);
        const data2 = await res2.json();
        console.log("Current wind:", data2.current.wind_speed_10m, "km/h, gusts up to", data2.current.wind_gusts_10m, "km/h");

    } catch (e) {
        console.error("Coastal Test Error:", e);
    }
}
testCoastal();
