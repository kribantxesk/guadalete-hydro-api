async function querySaihApi() {
    const url = "https://www.redhidrosurmedioambiente.es/saih/mapa/tiempo/real/grafica/ajax/getgrafica";

    const headers = {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest"
    };

    const body = "idgrafica=219R02&tipo=R"; // 219R02 = Junta de los Ríos, Type R = Rio

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (res.ok) {
            const json = await res.json();
            console.log("SUCCESS:");
            console.log(JSON.stringify(json).substring(0, 500) + '...');
        } else {
            console.log("Failed:", res.status);
        }
    } catch (e) {
        console.error(e);
    }
}

querySaihApi();
