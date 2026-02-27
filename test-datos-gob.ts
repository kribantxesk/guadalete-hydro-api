// Test to search datos.gob.es catalog for DGT Datex
async function findDgtDatex() {
    try {
        const url = 'https://datos.gob.es/apidata/catalog/dataset.json?title=DATEX2';
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.result && data.result.items) {
            data.result.items.forEach((item: any) => {
                console.log("Found dataset:", item.title._value);
                item.distribution.forEach((dist: any) => {
                    console.log(" - Format:", dist.format?.value, "URL:", dist.accessURL || dist.downloadURL);
                });
            });
        }
    } catch (e) {
        console.error(e);
    }
}
findDgtDatex();
