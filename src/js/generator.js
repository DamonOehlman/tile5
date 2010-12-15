/**
# T5.Generators
The generators module is used to manage the registration and creation
of generators.  Image generators, etc
*/
T5.Generator = (function() {
    
    // initialise variables
    var generatorRegistry = {};
    
    /* private internal functions */
    
    /* exports */
    
    function init(id, params) {
        // look for the generator
        var generatorType = generatorRegistry[id],
            generator;
        
        // if we didn't find a generator, raise an exception
        if (! generatorType) {
            throw new Error('Unable to locate requested generator: ' + id);
        } // if
        
        // create the new generator
        return new generatorType(params);
    } // init
    
    function register(id, creatorFn) {
        generatorRegistry[id] = creatorFn;
    } // register
    
    /* generator template definition */
    
    var Template = function(params) {
        
    }; // Template
    
    /* module definition */
    
    return {
        init: init,
        register: register,
        
        Template: Template
    };
})();