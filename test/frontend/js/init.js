window.addEventListener("load", function() {
    // create the application 
    map = new T5.Map({
        container: "tiler",

        // CURRENT RACQ SERVER
        // provider: new T5.Geo.Decarta.MapProvider()

        // CLOUDMADE CONFIG
        provider: new T5.Geo.Cloudmade.MapProvider({
            apikey: "7960daaf55f84bfdb166014d0b9f8d41"
        })
    });
    
    COG.Log.info("MAP initialised");
    map.gotoPosition(T5.Geo.P.parse("-27.468 153.028"), 10);
}, false);
