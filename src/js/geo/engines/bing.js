/**
# T5.Geo.Bing
*/
T5.Geo.Bing = (function() {
    var Generator = function(params) {
        
        /* internal functions */
        
        function authenticate(callback) {
            var serverUrl = COG.formatStr("http://dev.virtualearth.net/REST/V1/Imagery/Metadata/{0}?key={1}", params.style, params.apikey);
            
            COG.jsonp(serverUrl, function(data) {
                // FIXME: very hacky...
                var resourceData = data.resourceSets[0].resources[0];
                
                imageUrls[params.style] = resourceData.imageUrl;
                subDomains = resourceData.imageUrlSubdomains;
                
                logoUrl = data.brandLogoUri;
                copyrightText = data.copyright;
                
                self.setZoomRange(resourceData.zoomMin + 1, resourceData.zoomMax);

                T5.Tiling.tileSize = resourceData.imageHeight;
                
                if (callback) {
                    callback();
                } // if
            }, "jsonp");
        } // authenticate
        
        /* exports */
        
        function initTileCreator(position, zoomLevel, callback) {
            var serverDetails = self.getServerDetails ? self.getServerDetails() : null, 
                tileOffset = calculateTileOffset(position, zoomLevel),
                flipY = false,
                creator = function(tileX, tileY) {
                    // COG.Log.info('getting url for tile x = ' + tileX + ', y = ' + tileY);
                    
                    return (serverDetails ? serverDetails.baseUrl : "") + 
                        COG.formatStr("{0}/{1}/{2}.png",
                            zoomLevel,
                            tileOffset.x + tileX,
                            flipY ? Math.abs(tileOffset.y + tileY - Math.pow(2,zoomLevel)) : tileOffset.y + tileY);
                }; // loader
            
            if (callback) {
                callback(creator);
            } // if
        } // initTileLoader
        
        /* define the generator */

        // initialise the generator
        var self = T5.ex(new T5.MapTileGenerator(params), {
            initTileCreator: initTileCreator
        });
        
        // bind to generator events
        
        return self;        
    };
    
    return {
        Generator: Generator
    };
})();