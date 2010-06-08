/*
File:   slick.geo.js
File is used to define geo namespace and classes for implementing GIS classes and operations
*/

// define the GEO namespace
var GEO = {};

/* GEO Basic Type definitions */

GEO.Distance = function(pos1, pos2) {
    // define some constants
    var M_PER_KM = 1000;
    var KM_PER_RAD = 6371;
    
    // initialise private members
    var dist = 0;
    
    /* calculate the distance */
    
    // if both position 1 and position 2 are passed and valid
    if (pos1 && (! pos1.isEmpty()) && pos2 && (! pos2.isEmpty())) {
        var halfdelta_lat = (pos2.lat - pos1.lat).toRad() * 0.5;
        var halfdelta_lon = (pos2.lon - pos1.lon).toRad() * 0.5;
        
        // TODO: find out what a stands for, I don't like single char variables in code (same goes for c)
        var a = (Math.sin(halfdelta_lat) * Math.sin(halfdelta_lat)) + 
                (Math.cos(pos1.lat.toRad()) * Math.cos(pos2.lat.toRad())) * 
                (Math.sin(halfdelta_lon) * Math.sin(halfdelta_lon));
                
        // calculate c (whatever c is)
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        // calculate the distance
        dist = KM_PER_RAD * c;
    } // if
    
    // initialise self
    var self = {
        toM: function() {
            return dist * M_PER_KM;
        },
        
        toKM: function() {
            return dist;
        },
        
        toString: function() {
            return dist + "km";
        }
    }; // 
    

    return self;
}; // GEO.Distance

GEO.Radius = function(init_dist, init_uom) {
    // initialise variables
    
    // TODO: actually make this class useful
    
    // initialise self
    var self = {
        distance: parseInt(init_dist, 10),
        uom: init_uom
    }; 
    
    return self;
}; // GEO.Radius

GEO.Position = function(init_lat, init_lon) {
    // initialise variables
    
    // if the init lon is not specified, and the initial lat contains a space then split on space 
    if ((! init_lon) && init_lat && init_lat.split && (init_lat.indexOf(' ') >= 0)) {
        var coords = init_lat.split(' ');
        
        // update the initial lat and lon
        init_lat = coords[0];
        init_lon = coords[1];
    } // if
    
    // if we don't have an init lat, then set both parameters to 0
    if (! init_lat) {
        init_lat = 0;
        init_lon = 0;
    } // if
    
    // initialise self
    var self = {
        lat: parseFloat(init_lat),
        lon: parseFloat(init_lon),
        
        copy: function(src_pos) {
            self.lat = src_pos.lat;
            self.lon = src_pos.lon;
        },
        
        clear: function() {
            self.lat = 0;
            self.lon = 0;
            
        },
        
        /*
        Method: inBounds
        This method is used to determine whether or not the position is
        within the bounds rect supplied. 
        */
        inBounds: function(bounds) {
            // initialise variables
            var fnresult = ! (self.isEmpty() || bounds.isEmpty());
            
            // check the pos latitude
            fnresult = fnresult && (self.lat >= bounds.min.lat) && (self.lat <= bounds.max.lat);
            
            // check the pos longitude
            fnresult = fnresult && (self.lon >= bounds.min.lon) && (self.lon <= bounds.max.lon);
            
            return fnresult;
        },
        
        isEmpty: function() {
            return (self.lat === 0) && (self.lon === 0);
        }, 
        
        getMercatorPixels: function(rads_per_pixel) {
            return new SLICK.Vector(GEO.Utilities.lon2pix(self.lon, rads_per_pixel), GEO.Utilities.lat2pix(self.lat, rads_per_pixel));
        },
        
        setMercatorPixels: function(x, y, rads_per_pixel) {
            if (! rads_per_pixel) {
                throw "Unable to calculate position from mercator pixels without rads_per_pixel value";
            } // if
            
            self.lat = GEO.Utilities.pix2lat(y, rads_per_pixel);
            self.lon = GEO.Utilities.pix2lon(x, rads_per_pixel);
        },
        
        toString: function() {
            return self.lat + " " + self.lon;
        }
    }; // self
    
    return self;
}; // Position

