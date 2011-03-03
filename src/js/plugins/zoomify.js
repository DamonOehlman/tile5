T5.Zoomify = (function() {
    
    /* internals */
    
    var ZoomifyGenerator = function(params) {
        params = COG.extend({
            imagePath: 'img/',
            fullWidth: 0,
            fullHeight: 0
        }, params);
        
        // initialise variables
        var zoomLevel = 0;
    
        /* internal functions */
    
        function handleZoomLevelChange(evt, newZoomLevel) {
            COG.info('zoom level changed, reset');
            zoomLevel = newZoomLevel;
            self.reset();
        } // handleZoomLevelChange;
    
        /* exports */
        
        function initTileCreator(tileWidth, tileHeight, args, callback) {
            var serverDetails = self.getServerDetails ? self.getServerDetails() : null,
                
                // initialise the tile creator
                creator = function(tileX, tileY) {
                    var imagePath = params.imagePath,
                        tileUrl;
                        
                    if (tileX >= 0 && tileY >= 0) {
                        // determine the tile url
                        tileUrl = COG.formatStr(imagePath + '{0}-{1}-{2}.jpg',
                            zoomLevel,
                            tileX, 
                            tileY);

                        return T5.Tiling.init(
                            tileX * tileWidth, 
                            tileY * tileHeight,
                            tileWidth,
                            tileHeight, {
                                url: tileUrl
                            });
                    } // if
                }; // loader

            // if the callback is assigned, then pass back the creator
            if (callback) {
                callback(creator);
            } // if
        } // initTileCreator
    
        /* define self */
    
        var self = COG.extend(new T5.TileGenerator(params), {
            initTileCreator: initTileCreator
        });
    
        self.bind('bindView', function(evt, view) {
            // if the view is a zoomable then get the zoom level and bind to the zoom change event
            if (view.getZoomLevel) {
                zoomLevel = view.getZoomLevel();
                view.bind('zoomLevelChange', handleZoomLevelChange);
            } // if
        });
    
        return self;        
    };
    
    /* exports */
    
    var ZoomifyView = function(params) {
        params = COG.extend({
            imagePath: 'img/'
        }, params);
        
        /* private functions */
        
        /* exports */
        
        var self = COG.extend(new T5.View(params), {
        });
        
        return self;
    }; // ZoomifyView
    
    // register the zoomify generator
    T5.Generator.register('zoomify', ZoomifyGenerator);
    
    return {
        View: ZoomifyView
    };
})();
