// Test DGT RSS for Cadiz (prov=11)
async function testDgtRss() {
    try {
        const url = 'http://infocar.dgt.es/etraffic/rss_provincia?prov=11';
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });
        const xml = await response.text();
        console.log("DGT RSS Length:", xml.length);
        if (xml.length > 0) {
            console.log("Snippet:", xml.substring(0, 500));
        }
    } catch (e) {
        console.error("DGT RSS Error:", e);
    }
}
testDgtRss();
