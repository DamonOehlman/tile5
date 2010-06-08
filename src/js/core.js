/* initialise javascript extensions */

if (! String.format) {
    String.format = function( text )
    {
        //check if there are two arguments in the arguments list
        if ( arguments.length <= 1 )
        {
            //if there are not 2 or more arguments there's nothing to replace
            //just return the original text
            return text;
        }
        //decrement to move to the second argument in the array
        var tokenCount = arguments.length - 2;
        for( var token = 0; token <= tokenCount; token++ )
        {
            //iterate through the tokens and replace their placeholders from the original text in order
            text = text.replace( new RegExp( "\\{" + token + "\\}", "gi" ),
                                                    arguments[ token + 1 ] );
        }
        return text;
    };    
} // if

if (! Number.toRad) {
    Number.prototype.toRad = function() {  // convert degrees to radians 
      return this * Math.PI / 180; 
    }; // 
} // if

// include the secant method for Number
// code from the excellent number extensions library:
// http://safalra.com/web-design/javascript/number-object-extensions/
if (! Number.sec) {
    Number.prototype.sec =
        function(){
          return 1 / Math.cos(this);
        };
} // if

/* initialise sidelab functions */

var SLICK = {};

SLICK.Logger = function() {
    // initialise constants
    var DEFAULT_LOGGING_LEVEL = 1;
    var REDRAW_FREQUENCY = 2000;
    var DISPLAY_LINES = 20;
    
    // look for the debug window
    var debug_div = jQuery("#console").get(0);
    
    // initialise the log level classes
    var log_level_classes = ['debug', 'info', 'warn', 'error'];
    var log_lines = [];
    
    var visible = false;
    var redraw_interval = 0;
    
    // initialise self
    var self = {
        LOGLEVEL_DEBUG: 0,
        LOGLEVEL_INFO: 1,
        LOGLEVEL_WARN: 2,
        LOGLEVEL_ERROR: 3,
        
        displayToggle: function() {
            // toggle the visible state
            visible = ! visible;
            
            // if we are visible then slide down
            visible ? jQuery("ul#console").slideDown() : jQuery("ul#console").slideUp();
            
            // if we are visible, then set the update timer running
            if (visible) {
                redraw_interval = setInterval(function() {
                    var html_content = "";
                    
                    var ii = log_lines.length - 1;
                    while ((ii >= 0) && (ii >= (log_lines.length - DISPLAY_LINES))) {
                        html_content += "<li class='" + log_lines[ii].clsName + "'>" + log_lines[ii].msg + "</li>";
                        
                        // decrement ii
                        ii--;
                    } // while
                    
                    // update the debug div content
                    jQuery(debug_div).html(html_content);
                }, REDRAW_FREQUENCY);
                
            }
            else {
                clearInterval(redraw_interval);
            }
        },
        
        log: function(message, level) {
            // if the level is not defined, then set to the default level
            if (! level) {
                level = DEFAULT_LOGGING_LEVEL;
            } // if
            
            // get the level class
            var class_name = log_level_classes[DEFAULT_LOGGING_LEVEL];
            if (level < log_level_classes.length) {
                class_name = log_level_classes[level];
            } // if
            
            // add to the log lines
            log_lines.push({
                time: new Date().getTime(),
                lvl: level,
                clsName: class_name,
                msg: message
            });
            
            // if the console is defined, then log a message
            if (console) {
                console.info(message);
            } // if
        },
        
        debug: function(message) {
            self.log(message, self.LOGLEVEL_DEBUG);
        },
        
        info: function(message) {
            self.log(message, self.LOGLEVEL_INFO);
        },
        
        warn: function(message) {
            self.log(message, self.LOGLEVEL_WARN);
        },
        
        error: function(message) {
            self.log(message, self.LOGLEVEL_ERROR);
        },
        
        exception: function(e) {
            // TODO: more detail in this...
            self.log("EXCEPTION: " + e.message, self.LOGLEVEL_ERROR);
            
            // if we have a stack trace, then display that as well
            if (e.stack) {
                self.log("STACK TRACE: " + e.stack, self.LOGLEVEL_ERROR);
            } // if
        }
        
    }; // self
    
    return self;
}; // SIDELAB.Debugger

SLICK.Vector = function(init_x, init_y) {
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
        },
        
        copy: function(vector) {
            self.x = vector.x;
            self.y = vector.y;
        },
        
        offset: function(x, y) {
            return new SLICK.Vector(self.x + x, self.y + y);
        },
        
        toString: function() {
            return self.x + ", " + self.y;
        }
    }; // self
    
    return self;
}; // SLICK.Vector

SLICK.Dimensions = function(init_width, init_height) {
    // initialise variables
    
    // calculate the aspect ratio
    var init_aspect_ratio = init_height ? (init_width / init_height) : 1;
    
    // intiialise self
    var self = {
        width: init_width,
        height: init_height,
        aspect_ratio: init_aspect_ratio,
        inv_aspect_ratio: 1 / init_aspect_ratio,
        
        getCenter: function() {
            return new SLICK.Vector(self.width * 0.5, self.height * 0.5);
        }
    }; // self
    
    return self;
}; // SLICK.Dimension

var LOGGER = null;
jQuery(document).ready(function() {
    LOGGER = new SLICK.Logger();

    /*
    jQuery(window).bind("error", function(evt) {
        alert("caught an error");
    }); // error handler 
    */
    
    /*
    window.onerror = document.onerror = function(error_msg) {
        alert(error_msg);
    };
    */ 
}); // ready
