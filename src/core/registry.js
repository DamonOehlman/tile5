var Registry = (function() {
    /* internals */
    
    var types = {};
    
    /* exports */
    
    function create(type, name) {
        if (types[type][name]) {
            return types[type][name].apply(null, Array.prototype.slice.call(arguments, 2));
        } // if
        
        throw NO_TYPE(type, name);
    } // create
    
    function get(type, name) {
        return types[type] ? types[type][name] : null;
    } // get
    
    function register(type, name, initFn) {
        // initialise the type of not defined
        if (! types[type]) {
            types[type] = {};
        } // if
        
        // log a warning if the type already exists
        if (types[type][name]) {
            cog.log(WARN_REGOVERRIDE(type, name), 'warn');
        } // if

        // add to the registry
        types[type][name] = initFn;
    } // register
    
    return {
        create: create,
        get: get,
        register: register
    };
})();