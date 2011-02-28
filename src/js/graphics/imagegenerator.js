/**
# T5.ImageGenerator

## Events

### update
*/
var ImageGenerator = function(params) {
    params = COG.extend({
        relative: false,
        padding: 2
    }, params);
    
    /**
    ### run(viewRect, view, callback)
    */
    function run(view, viewRect, callback) {
        COG.warn('running base generator - this should be overriden');
    } // run
    
    var self = {
        run: run
    };
    
    // make the tile generator observable
    COG.observable(self);
    return self;
};