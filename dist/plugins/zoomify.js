(function() {
    
    /* internals */
    
    var ZoomifyGenerator = function(params) {
        params = COG.extend({
            imagePath: 'img/',
            fullWidth: 0,
            fullHeight: 0,
            tileSize: 256
        }, params);
        
        // initialise variables
        var zoomLevel = 0,
            tileSize = params.tileSize;
    
        /* internal functions */
    
        /* exports */
        
        function run(view, viewRect, callback) {
            var zoomLevel = view.getZoomLevel ? view.getZoomLevel() : 0;
            
            if (zoomLevel) {
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
            } // if
        }
    
        /* define self */
    
        var self = COG.extend(new T5.ImageGenerator(params), {
            run: run
        });
    
        return self;        
    };
    
    // register the zoomify generator
    T5.Generator.register('zoomify', ZoomifyGenerator);
})();
