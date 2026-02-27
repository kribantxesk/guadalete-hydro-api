// Test script to fetch SAIH Hydrogeology URL
async function testSaihPiezo() {
    try {
        // Piezometro 041 - Puerto Real or somewhere around there? Let's try 001P01
        const url1 = 'https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/041P01';
        console.log("Fetching SAIH Piezo...");
        const response1 = await fetch(url1);
        const text1 = await response1.text();
        console.log("Piezo Length:", text1.length);
        const match = text1.match(/var serie1 = \[([^\]]+)\]/);
        if (match) console.log("Found data array!");
        else console.log("No data array found.");

    } catch (e) {
        console.error("SAIH Piezo Error:", e);
    }
}
testSaihPiezo();
