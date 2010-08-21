window.addEventListener("load", function() {
    // create the application 
    map = new TILE5.Geo.UI.Tiler({
        container: "tiler",
        crosshair: true,
        autoSize: false,

        // CURRENT RACQ SERVER
        // provider: new SLICK.Geo.Decarta.MapProvider()

        // CLOUDMADE CONFIG
        provider: new TILE5.Geo.Cloudmade.MapProvider({
            apikey: "7960daaf55f84bfdb166014d0b9f8d41"
        })
    });

    GRUNT.Log.info("MAP initialised");
    map.gotoPosition(TILE5.Geo.P.parse("-27.468 153.028"), 10);
}, false);
