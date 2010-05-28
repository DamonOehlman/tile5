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

/* initialise sidelab functions */

var SLICK = {};

SLICK.Logger = function() {
    // initialise constants
    var DEFAULT_LOGGING_LEVEL = 1;
    
    // look for the debug window
    var debug_div = jQuery("#console").get(0);
    
    // initialise the log level classes
    var log_level_classes = ['debug', 'info', 'warn', 'error'];
    var log_lines = [];
    
    // initialise self
    var self = {
        LOGLEVEL_DEBUG: 0,
        LOGLEVEL_INFO: 1,
        LOGLEVEL_WARN: 2,
        LOGLEVEL_ERROR: 3,
        
        displayToggle: function() {
            jQuery("ul#console").slideToggle();
        },
        
        log: function(message, level) {
            // if the debug div is not defined, then exit the function
            if (! debug_div) {
                return;
            } // if
            
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
                msg: message
            });
            
            jQuery(debug_div).prepend(String.format("<li class='{0}'>{1}</li>", class_name, message));
            
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