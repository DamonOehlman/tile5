/**
# T5.Service
This is a module of Tile5 that supports registration of services that provide capabilities
to Tile5.  For instance an engine for a GIS backend might provide `route` or `geocode` service
*/
var Service = (function() {
    var registry = {};
    
    /* exports */

    /**
    ### find(serviceType)
    */
    function find(serviceType) {
        return (registry[serviceType] || [])[0];
    } // find
    
    /**
    ### register(serviceType, initFn)
    */
    function register(serviceType, initFn) {
        if (! registry[serviceType]) {
            registry[serviceType] = [];
        } // if
        
        registry[serviceType].push(initFn());
    } // register
    
    return {
        find: find,
        register: register
    };
})();

