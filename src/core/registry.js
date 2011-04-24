var Registry = (function() {
    /* internals */
    
    var types = {};
    
    /* exports */
    
    function create(type, name) {
        if (types[type][name]) {
            types[type][name].apply(null, Array.prototype.slice.call(arguments, 2));
        } // if
    } // create
    
    function register(type, name, initFn) {
        // initialise the type of not defined
        if (! types[type]) {
            types[type] = {};
        } // if
        
        // log a warning if the type already exists
        if (types[type][name]) {
            _log(WARN_REGOVERRIDE(type, name), 'warn');
        } // if

        // add to the registry
        types[type][name] = initFn;
    } // register
    
    return {
        create: create,
        register: register
    };
})();