GEO.DECARTA = {};

// define the decarta utilities as per this thread on the decarta forum
// http://devzone.decarta.com/web/guest/forums?p_p_id=19&p_p_action=0&p_p_state=maximized&p_p_mode=view&_19_struts_action=/message_boards/view_message&_19_messageId=43131

GEO.DECARTA.Utilities = (function() {
    // define some constants
    var MAX_GX_ZOOM = 21;
    
    var self = {
        /* start forum extracted functions */
        
        radsPerPixelAtZoom: function(tileSize, gxZoom) {
            return 2*Math.PI / (tileSize << gxZoom);
        },
        
        /* end forum extracted functions */
        
        zoomLevelToGXZoom: function(zoom_level) {
            return Math.abs(MAX_GX_ZOOM - parseInt(zoom_level, 10));
        }
    };
    
    return self;
})();

/* define decarta types */

GEO.DECARTA.CenterContext = function(json_data) {
    // initialise variables
    
    // initialise self
    var self = {
        centerPos: new GEO.Position(json_data.CenterPoint ? json_data.CenterPoint.pos.content : ""),
        radius: new GEO.Radius(json_data.Radius ? json_data.Radius.content : 0, json_data.Radius ? json_data.Radius.unit : null)
    }; // self
    
    return self;
}; // CenterContext

/* define the different request types */

GEO.DECARTA.Request = function(config) {
    // initialise self
    var self = {
        decartaConfig: config,
        methodName: "",
        maxResponses: 25,
        version: "1.0",
        requestID: new Date().getTime(),
        
        getRequestBody: function() {
            return "";
        },
        
        parseResponse: function(response) {
            return response;
        }
    }; // self
    
    return self;
}; // GEO.DECARTA.Request

GEO.DECARTA.PortrayMapRequest = function(config, lat, lon, zoom_level) {
    // initialise variables
    
    function findGridLayer(layers, layer_name) {
        for (var ii = 0; ii < layers.length; ii++) {
            if (layers[ii].GridLayer.name == layer_name) {
                return layers[ii];
            } // if
        } // for
        
        return null;
    } // findGridLayer
    
    function parseImageUrl(url) {
        var fnresult = {
            mask: url
        };
        var regexes = [
            (/(\?|\&)(N)\=(\-?\d+)/i),
            (/(\?|\&)(E)\=(\-?\d+)/i)
        ]; 

        // iterate through the regular expressions and capture north position and east positio
        for (var ii = 0; ii < regexes.length; ii++) {
            // get the matches
            var matches = regexes[ii].exec(url);
            
            // update the fnresult with the appropriate parameter
            fnresult[matches[2]] = matches[3];
            fnresult.mask = fnresult.mask.replace(regexes[ii], "$1$2=${$2}");
        } // for

        return fnresult;
    } // parseImageUrl
    
    // create the parent
    var parent = new GEO.DECARTA.Request(config);
    
    var self = jQuery.extend({}, parent, {
        // override core properties
        methodName: "PortrayMap",
        maxResponses: 10,
        
        // initialise map request props
        latitude: lat,
        longitude: lon,
        zoom: zoom_level,
        
        getRequestBody: function() {
            return String.format(
                // initialise the xml request content
                "<xls:PortrayMapRequest>" + 
                    "<xls:Output height='{0}' width='{0}' format='{1}' fixedgrid='{2}' useCache='{3}'>" + 
                        "<xls:CenterContext SRS='WGS-84'>" + 
                            "<xls:CenterPoint>" + 
                                "<gml:pos>{4} {5}</gml:pos>" + 
                            "</xls:CenterPoint>" +
                            "<xls:Radius unit='{6}'>{7}</xls:Radius>" + 
                        "</xls:CenterContext>" +
                        "<xls:TileGrid rows='1' columns='1'>" + 
                            "<xls:GridLayer name='deCarta' />" + 
                            "<xls:GridLayer name='globexplorer' meta-inf='{8}' />" + 
                        "</xls:TileGrid>" + 
                    "</xls:Output>" +
                "</xls:PortrayMapRequest>",
                
                // set the variables in the order they were used
                SLICK.TilerConfig.TILESIZE,
                self.decartaConfig.tileFormat,
                self.decartaConfig.fixedGrid,
                self.decartaConfig.useCache,
                
                // set lat and lon
                self.latitude,
                self.longitude,
                
                // set zoom measurement and radius
                // TODO: pass these in effectively...
                "KM",
                4,
                "zoom=11"
            );
        },
        
        parseResponse: function(response) {
            // find the decarta tile grid layer
            var grid = findGridLayer(response.TileGrid, "deCarta");
            
            // if we have found the grid, then get the map content url
            if (grid) {
                // parse out the tile url details
                var urlData = parseImageUrl(grid.Tile.Map.Content.URL);
                
                SLICK.logger.info(String.format("parsed image url: {0}, N = {1}, E = {2}", urlData.mask, urlData.N, urlData.E));
                
                return {
                    imageUrl: urlData.mask,
                    tileSize: grid.Tile.Map.Content.height,
                    centerContext: new GEO.DECARTA.CenterContext(grid.CenterContext),
                    centerTile: {
                        N: parseInt(urlData.N, 10),
                        E: parseInt(urlData.E, 10)
                    }
                };
            } // if
        }
    });
    
    return self;
};

