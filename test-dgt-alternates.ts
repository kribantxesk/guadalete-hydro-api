// Test script to fetch DGT XML or public JSON
async function testDgtAlternates() {
    try {
        const url1 = 'http://infocar.dgt.es/etraffic/IncidenciasXML';
        console.log("Fetching DGT XML...");
        const response1 = await fetch(url1);
        const text1 = await response1.text();
        console.log("XML Length:", text1.length, "Snippet:", text1.substring(0, 200));

        const url2 = 'https://mapas.dgt.es/etraffic/BuscarElementos?latNS=44&longEW=5&latSW=35&longEE=-10&incidencias=RETENCION,OBRAS';
        console.log("\nFetching DGT BuscarElementos...");
        const response2 = await fetch(url2, { headers: { "User-Agent": "curl/7.81.0" } });
        const text2 = await response2.text();
        console.log("BuscarElementos Length:", text2.length, "Snippet:", text2.substring(0, 200));

    } catch (e) {
        console.error("DGT Alternate Test Error:", e);
    }
}
testDgtAlternates();
