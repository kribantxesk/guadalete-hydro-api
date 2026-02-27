const AEMET_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJrcmliYW50eGVza0BnbWFpbC5jb20iLCJqdGkiOiJjODVmMDI3NC03YzA0LTQ1ODktYmJkNy0zMDdlZTg3MGFmMDIiLCJpc3MiOiJBRU1FVCIsImlhdCI6MTc3MTc4NTYzNSwidXNlcklkIjoiYzg1ZjAyNzQtN2MwNC00NTg5LWJiZDctMzA3ZWU4NzBhZjAyIiwicm9sZSI6IiJ9.R_1TDlmRsFnyuflIRKFIfOwZecEHYAekkx-ESxdFHfU";

async function testAemet() {
    try {
        // Forecast for Jerez de la Frontera (11020)
        const predUrl = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/11020?api_key=${AEMET_API_KEY}`;
        console.log("Fetching Jerez Prediction...");
        const resPred = await fetch(predUrl);
        const datPred = await resPred.json();

        if (datPred.estado === 200) {
            console.log("Got Payload URL, fetching data...");
            const r2 = await fetch(datPred.datos);
            const data = await r2.json();

            // Forecast is an array, get the first day
            const today = data[0].prediccion.dia[0];
            console.log("Probabilidad Precipitacion:", today.probPrecipitacion[0]);
            console.log("Estado Cielo:", today.estadoCielo[0].descripcion);
        } else {
            console.log("AEMET Error:", datPred);
        }

    } catch (e) {
        console.error("AEMET Alerts Test Error:", e);
    }
}
testAemet();
