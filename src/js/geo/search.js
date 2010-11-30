/**
# T5.Geo.Search
_module_


Define functions for geo search operations

## Functions
*/
T5.Geo.Search = (function() {
    var DEFAULT_MAXDIFF = 20;
    
    var module = {
        bestResults: function(searchResults, maxDifference) {
            // if the threshold is not defined, use the default 
            if (! maxDifference) {
                maxDifference = DEFAULT_MAXDIFF;
            }
            
            // initialise variables
            var bestMatch = searchResults.length > 0 ? searchResults[0] : null,
                fnresult = [];
                
            // iterate through the search results and cull those that are 
            for (var ii = 0; ii < searchResults.length; ii++) {
                if (bestMatch && searchResults[ii] && 
                    (bestMatch.matchWeight - searchResults[ii].matchWeight <= maxDifference)) {
                        
                    fnresult.push(searchResults[ii]);
                }
                else {
                    break;
                } // if..else
            } // for
            
            return fnresult;
        }
    };
    
    return module;
})();

