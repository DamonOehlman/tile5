//= require <cog/src/timelord>

T5.Decarta = (function() {
    // initialise the default configuration parameters
    var currentConfig = {
        sessionID: T5.ticks(),
        server: "",
        clientName: "",
        clientPassword: "",
        configuration: "",
        maxResponses: 25,
        release: "4.4.2sp03",
        tileFormat: "PNG",
        fixedGrid: true,
        useCache: true,
        tileHosts: [],

        // REQUEST TIMEOUT in milliseconds
        requestTimeout: 30000,

        // GEOCODING information
        geocoding: {
            countryCode: "US",
            language: "EN"
        }
    };
    
    //= require "decarta/core"
    //= require "decarta/generator"
    //= require "decarta/geocoder"
    //= require "decarta/routing"
    
    return {
        applyConfig: function(args) {
            // extend the current configuration with the supplied params
            COG.extend(currentConfig, args);
        },        
        
        compareFns: (function() {
            return {
                streetDetails: function(input, fieldVal) {
                    return fieldVal.calcMatchPercentage(input);
                },
                location: function(input, fieldVal) {
                    return fieldVal.calcMatchPercentage(input);
                }
            };
        })()
    };
})();