T5TEST = (function() {
    
    // initialise variables
    var testModules = [],
        moduleIndex = 0,
        coveredModules = {},
        runTests = {};
    
    /* internal functions */
    
    function getTestModules(obj, prefix) {
        var fnresult = [],
            validKeys = /^[A-Z]+.*/;
            
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && validKeys.test(key)) {
                var testModule = (prefix ? prefix + '.' : '') + key,
                    subModules = getTestModules(obj[key], testModule);
                    
                fnresult.push(testModule);
                for (var ii = 0; ii < subModules.length; ii++) {
                    fnresult.push(subModules[ii]);
                } // for
            }
        } // for
        
        return fnresult;
    } // getTestModules
    
    /* exports */
    
    function inject() {
        console.debug('injecting ' + testModules.length + ' modules');
        for (var ii = 0; ii < testModules.length; ii++) {
            document.write('<script src="spec/' + testModules[ii] + '.spec.js"></script>\n');
        } // for

        // document.write('<script defer="true">setTimeout(T5TEST.runCoverageCheck, 100);</script>\n');
    }
    
    function runCoverageCheck() {
        module('COVERAGE');
        test('module coverage', function() {
            console.debug('running coverage tests');
            expect(testModules.length);

            for (var ii = 0; ii < testModules.length; ii++) {
                ok(coveredModules[testModules[ii]], testModules[ii] + ' test module found');
            } // for
        });
    } // checkCoverage
    
    testModules = getTestModules(T5, 'T5');
    
    return {
        modules: testModules,
        runCoverageCheck: runCoverageCheck,
        inject: inject
    };
})();

