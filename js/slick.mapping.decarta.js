GEO.DECARTA = {};

/* define decarta types */

GEO.DECARTA.CenterContext = function(json_data) {
    // initialise variables
    
    // initialise self
    var self = {
    
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

GEO.DECARTA.PortrayMapRequest = function(config, lat, lon) {
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
            /(\?|\&)(N)\=(\-?\d+)/i,
            /(\?|\&)(E)\=(\-?\d+)/i
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
                
                LOGGER.info(String.format("parsed image url: {0}, N = {1}, E = {2}", urlData.mask, urlData.N, urlData.E));
                
                return {
                    imageUrl: urlData.mask,
                    tileSize: grid.Tile.Map.Content.height,
                    tileContext: new GEO.DECARTA.CenterContext(grid.CenterContext),
                    centerTile: {
                        N: parseInt(urlData.N),
                        E: parseInt(urlData.E)
                    }
                };
            } // if
        }
    });
    
    return self;
}

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
        useCache: true,
    }, params);
    
    var center_tile = null;
    
    // initialise parent
    var parent = new GEO.MapProvider();
    
    function buildTileGrid(tile_context, container_dimensions) {
        // initialise the first tile origin
        // TODO: think about whether to throw an error if not divisble
        var half_width = Math.round(tile_context.tileSize * .5);
        var pos_first = {
            x: container_dimensions.center.x - half_width,
            y: container_dimensions.center.y - half_width
        }; 
        
        // create the tile grid
        var fnresult = new SLICK.MapTileGrid({
            width: container_dimensions.width, 
            height: container_dimensions.height, 
            tilsize: tile_context.tileSize
        });
        
        // associate some custom data with the tile grid (gotta love javascript)
        fnresult.customdata = {
            base_n: tile_context.centerTile.N + fnresult.centerTile.row,
            base_e: tile_context.centerTile.E - fnresult.centerTile.col
        }; // customdata
        
        // add the on need tiles handler
        fnresult.onNeedTiles = function(tile_array, col_delta, offset_delta) {
            LOGGER.info("Need new tiles");
        } // onNeedTiles
        
        // write a whole pile of log messages
        LOGGER.info(String.format("building a tile grid for container {0} x {1}", container_dimensions.width, container_dimensions.height));
        LOGGER.info(String.format("center point = x: {0}, y: {1}", container_dimensions.center.x, container_dimensions.center.y));
        LOGGER.info(String.format("tile size {0} x {0}", tile_context.tileSize));
        LOGGER.info(String.format("first tile x: {0}, y: {0}", pos_first.x, pos_first.y));
        LOGGER.info(String.format("tile grid = {0} columns wide and {1} rows high", fnresult.columns, fnresult.rows));
        LOGGER.info(String.format("center tile col = {0}, row = {1}", fnresult.centerTile.col, fnresult.centerTile.row));
        LOGGER.info(String.format("top tile = N:{0} E:{1}", fnresult.customdata.base_n, fnresult.customdata.base_e));
        
        // load the tiles
        for (var xx = 0; xx < fnresult.columns; xx++) {
            for (var yy = 0; yy < fnresult.rows; yy++) {
                // initialise tile image 
                var tile_image = new Image();
                
                // set the image source
                tile_image.src = tile_context.imageUrl.replace("${N}", fnresult.customdata.base_n - yy).replace("${E}", fnresult.customdata.base_e + xx);
                
                // set the tile in the grid
                LOGGER.info(String.format("set tile ({0}, {1}) to: {2}", xx, yy, tile_image.src));
                fnresult.setTile(xx, yy, tile_image);
            } // for
        } // for
        
        return fnresult;
    } // buildTileGrid
    
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
                    LOGGER.error("no responses from server: " + data.response);
                } // if..else
            }
        });
    } // openlsComms
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        getMapTiles: function(tiler, position, zoom_level, callback) {
            makeServerRequest(
                    new GEO.DECARTA.PortrayMapRequest(config, "-27.468", "153.028"),
                    function (response) {
                        // update the center tile details
                        center_tile = response;
                        
                        if (callback) {
                            callback(buildTileGrid(center_tile, tiler.getDimensions()));
                        } // if
                    });
        }
    });
    
    return self;
}; // DecartaDataProvider