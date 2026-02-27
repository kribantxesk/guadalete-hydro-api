async function testFetch() {
    const url = 'https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/219R02';
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) width/1920 Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
        }
    });

    if (!res.ok) {
        console.log("Failed HTTP:", res.status);
        return;
    }

    const html = await res.text();
    console.log("Native fetch returned HTML size:", html.length);

    if (html.includes('var serie1')) {
        console.log("SUCCESS NO PLAYWRIGHT: Found 'serie1' array natively!");
    } else {
        console.log("Failed to find 'serie1'. Requires Playwright rendering.");
    }
}
testFetch();
