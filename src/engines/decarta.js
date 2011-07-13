T5.Decarta = (function() {
    // initialise the default configuration parameters
    var currentConfig = {
        sessionID: new Date().getTime(),
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
        },
        
        routing: {
            rulesFile: 'maneuver-rules'
        }
    };
    
    //= require <timelord/timelord>
    //= require "decarta/core"
    //= require "decarta/generator"
    //= require "decarta/geocoder"
    //= require "decarta/routing"
    
    return {
        applyConfig: function(args) {
            // extend the current configuration with the supplied params
            T5.ex(currentConfig, args);
        },
        
        getTileConfig: function(userId, callback) {
            makeServerRequest(new RUOKRequest(), function(config) {
                var clientName = currentConfig.clientName.replace(/\:.*/, ':' + (userId || ''));
                
                // reset the tile hosts
                hosts = [];

                // initialise the hosts
                if (config.aliasCount) {
                    for (var ii = 0; ii < config.aliasCount; ii++) {
                        hosts[ii] = 'http://' + config.host.replace('^(.*?)\.(.*)$', '\1-0' + (ii + 1) + '.\2');
                    } // for
                }
                else {
                    hosts = ['http://' + config.host];
                } // if..else
                
                callback({
                    hosts: hosts,
                    clientName: clientName,
                    sessionID: currentConfig.sessionID,
                    configuration: currentConfig.configuration
                });
            });
        },
        
        setTileConfig: function(data) {
            currentConfig.tileConfig = data;
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