/* define the map provider */

GEO.DECARTA.MapProvider = function(params) {
    // initialise variables
    var config = jQuery.extend({
        sessionID: new Date().getTime(),
        server: "",
        clientName: "",
        clientPassword: "",
        configuration: "",
        maxResponses: 25,
        release: "4.4.2sp03",
        tileFormat: "PNG",
        fixedGrid: true,
        useCache: true
    }, params);
    
    var last_map_response = null;
    var tile_grid = null;
    var image_url = "";
    
    var loaded_images = {};
    
    // initialise parent
    var parent = new GEO.MapProvider();
    
    function buildTileGrid(response_data, container_dimensions) {
        // initialise the first tile origin
        // TODO: think about whether to throw an error if not divisble
        var half_width = Math.round(response_data.tileSize * 0.5);
        var pos_first = {
            x: container_dimensions.getCenter().x - half_width,
            y: container_dimensions.getCenter().y - half_width
        }; 
        
        // create the tile grid
        image_url = response_data.imageUrl;
        tile_grid = new SLICK.MapTileGrid({
            width: container_dimensions.width, 
            height: container_dimensions.height, 
            tilesize: response_data.tileSize,
            onNeedTiles: function(offset_delta) {
                // SLICK.logger.info("NEED TILES, offset delta cols = " + offset_delta.cols + ", rows = " + offset_delta.rows);
                
                // if the tile grid is defined, then we know the base_n and e
                if (tile_grid) {
                    tile_grid.customdata.base_n += offset_delta.rows;
                    tile_grid.customdata.base_e -= offset_delta.cols;
                    
                    // tile_grid.applyTileOffset(offset_delta);
                    tile_grid.offsetPixelPositions(offset_delta);
                } // if
                
                populateTiles();
            }
        });
        
        // associate some custom data with the tile grid (gotta love javascript)
        tile_grid.customdata = {
            base_n: response_data.centerTile.N + tile_grid.centerTile.row,
            base_e: response_data.centerTile.E - tile_grid.centerTile.col
        }; // customdata

        // right some tests...
        var gx_zoomlevel = GEO.DECARTA.Utilities.zoomLevelToGXZoom(self.zoomLevel);
        
        // set the tile grid center position
        tile_grid.setCenterPos(response_data.centerContext.centerPos);
        tile_grid.setRadsPerPixel(GEO.DECARTA.Utilities.radsPerPixelAtZoom(response_data.tileSize, gx_zoomlevel));
        
        // write a whole pile of log messages
        SLICK.logger.info(String.format("building a tile grid for container {0} x {1}", container_dimensions.width, container_dimensions.height));
        SLICK.logger.info(String.format("tile size {0} x {0}", response_data.tileSize));
        SLICK.logger.info(String.format("first tile x: {0}, y: {0}", pos_first.x, pos_first.y));
        SLICK.logger.info(String.format("tile grid = {0} columns wide and {1} rows high", tile_grid.columns, tile_grid.rows));
        SLICK.logger.info(String.format("center tile col = {0}, row = {1}", tile_grid.centerTile.col, tile_grid.centerTile.row));
        SLICK.logger.info(String.format("top tile = N:{0} E:{1}", tile_grid.customdata.base_n, tile_grid.customdata.base_e));
        SLICK.logger.info(String.format("grid bounds = {0}", tile_grid.getBoundingBox()));
        
        populateTiles();
        
        return tile_grid;
    } // buildTileGrid
    
    function populateTiles() {
        if (! tile_grid) {
            SLICK.logger.warn("No tile grid to populate");
            return;
        }
        
        SLICK.logger.info("POPULATING TILES!!!");
        
        // load the tiles
        for (var xx = 0; xx < tile_grid.columns; xx++) {
            for (var yy = 0; yy < tile_grid.rows; yy++) {
                // initialise the image url
                var tile_url = image_url.replace("${N}", tile_grid.customdata.base_n - yy).replace("${E}", tile_grid.customdata.base_e + xx);
                
                // get the image for that tile
                var tile_image = loaded_images[tile_url];
                
                // if the tile is not available, then create it
                if (! tile_image) {
                    // initialise tile image 
                    tile_image = new Image();

                    // set the image source
                    tile_image.src = tile_url;
                    
                    // add the tile to the loaded images array
                    loaded_images[tile_url] = tile_image;
                } // if
                
                // set the tile in the grid
                tile_grid.setTile(xx, yy, tile_image);
            } // for
        } // for
    } // populateTiles
    
    function createRequestHeader(payload) {
        // TODO: write a function that takes parameters and generates xml
        return String.format(
            "<xls:XLS version='1' xls:lang='en' xmlns:xls='http://www.opengis.net/xls' rel='{4}' xmlns:gml='http://www.opengis.net/gml'>" + 
                "<xls:RequestHeader clientName='{0}' clientPassword='{1}' sessionID='{2}' configuration='{3}' />" + 
                "{5}" + 
            "</xls:XLS>",
            
            config.clientName,
            config.clientPassword,
            config.sessionID,
            config.configuration,
            config.release,
            payload);
    } // createRequestHeader
    
    function createRequestTag(request, payload) {
        return String.format(
            "<xls:Request maximumResponses='{0}' version='{1}' requestID='{2}' methodName='{3}Request'>{4}</xls:Request>",
            request.maxResponses,
            request.version,
            request.requestID,
            request.methodName,
            payload);
    } // createRequestTag
    
    function generateRequest(request) {
        return createRequestHeader(createRequestTag(request, request.getRequestBody()));
    } // generateRequest
    
    function generateRequestUrl(request, request_data) {
        return String.format("{0}/JSON?reqID={1}&chunkNo=1&numChunks=1&data={2}&responseFormat=JSON",
            config.server,
            request.requestID,
            escape(request_data));
    } // generateRequestUrl
    
    function makeServerRequest(request, callback) {
        // make the request to the server
        jQuery.ajax({
            url: generateRequestUrl(request, generateRequest(request)),
            dataType: "jsonp",
            success: function(data, textStatus, requestObj) {
                // get the number of responses received
                var response = data.response.XLS.Response;
                               
                // if we have one or more responeses, then handle them
                if ((response.numberOfResponses > 0) && response[request.methodName + 'Response']) {
                    callback(request.parseResponse(response[request.methodName + 'Response']));
                }
                // otherwise, report the error
                else {
                    SLICK.logger.error("no responses from server: " + data.response);
                } // if..else
            }
        });
    } // openlsComms
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        getMapTiles: function(tiler, position, callback) {
            makeServerRequest(
                    new GEO.DECARTA.PortrayMapRequest(config, position.lat, position.lon, self.zoomLevel),
                    function (response) {
                        // update the center tile details
                        last_map_response = response;
                        
                        // TODO: determine the x and y offset given then requested position and returned center context
                        
                        if (callback) {
                            // build the tile grid
                            var tile_grid = buildTileGrid(last_map_response, tiler.getDimensions());
                            
                            SLICK.logger.info("grid center position = " + tile_grid.centerPos);
                            callback(tile_grid);
                        } // if
                    });
        },
        
        getPositionForXY: function(x, y) {
            
        }
    });
    
    return self;
}; // DecartaDataProvider
