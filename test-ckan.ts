async function searchOpenData() {
    const url = 'https://www.juntadeandalucia.es/datosabiertos/portal/api/3/action/package_search?q=hidrosur OR saih';
    try {
        const res = await fetch(url);
        const json = await res.json();
        console.log("Found datasets:", json.result.count);
        for (const pkg of json.result.results.slice(0, 5)) {
            console.log("-", pkg.title);
            for (const r of pkg.resources) {
                console.log("  -> (", r.format, ")", r.url);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
searchOpenData();
