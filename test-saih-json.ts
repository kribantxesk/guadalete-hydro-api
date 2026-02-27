// Test SAIH Map JSON endpoint
async function testSaihJson() {
    try {
        const url = 'https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/datos';
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        const text = await response.text();
        console.log("SAIH Map JSON Length:", text.length);
        if (text.length > 0) {
            console.log("Snippet:", text.substring(0, 500));
        }
    } catch (e) {
        console.error("SAIH JSON Error:", e);
    }
}
testSaihJson();
