// initialise the decarta options
if (T5.Geo.Decarta) {
    T5.Geo.Decarta.applyConfig({
        server: "http://ws.decarta.com/openls",
        clientName: "clientname",
        clientPassword: "password",
        configuration: "old-english-tile", 
        geocoding: {
            countryCode: "US",
            language: "EN"
        }
    });
} // if