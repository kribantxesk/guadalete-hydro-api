async function testCaudal() {
    const urlQ = 'https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/219Q02';
    const urlC = 'https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/219C02';

    for (const url of [urlQ, urlC]) {
        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const html = await res.text();
        if (html.length > 500 && html.includes('serie1')) {
            console.log(`URL ${url} works for Caudal!`);
        } else {
            console.log(`URL ${url} failed to find data.`);
        }
    }
}
testCaudal();
