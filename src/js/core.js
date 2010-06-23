SLICK = (function () {
    var module = {
        Settings: (function() {
            var currentSettings = {};
            
            // define self
            var self = {
                get: function(name) {
                    return currentSettings[name];
                },
                
                set: function(name, value) {
                    currentSettings[name] = value;
                },
                
                extend: function(params) {
                    GRUNT.extend(currentSettings, params);
                }
            };
            
            return self;
        })(),
        
        Utils: (function() {
            // define self
            var self = {
                toId: function(text) {
                    return text.replace(/\s/g, "-");
                }
            };
            
            return self;
        })(),
        
        Vector: function(init_x, init_y) {
            // if the initialise x is not specified then set to 0
            if (! init_x) {
                init_x = 0;
            } // if

            // repeat for the y
            if (! init_y) {
                init_y = 0;
            } // if

            // initialise self
            var self = {
                x: init_x,
                y: init_y,

                add: function(vector) {
                  self.x += vector.x;
                  self.y += vector.y;
                  
                  return self;
                },

                copy: function(vector) {
                    self.x = vector.x;
                    self.y = vector.y;
                },
                
                createRect: function(vector) {
                    return new SLICK.Rect(
                        Math.min(self.x, vector.x),
                        Math.min(self.y, vector.y),
                        Math.abs(self.x - vector.x),
                        Math.abs(self.y - vector.y));
                },
                
                duplicate: function() {
                    return self.offset(0, 0);
                },
                
                getAbsSize: function() {
                    return Math.max(Math.abs(self.x), Math.abs(self.y));
                },

                offset: function(x, y) {
                    return new SLICK.Vector(self.x + x, self.y + y);
                },
                
                invert: function() {
                    return new SLICK.Vector(-self.x, -self.y);
                },

                toString: function() {
                    return self.x + ", " + self.y;
                }
            }; // self

            return self;
        }, // Vector
        
        Dimensions: function(init_width, init_height) {
            // initialise variables

            // calculate the aspect ratio
            var init_aspect_ratio = init_height ? (init_width / init_height) : 1;

            // intiialise self
            var self = {
                width: init_width,
                height: init_height,
                aspect_ratio: init_aspect_ratio,
                inv_aspect_ratio: 1 / init_aspect_ratio,

                duplicate: function() {
                    return new SLICK.Dimensions(self.width, self.height);
                },

                getCenter: function() {
                    return new SLICK.Vector(self.width * 0.5, self.height * 0.5);
                }
            }; // self

            return self;
        }, // Dimensions
        
        Rect: function(x, y, width, height) {
            var self = {
                origin: new SLICK.Vector(x, y),
                dimensions: new SLICK.Dimensions(width, height),
                
                duplicate: function() {
                    return new SLICK.Rect(self.origin.x, self.origin.y, self.dimensions.width, self.dimensions.height);
                },
                
                getSize: function() {
                    return Math.sqrt(Math.pow(self.dimensions.width, 2) + Math.pow(self.dimensions.height, 2));
                },
                
                grow: function(new_width, new_height) {
                    var growFactor = new SLICK.Dimensions(new_width - self.dimensions.width, new_height - self.dimensions.height);
                    
                    self.dimensions.width = new_width;
                    self.dimensions.height = new_height;
                    
                    return growFactor;
                },
                
                expand: function(amountX, amountY) {
                    self.origin.x -= amountX;
                    self.origin.y -= amountY;
                    self.dimensions.width += amountX;
                    self.dimensions.height += amountY;
                },
                
                moveTo: function(x, y) {
                    var offsetFactor = new SLICK.Vector(x - self.origin.x, y - self.origin.y);
                    
                    self.origin.x = x;
                    self.origin.y = y;
                    
                    return offsetFactor;
                }
            };
            
            return self;
        }
    };
    
    return module;
})();