/*
Class: GEO.BoundingBox
*/
GEO.BoundingBox = function(init_min, init_max) {
    // if min is a string, then create a new position from it (positions can parsea string)
    if (! init_min) {
        init_min = new GEO.Position();
    }
    else if (init_min.split) {
        init_min = new GEO.Position(init_min);
    } // if

    // do the same for max
    if (! init_max) {
        init_max = new GEO.Position();
    }
    else if (init_max.split) {
        init_max = new GEO.Position(init_max);
    } // if
    
    // initialise self
    var self = {
        min: init_min,
        max: init_max,
        
        copy: function(src_bounds) {
            self.min.copy(src_bounds.min);
            self.max.copy(src_bounds.max);
        },
        
        clear: function() {
            self.min.clear();
            self.max.clear();
        },
        
        isEmpty: function() {
            return self.min.isEmpty() || self.max.isEmpty();
        },
        
        transform: function(transformers) {
            // create a new instance of the BoundingBox to transform
            var target = new GEO.BoundingBox(self.min, self.max);
            
            LOGGER.info("applying " + transformers.length + " transformers");
            // iterate through the transformers, and call them
            for (var ii = 0; transformers && (ii < transformers.length); ii++) {
                transformers[ii].apply(target);
            } // for
            
            return target;
        },
        
        toString: function() {
            return String.format("({0}, {1})", self.min, self.max);
        }
    }; // self
    
    return self;
}; // BoundingBox

/* GEO Transformers */

GEO.TRANSFORM = (function() {
    return {
        Shrink: function(new_width, new_height) {
            return function() {
                //LOGGER.info(String.format("SHRINKING {2} to {0} x {1}", new_width, new_height, this));
            };
        },
        
        Offset: function(x_offset, y_offset) {
            return function() {
                //LOGGER.info(String.format("OFFSETING {2} by {0}, {1}", x_offset, y_offset, this));
            };
        }
    };
})();

/* GEO Utilities */

/*
Module:  GEO.Utilities
This module contains GIS utility functions that apply across different mapping platforms.  Credit 
goes to the awesome team at decarta for providing information on many of the following functions through
their forums here (http://devzone.decarta.com/web/guest/forums?p_p_id=19&p_p_action=0&p_p_state=maximized&p_p_mode=view&_19_struts_action=/message_boards/view_message&_19_messageId=43131)
*/
GEO.Utilities = (function() {
    // define some constants
    var ECC = 0.08181919084262157;
    
    // initialise variables
    
    var self = {
        lat2pix: function(lat, scale) {
            var radLat = (parseFloat(lat)*(2*Math.PI))/360;
            var sinPhi = Math.sin(radLat);
            var eSinPhi = ECC * sinPhi;
            var retVal = Math.log(((1.0 + sinPhi) / (1.0 - sinPhi)) * Math.pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ECC)) / 2.0;
            
            return (retVal / scale);
        },
        
        lon2pix: function(lon, scale) {
            return ((parseFloat(lon)/180)*Math.PI) / scale;
        },
        
        pix2lon: function(x, scale) {
            return (x * scale)*180/Math.PI;
        },
        
        pix2lat: function(y, scale) {
            var phiEpsilon = 1E-7;
            var phiMaxIter = 12;
            var t = Math.pow(Math.E, -y * scale);
            var prevPhi = self.mercatorUnproject(t);
            var newPhi = self.findRadPhi(prevPhi, t);
            var iterCount = 0;
            
            while (iterCount < phiMaxIter && Math.abs(prevPhi - newPhi) > phiEpsilon) {
                prevPhi = newPhi;
                newPhi = self.findRadPhi(prevPhi, t);
                iterCount++;
            } // while
            
            return newPhi*180/Math.PI;
        },

        mercatorUnproject: function(t) {
            return (Math.PI / 2) - 2 * Math.atan(t);
        },
        
        findRadPhi: function(phi, t) {
            var eSinPhi = ECC * Math.sin(phi);

            return (Math.PI / 2) - (2 * Math.atan (t * Math.pow((1 - eSinPhi) / (1 + eSinPhi), ECC / 2)));
        }
    }; // self
    
    return self;
})();

GEO.MapProvider = function() {
    // initailise self
    var self = {
        zoomLevel: 0,
        
        getMapTiles: function(tiler, position, zoom_level, callback) {
            
        },
        
        getPositionForXY: function(x, y) {
            return null;
        }
    };
    
    return self;
}; // MapDataProvider
