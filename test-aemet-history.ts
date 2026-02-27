const AEMET_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJrcmliYW50eGVza0BnbWFpbC5jb20iLCJqdGkiOiJjODVmMDI3NC03YzA0LTQ1ODktYmJkNy0zMDdlZTg3MGFmMDIiLCJpc3MiOiJBRU1FVCIsImlhdCI6MTc3MTc4NTYzNSwidXNlcklkIjoiYzg1ZjAyNzQtN2MwNC00NTg5LWJiZDctMzA3ZWU4NzBhZjAyIiwicm9sZSI6IiJ9.R_1TDlmRsFnyuflIRKFIfOwZecEHYAekkx-ESxdFHfU";

async function testAemetMonth() {
    try {
        // Calculate dates for the last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        const formatDate = (date: Date) => date.toISOString().split('T')[0] + "T00:00:00UTC";

        // Estacion Jerez Aeropuerto is 5973 or 1108D (Jerez Aerop is 5973? No, Cadiz observatory is usually 5973, Jerez is 5960 or similar. Let's just query a known province or list stations first...)
        // We can query all stations for the last 30 days? That's too much. Let's get station list first or just query Jerez: "5960" (Jerez)
        const url = `https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/datos/fechaini/${formatDate(start)}/fechafin/${formatDate(end)}/estacion/5960?api_key=${AEMET_API_KEY}`;

        console.log("Fetching AEMET 30-day history for Jerez (5960)...");
        const res = await fetch(url);
        const dat = await res.json();

        if (dat.estado === 200) {
            const dataRes = await fetch(dat.datos);
            const data = await dataRes.json();
            let totalPrec = 0;
            data.forEach((day: any) => {
                let p = day.prec;
                if (p === 'Ip') p = '0.0'; // Indapreciable
                if (p) totalPrec += parseFloat(p.replace(',', '.'));
            });
            console.log(`Lluvia acumulada últimos 30 días: ${totalPrec.toFixed(2)} mm`);
        } else {
            console.log("Error finding station or data:", dat.descripcion);
        }
    } catch (e) {
        console.error(e);
    }
}
testAemetMonth();
