async function testSaih() {
    const url = 'https://www.redhidrosurmedioambiente.es/saih/resumen/rio';
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) width/1920 Chrome/120.0.0.0 Safari/537.36"
        }
    });
    const html = await res.text();
    console.log("HTML length:", html.length);

    if (html.includes('Junta de los Ríos')) {
        console.log('Data found in HTML! It can be scraped natively.');
        const snippet = html.substring(html.indexOf('Junta de los Ríos') - 100, html.indexOf('Junta de los Ríos') + 200);
        console.log(snippet);
    } else {
        console.log('Data NOT found in HTML. It is loaded via AJAX.');
        const fs = require('fs');
        fs.writeFileSync('dump-saih-native.html', html);
    }
}
testSaih();
