// initialise the decarta options
if (SLICK.Geo.Decarta) {
    SLICK.Geo.Decarta.applyConfig({
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