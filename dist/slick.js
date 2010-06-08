/*!
 * Sidelab Slick Javascript Library v0.2.1

 * http://sidelab.com/projects/slick/
 *
 * Copyright 2010, Damon Oehlman
 * Licensed under the MIT licence
 * http://sidelab.com/projects/slick/license
 *
 * Date: ${date}
 */
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
SLICK.Touches = function() {
    // initialise private members
    var _vectors = [];
    
    var self = {
        addTouch: function(touch_vector) {
            _vectors.push(touch_vector);
        },

        /*
        Method: calculateDelta
        This method is used to calculate the distance between the current touch and a previous touch event.  
        Note - The calculation is made using only the first touch stored in the vectors.
        */
        calculateDelta: function(previous_touches) {
            // get the second vector
            var previous_vector = previous_touches.getTouch(0);
            
            // LOGGER.info(String.format("calculating delta: current vector = {0}, previous vector = {1}", _vectors[0], previous_vector));
            return previous_vector ? new SLICK.Vector(_vectors[0].x - previous_vector.x, _vectors[0].y - previous_vector.y) : new SLICK.Vector();
        },
        
        /*
        Method:  getDistance
        Returns the distance between the first two touches. 
        TODO: make it work for additional touch points
        */
        getDistance: function() {
            var fnresult = 0;
            
            // if we have multiple touches, then calculate distance betweem the touches
            if (_vectors.length > 1) {
                var dist_x = Math.abs(_vectors[0].x - _vectors[1].x);
                var dist_y = Math.abs(_vectors[0].y - _vectors[1].y);
                
                // calculate the distance between the points
                fnresult = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
            } // if
            
            return fnresult;
        },
        
        getTouch: function(touch_index) {
            // if the touch index is not set, the default to 0
            if (! touch_index) {
                touch_index = 0;
            } // if
            
            // if the touch index is within tolerances return the index
            if (_vectors.length > touch_index) {
                return _vectors[touch_index];
            } // if
            
            // TODO: determine whether it is better to return null, or a 0,0 Vector
        },
        
        getTouchCount: function() {
            return _vectors.length;
        },
        
        toString: function() {
            // initialise return value
            var fnresult = "";
            
            // iterate through the vectors and each to the string result
            for (var ii = 0; ii < _vectors.length; ii++) {
                fnresult += "[" + _vectors[ii] + "]";
            } // for
            
            return fnresult;
        }
    }; // self
    
    return self;
}; // SLICK.Touches

SLICK.TouchHelper = function(args) {
    // initialise default args
    var DEFAULT_ARGS = {
        touchStartHandler: null,
        moveHandler: null,
        moveEndHandler: null,
        pinchZoomHandler: null,
        pinchZoomEndHandler: null,
        tapHandler: null,
        doubleTapHandler: null
    }; // DEFAULT_ARGS
    
    // initialise constants
    var PANREFRESH = 5;
    var TOUCH_TYPES = {
        GLOBAL: 'touches',
        TARGET: 'targetTouches',
        CHANGED: 'changedTouches'
    };
    var DEFAULT_TOUCHTYPE_PRIORITY = [TOUCH_TYPES.GLOBAL, TOUCH_TYPES.TARGET];
    var TOUCH_MODES = {
        TAP: 0,
        MOVE: 1, 
        PINCHZOOM: 2
    }; // TOUCH_MODES
    
    // TODO: configure the move distance to be screen size sensitive....
    var MIN_MOVEDIST = 7;
    
    // initialise private members
    var touches_start = null;
    var touches_last = null;
    var touch_delta = null;
    var total_delta = null;
    var touch_mode = null;
    var ticks = {
        current: 0,
        last: 0
    };
    
    // initialise self
    var self = {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        
        /* define mutable constants (yeah, I know that's a contradiction) */
        
        THRESHOLD_DOUBLETAP: 300,
        
        /* define methods */
        
        getTouchPoints: function(touch_event, type_priority) {
            // initilaise variables
            var fnresult = new SLICK.Touches();
            
            // if the type priority is not set, then use the default
            if (! type_priority) {
                type_priority = DEFAULT_TOUCHTYPE_PRIORITY;
            } // if
            
            // if the event is a jQuery event
            if (touch_event.originalEvent) {
                touch_event = touch_event.originalEvent;
            } // if

            // WHATTHE:
            // The code below takes the type priority that was passed to the get pos function
            // and iterates through the array grabbing the appropriate string that is referenced
            // by the touch type in each instance.  We then look to see if the touch event both 
            // supports contains that particular touch type and also checks that it has suffient
            // touch positions to satisfy the request for the specified touch_index.  It's a bit
            // confusing, but allows the getTouchPoints method to be called with an optional third param
            // that means you can prioritize using targetTouches or changedTouches over the 
            // global touches data.
            var touch_array = null;
            var ii = 0;
            for (ii = 0; ii < type_priority.length; ii++) {
                var touch_type = type_priority[ii];
                if (touch_event[touch_type] && touch_event[touch_type].length > 0) {
                    touch_array = touch_event[touch_type];
                    break;
                } // if
            } // if
            
            // if we have the touch array, then populate the touch points
            for (ii = 0; touch_array && (ii < touch_array.length); ii++) {
                fnresult.addTouch(new SLICK.Vector(touch_array[ii].pageX, touch_array[ii].pageY));
            } // for

            return fnresult;
        },
        
        /*
        Method:  start
        This method is used to handle starting a touch event in the display
        */
        start: function(touch_event) {
            touches_start = self.getTouchPoints(touch_event);
            touches_last = self.getTouchPoints(touch_event);
            touch_delta = new SLICK.Vector();
            total_delta = new SLICK.Vector();

            // log the current touch start time
            ticks.current = new Date().getTime();
            
            // if we have a touch start handler, then fire that
            if (self.args.touchStartHandler) {
                var touch_vector = touches_start.getTouch();
                self.args.touchStartHandler(touch_vector.x, touch_vector.y);
            } // if
            
            // if the time between taps is less than the thresh-hold fire a double-tap event
            if ((ticks.current - ticks.last < self.THRESHOLD_DOUBLETAP) && self.args.doubleTapHandler) {
                var pos = touches_start.getTouch(0);
                if (pos) {
                    self.args.doubleTapHandler(pos.x, pos.y);
                } // if
            } // if
            
            // reset the touch mode to unknown
            touch_mode = TOUCH_MODES.TAP;
        },
        
        move: function(touch_event) {
            // get the current touches
            var touches_current = self.getTouchPoints(touch_event);
            var zoom_amount = 0;
            
            // check to see if we are pinching or zooming
            if (touches_current.getTouchCount() > 1) {
                zoom_amount = touches_last.getDistance() - touches_start.getDistance();
            } // if
            
            // if the touch mode is tap, then check to see if we have gone beyond a move threshhold
            if (touch_mode === TOUCH_MODES.TAP) {
                // get the delta between the first touch and the current touch
                var tap_delta = touches_current.calculateDelta(touches_start);
                
                // if the delta.x or delta.y is greater than the move threshhold, we are no longer moving
                if ((Math.abs(tap_delta.x) >= MIN_MOVEDIST) || (Math.abs(tap_delta.y) >= MIN_MOVEDIST)) {
                    touch_mode = TOUCH_MODES.MOVE;
                } // if
            } // if
            
            
            // if we aren't in tap mode, then let's see what we should do
            if (touch_mode !== TOUCH_MODES.TAP) {
                // TODO: queue touch count history to enable an informed decision on touch end whether
                // a single or multitouch event is completing...
            
                // if we aren't pinching or zooming then do the move 
                if (zoom_amount == 0) {
                    // calculate the pan delta
                    touch_delta = touches_current.calculateDelta(touches_last);
                
                    // update the total delta
                    total_delta.add(touch_delta);
                
                    // LOGGER.info("touch delta = " + touch_delta.toString());
                    if (self.args.moveHandler) {
                        self.args.moveHandler(touch_delta.x, touch_delta.y);
                    } // if
                
                    // set the touch mode to move
                    touch_mode = TOUCH_MODES.MOVE;

                    // TODO: investigate whether it is more efficient to animate on a timer or not
                }
                else if (self.args.pinchZoomHandler) {
                    self.args.pinchZoomHandler(zoom_amount);
                
                    // set the touch mode to pinch zoom
                    touch_mode = TOUCH_MODES.PINCHZOOM;
                } // if..else
            } // if..else
            
            // update the last touch position
             // TODO: check whether I need to deep copy here...
             touches_last = touches_current;
        },
        
        end: function(touch_event) {
            // save the current ticks to the last ticks
            ticks.last = ticks.current;
            
            // if tapping, then first the tap event
            if ((touch_mode === TOUCH_MODES.TAP) && self.args.tapHandler) {
                // get the start touch
                var touch_pos = touches_start.getTouch(0);
                
                self.args.tapHandler(touch_pos.x, touch_pos.y);
            }
            // if moving, then fire the move end
            else if ((touch_mode == TOUCH_MODES.MOVE) && self.args.moveEndHandler) {
                self.args.moveEndHandler(total_delta.x, total_delta.y);
            }
            // if pinchzooming, then fire the pinch zoom end
            else if ((touch_mode == TOUCH_MODES.ZOOM) && self.args.pinchZoomEndHandler) {
                // TODO: pass the total zoom amount
                self.args.pinchZoomEndHandler(0);
            } // if..else
        }
    };
    
    return self;
}; // MAPPING.TouchHelper

jQuery.fn.canTouchThis = function(params) {
    // initialise the parameters with default params
    var plugin_params = jQuery.extend({
        preventDefault: true
    }, params);
    
    // create the touch helper
    var touch_helper = new SLICK.TouchHelper(params);
    
    // bind the touch events
    return this
        .bind("touchstart", function(evt) {
            if (plugin_params.preventDefault) { evt.preventDefault(); }
            
            try {
                touch_helper.start(evt);
            } 
            catch (e) {
                LOGGER.exception(e); 
            } // try..catch
        })
        .bind("touchmove", function(evt) {
            if (plugin_params.preventDefault) { evt.preventDefault(); }
            
            try {
                touch_helper.move(evt);
            }
            catch (e) {
                LOGGER.exception(e);
            } // try..catch
        })
        .bind("touchend", function(evt) {
            if (plugin_params.preventDefault) { evt.preventDefault(); }
            
            try {
                touch_helper.end(evt);
            }
            catch (e) {
                LOGGER.exception(e);
            } // try..catch
        })
        .bind("mousewheel", function(evt) {
            evt.preventDefault();
            LOGGER.info("Got a mouse wheel event");
        });
}; // canTouchThis

jQuery.fn.untouchable = function() {
    // define acceptable touch items
    var TAGS_CANTOUCH = /^(A|BUTTON)$/i;
    
    return this
        /*
        .bind("touchstart", function(evt) {
            if (! (evt.target && TAGS_CANTOUCH.test(evt.target.tagName))) {
                // check to see whether a click handler has been assigned for the current object
                if (! (evt.target.onclick || evt.target.ondblclick)) {
                    LOGGER.info("no touch for: " + evt.target.tagName);
                    evt.preventDefault();
                } // if
            } // if
        })
        */
        .bind("touchmove", function(evt) {
            evt.preventDefault();
        });
}; // untouchable
/*
File:  slick.display.js
This file is used to generate utility methods that can be used with 
touchscreen devices, screen size detection, etc.

Section: Version History
21/05/2010 (DJO) - Created File
*/

SLICK.DisplayOpts = {
    ajaxActivityImage: null
}; // DisplayOpts

SLICK.InfoBox = function(args) {
    // initialise default args
    var DEFAULT_ARGS = {
        content: "",
        buttons: [],
        position: "top",
        classes: []
    }; 
    // initialise the box id
    var box_id = "box_" + new Date().getTime();
    var details_visible = false;
    
    // include default args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // find the container for the info box
    var container = null;
    var container_opts = [args.position, "top", "bottom"];
    for (var ii = 0; (! container) && (ii < container_opts.length); ii++) {
        container = jQuery("#container-" + container_opts[ii]).get(0);
    } // for
    
    // create the top box with the style of hidden
    jQuery(container).append(
        String.format(
            "<div id='{0}' class='infobox {2}'>" + 
                "<div class='box-content'>{1}</div>" + 
                "<div class='box-details'>I'm some details</div>" + 
                "<div class='box-buttons'></div>" + 
            "</div>", 
            box_id, 
            args.content, 
            args.classes.join(" ")
        )
    );
    
    function getBox() {
        return jQuery("#" + box_id);
    } // getBox
    
    function clickButton(dom_object) {
        // iterate through the classes of the dom object
        var classes = dom_object ? dom_object.className.split(' ') : [];
        
        // iterate through the classes and look for one that matches the button pattern
        for (var ii = 0; ii < classes.length; ii++) {
            var matches = /^button\_(\d+)$/.exec(classes[ii]);
            
            if (matches) {
                var btn_index = parseInt(matches[1], 10);
                if ((btn_index >= 0) && (btn_index < self.buttons.length) && self.buttons[btn_index].click) {
                    self.buttons[btn_index].click(dom_object);
                } // if
            } // if
        } // for
    } // clickButton
    
    function createButtons() {
        // find the button bar
        var button_bar = getBox().find(".box-buttons");
        
        // reset the button bar html
        button_bar.html("");
        
        // iterate through the buttons and create the html
        for (var ii = 0; ii < self.buttons.length; ii++) {
            // determine the button alignment 
            var button_align = self.buttons[ii].align ? self.buttons[ii].align : "";
            
            // initialise the button id if not already initialised
            button_bar.append(String.format("<a href='#' class='button_{0} {1}'>{2}</a>", ii, button_align, self.buttons[ii].text));
            
            // attach the click handler
            button_bar.find(".button_" + ii).click(function() {
                try {
                    clickButton(this);
                } 
                catch (e) {
                    LOGGER.exception(e);
                } // try..catch
            });
        } // for
    } // createButtons
    
    function updateButtonLabels() {
        var details_button_regex = /.*?\sDETAILS$/i;
        
        // look for a anchor tag with the text of "Blah Details"
        getBox().find("a").each(function() {
            // button text
            var button_text = jQuery(this).text();
            if (details_button_regex.test(button_text)) {
                jQuery(this).text((details_visible ? "Hide" : "Show") + " Details");
            } // if
        }); // each
    } // updateButtonLabels
    
    // initialise self
    var self = {
        buttons: args.buttons,
        
        getId: function() {
            return box_id;
        },
        
        getDetailsVisible: function() {
            return details_visible;
        },
        
        setButtons: function(value) {
            // TODO: I really feel like I should copy the items across, but I don't know why...
            self.buttons = value;
            createButtons();
        },
        
        show: function() {
            var box = getBox();
            
            box.slideDown("normal", function() {
                box.find(".box-buttons").show();
            });
        },
        
        hide: function() {
            // get the box reference
            var box = getBox();
            
            box.find(".box-buttons").hide();
            box.find(".box-details").hide();
            box.slideUp("normal");
        },
        
        showDetails: function(html_details, callback) {
            getBox().find(".box-details").html(html_details).slideDown("fast", function() {
                details_visible = true;
                updateButtonLabels();
                
                if (callback) {
                    callback();
                } // if
            });
        },
        
        hideDetails: function(callback) {
            getBox().find(".box-details").slideUp("fast", function() {
                jQuery(this).html("");
                details_visible = false;
                updateButtonLabels();
                
                if (callback) {
                    callback();
                } // if
            }); // slideup
        },
        
        updateContent: function(html_content) {
            getBox().find('.box-content').html(html_content);
        }
    };
    
    // create the buttons
    createButtons();
    
    return self;
}; // SLICK.TopBox

SLICK.Notification = function() {
    
};

/*
Module: SLICK.DisplayHelper
This module is used to define helpers for determining screen size, etc
*/
SLICK.DisplayHelper = function() {
    var LOADER_ID = "ajax_loader_indicator";
    var LOADER_POS_PREFS = ['top', 'bottom'];
    var DEFAULT_POS_PREFS = ['top', 'bottom'];
    var REGEX_TEMPLATE_VAR = /\$\{(.*?)\}/ig;
    
    // initialise private variables
    var containers = {
        top: null,
        right: null,
        bottom: null,
        left: null
    }; // containers

    // initialise self
    var self = {
        init: function() {
            // iterate through the container positions and find them
            for (var container_pos in containers) {
                containers[container_pos] = jQuery("#container-" + container_pos).get(0);
            } // for
            
            // if the ajaxActivityImage is set, then attach handlers to the jquery ajax start and stop events
            LOGGER.info("ajax activity indicator: " + SLICK.DisplayOpts.ajaxActivityImage);
            if (SLICK.DisplayOpts.ajaxActivityImage) {
                self.addChunk(String.format("<img id='{0}' src='{1}' />", LOADER_ID, SLICK.DisplayOpts.ajaxActivityImage), LOADER_POS_PREFS);
                jQuery("#" + LOADER_ID)
                    .ajaxStart(function() {
                        jQuery(this).show();
                    })
                    .ajaxStop(function() {
                        jQuery(this).hide();
                    });
            } // if
        },
        
        addChunk: function(html_content, container_prefs, callback) {
            // if the container preferences aren't specified use the defaults
            container_prefs = container_prefs ? container_prefs : DEFAULT_POS_PREFS;
            
            // find the required container
            var container = null;
            for (var ii = 0; (! container) && (ii < container_prefs.length); ii++) {
                container = containers[container_prefs[ii]];
            } // for
            
            // if the container is specified then add the html snippet
            if (container) {
                jQuery(container).append(html_content);
            } // if
        },
        
        removeChunk: function(selector) {
            jQuery(selector).remove();
        },
        
        parseTemplate: function(template_html, data) {
            // initialise variables
            var fnresult = template_html;
            
            // look for template variables in the html
            var matches = REGEX_TEMPLATE_VAR.exec(fnresult);
            while (matches) {
                // remove the variable from the text
                fnresult = fnresult.replace(matches[0], jQuery(data).find(matches[1]).text());
                
                // find the next match
                matches = REGEX_TEMPLATE_VAR.exec(fnresult);
            } // while
            
            return fnresult;
        }
    }; // 
    
    return self;
};

SLICK.Template = function() {
    // initialise variables
    
    // initialise self
    var self = {
        
    }; 
    
    return self;
}; // SLICK.Template

// initialise the screen object
SLICK.display = new SLICK.DisplayHelper();
jQuery(document).ready(function() {
    SLICK.display.init();
});
/*
File:  slick.behaviours.js
This file implements mixins that describe behaviour for a particular display class

Section:  Version History
2010-06-03 (DJO) - Created File
*/

// TODO: investigate the overheads of having multiple touch helpers created for each object that implements
// each one of these behaviours

SLICK.Pannable = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        container: null,
        onPan: null,
        checkOffset: null
    };
    
    var offset = new SLICK.Vector();
    
    // initialise self
    var self = {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        pannable: true,
        
        getOffset: function() {
            return new SLICK.Vector(offset.x, offset.y);
        },
        
        pan: function(x, y) {
            self.updateOffset(offset.x + x, offset.y + y);

            // if the on pan event is defined, then hook into it
            if (args.onPan) {
                args.onPan(x, y);
            } // if
        },
        
        updateOffset: function(x, y) {
            offset.x = x;
            offset.y = y;
            
            // if a checkoffset handler is defined, then call it to so if it needs to vito any of the offset
            // modifications that have been made in the pan event.  For example, when using an offscreen buffer
            // we need to keep the offset within tolerable bounds
            if (args.checkOffset) {
                offset = args.checkOffset(offset);
            } // if
        }
    };
    
    if (self.args.container) {
        jQuery(self.args.container).canTouchThis({
            moveHandler: function(x, y) {
                self.pan(-x, -y);
            }
        });
    } // if
    
    return self;
}; // SLICK.Pannable

SLICK.Scalable = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        container: null,
        onScale: null
    };
    
    var scale_amount = 0;
    
    // initialise self
    var self = {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        scalable: true,
        
        getScaleAmount: function() {
            return scale_amount;
        },
        
        scale: function(amount) {
            // update the scale factor
            scale_amount = amount * 0.5;
            
            LOGGER.info("scaling by " + scale_amount);
            
            if (args.onScale) {
                args.onScale(scale_amount);
            } // if
        }
    };
    
    if (self.args.container) {
        jQuery(self.args.container).canTouchThis({
            pinchZoomHandler: function(amount) {
                self.scale(amount);
            }
        });
    } // if
    
    return self;
}; // SLICK.Scalable
/*
File:  slick.canvas.js
This file contains the various modules for implementing layered drawing routines on a HTML5 canvas

Section: Version History
2010.06.03 (DJO) - Created File
*/

SLICK.View = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        container: "",
        fps: 30
    }; // DEFAULT_ARGS
    
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // get the container context
    var canvas = jQuery(args.container).get(0);
    var context = null;
    if (canvas) {
        try {
            context = canvas.getContext('2d');
        } 
        catch (e) {
            LOGGER.exception(e);
            throw "Could not initialise canvas on specified tiler element";
        }
    } // if
    
    var redraw_timer = 0;
    var redraw_sleep = Math.floor(1000 / args.fps);

    // initialise self
    var self = {
        getContext: function() {
            return context;
        },
        
        getDimensions: function() {
            // get the jquery wrapper
            var jq_container = jQuery(canvas);
            
            return new SLICK.Dimensions(jq_container.width(), jq_container.height()); 
        },
        
        invalidate: function(force) {
            if (force && context && args.onDraw) {
                args.onDraw(context);
            }
            else if (context && (redraw_timer === 0)) {
                redraw_timer = setTimeout(function() {
                    if (args.onDraw) {
                        args.onDraw(context);
                    } // if
                    
                    redraw_timer = 0;
                }, redraw_sleep); // this redraw time equates to approx 25FPS
            } // if
        }        
    };
    
    return self;
}; // SLICK.Canvas

SLICK.OffscreenCanvas = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        width: 0,
        height: 0
    }; // DEFAULT_ARGS
    
    // update the args with the defaults
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // create the canvas
    var buffer_canvas = document.createElement("canvas");
    
    // initialise the canvas size
    buffer_canvas.width = args.width;;
    buffer_canvas.height = args.height;
    
    // calculate the initial aspect ratio
    var init_aspect_ratio = buffer_canvas.height ? (buffer_canvas.width / buffer_canvas.height) : 1;
    
    // initialise self
    var self = {
        width: args.width,
        height: args.height,
        aspect_ratio: init_aspect_ratio,
        inv_aspect_ratio: 1 / init_aspect_ratio,
        
        getCanvas: function() {
            return buffer_canvas;
        },
        
        getContext: function(dimension) {
            if (! dimension) {
                dimension = "2d";
            } // if
            
            return buffer_canvas.getContext(dimension);
        },
        
        drawBackground: function(context, dimensions) {
            // fill the background
            context.fillStyle = "rgb(200, 200, 200)";
            context.fillRect(0, 0, dimensions.width, dimensions.height);
        },
        
        drawToView: function(view) {
            // get the context and dimensions
            var context = view.getContext();
            var dimensions = view.getDimensions();
            
            self.drawBackground(context, dimensions);
            
            // get the scale amount
            var scale_amount = (view.scalable ? view.getScaleAmount() : 0);
            var offset = view.pannable ? view.getOffset() : new SLICK.Vector();
            
            // initialise the destination parameters
            var dst_x = 0;
            var dst_y = 0;
            var dst_width = dimensions.width;
            var dst_height = dimensions.height;
            
            // determine the x_offset and y_offset taking into account the scale
            // TODO: sort this scaling nonsense out
            var src_x = Math.min(Math.max(offset.x + scale_amount, 0), buffer_canvas.width);
            var src_y = Math.min(Math.max(offset.y + scale_amount, 0), buffer_canvas.height);
            var src_width = dimensions.width - (scale_amount * 2);
            var src_height = Math.round(src_width * dimensions.inv_aspect_ratio);
            
            if (src_x < 0 || src_x + src_width > buffer_canvas.width || src_y < 0 || src_y + src_height > buffer_canvas.height) {
                src_width = Math.min(src_width, buffer_canvas.width - src_x);
                src_height = Math.round(src_width * dimensions.inv_aspect_ratio);
                
                // check the src height
                if (src_y + src_height > buffer_canvas.height) {
                    src_height = buffer_canvas.height - src_y;
                    src_width = Math.round(src_height * dimensions.aspect_ratio);
                } // if
                
                // determine the destination positions and height
                dst_width = Math.max(Math.min(dimensions.width + (scale_amount * 2), dimensions.width), 200);
                dst_height = Math.round(dst_width * dimensions.inv_aspect_ratio);
                dst_x = (dimensions.width - dst_width) * 0.5;
                dst_y = (dimensions.height - dst_height) * 0.5;
            } // if
            
            //LOGGER.info(String.format("offset = {0}, scale = {1}", offset, scale_amount));
            //LOGGER.info(String.format("src: x = {0}, y = {1}, width = {2}, height = {3}", src_x, src_y, src_width, src_height));
            //LOGGER.info(String.format("dst: x = {0}, y = {1}, width = {2}, height = {3}", dst_x, dst_y, dst_width, dst_height));
            
            // draw the sliced tile grid to the canvas
            context.drawImage(
                buffer_canvas, // the source canvas
                src_x, // the source x, y, width and height
                src_y, 
                src_width,
                src_height,
                dst_x, // the dest x, y, width and height
                dst_y,
                dst_width,
                dst_height);
        }        
    }; // self
    
    return self;
}; // SLICK.DrawLayer
/*
File:  slick.tiler.js
This file is used to define the tiler and supporting classes for creating a scrolling
tilable grid using the HTML canvas.  At this stage, the Tiler is designed primarily for
mobile devices, however, if the demand is there it could be tweaked to also support other
HTML5 compatible browsers

Section: Version History
21/05/2010 (DJO) - Created File
*/

// define the tiler config
SLICK.TilerConfig = {
    TILESIZE: 128,
    // TODO: put some logic in to determine optimal buffer size based on connection speed...
    TILEBUFFER: 1,
    TILEBUFFER_LOADNEW: 0.2,
    // TODO: change this to a real default value
    EMPTYTILE: "/public/images/tile.png"
}; // TilerConfig

// define the slick tile borders
SLICK.Border = {
    NONE: 0,
    TOP: 1,
    RIGHT: 2,
    BOTTOM: 3,
    LEFT: 4
}; // Border

SLICK.TileGrid = function(args) {
    // initialise defaults
    var BUFFER_COUNT = 2;
    var DEFAULT_ARGS = {
        tilesize: SLICK.TilerConfig.TILESIZE,
        width: 800,
        height: 600,
        onNeedTiles: null
    }; // DEFAULT_ARGS
    
    var DEFAULT_BG = "rgb(200, 200, 200)";
    
    // check the tile size is not equal to 0
    if (tile_size == 0) {
        throw new Exception("Cannot create new TileGrid: Tile size cannot be 0");
    } // if
    
    // extend the args with the default args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    LOGGER.info("Creating a tiler with tilesize " + args.tilesize);
    
    // define constants
    var REDRAW_DELAY = 50;
    var GRID_LINE_SPACING = 16;
    var QUEUE_REDRAW_DELAY = 200;
    
    // calculate the col and row count
    var tile_size = args.tilesize;
    var col_count = Math.ceil(args.width / tile_size) + SLICK.TilerConfig.TILEBUFFER;
    var row_count = Math.ceil(args.height / tile_size) + SLICK.TilerConfig.TILEBUFFER;
    var redraw_timeout = 0;
    var queued_tiles = [];
    var queued_load_timeout = 0;
    var updating_tile_canvas = false;
    var update_listeners = [];
    var checkbuffers_timer = 0;
    
    // ensure that both column and row count are odd, so we have a center tile
    // TODO: perhaps this should be optional...
    col_count = col_count % 2 == 0 ? col_count + 1 : col_count;
    row_count = row_count % 2 == 0 ? row_count + 1 : row_count;
    
    // calculate the layer width
    args.width = col_count * tile_size;
    args.height = row_count * tile_size;
    
    // create placeholder canvas
    var placeholder_tile = document.createElement("canvas");
    placeholder_tile.width = tile_size;
    placeholder_tile.height = tile_size;
    prepCanvas(placeholder_tile);
    
    // initialise the tile array
    var tiles = new Array(col_count * row_count);
    
    function drawTile(tile, col, row) {
        // get the offscreen context
        var tile_context = self.getContext();
        
        // draw the tile ot the canvas
        tile_context.drawImage(tile, col * tile_size, row * tile_size, tile_size, tile_size);
        
        // let the update listeners know we have loaded
        for (var ii = 0; ii < update_listeners.length; ii++) {
            update_listeners[ii]();
        } // for
    } // drawTile
    
    function monitorTile(monitor_tile, init_col, init_row) {
        if (monitor_tile.src && (! monitor_tile.complete)) {
            // add the tile to the queued tiles array
            queued_tiles.push({
                tile: monitor_tile,
                col: init_col,
                row: init_row
            });
            
            // draw the placeholder to the column and row
            drawTile(placeholder_tile, init_col, init_row);
        
            monitor_tile.onload = function() {
                if (! updating_tile_canvas) {
                    clearTimeout(queued_load_timeout);
                    queued_load_timeout = setTimeout(function() {
                        // flag the we are updating the tile canvas
                        updating_tile_canvas = true;
                        try {
                            // iterate through the tiles in the queued tiles and if they are loaded, then draw them
                            var ii = 0;
                            while (ii < queued_tiles.length) {
                                if (queued_tiles[ii].tile.complete) {
                                    drawTile(
                                        queued_tiles[ii].tile, 
                                        queued_tiles[ii].col, 
                                        queued_tiles[ii].row);
                    
                                    // splice the current tile out of the array
                                    queued_tiles.splice(ii, 1);
                                }
                                else {
                                    ii++;
                                } // if..else
                            } // while
                        } 
                        catch (e) {
                            LOGGER.exception(e);
                        }
                        finally {
                            updating_tile_canvas = false;
                        } // try..finally
                    }, QUEUE_REDRAW_DELAY);
                } // if
            };
        }
        else {
            drawTile(monitor_tile, init_col, init_row);
        } // if..else
    } // monitorTile
    
    function needTiles(offset, offset_delta) {
        // initialise the return offset
        var fnresult = new SLICK.Vector(offset.x, offset.y);
        
        // fire the on need tiles event
        if (args.onNeedTiles) {
            queued_tiles = [];
            args.onNeedTiles(offset_delta);
            
            // shift the canvas by the required amount
            // shiftCanvas(offset_delta);
            
            /*
            // shift the queued tiles
            for (var ii = 0; ii < queued_tiles.length; ii++) {
                queued_tiles[ii].col += offset_delta.cols;
                queued_tiles[ii].row += offset_delta.rows;
            } // for
            
            */
            
            fnresult.x += tile_size * offset_delta.cols;
            fnresult.y += tile_size * offset_delta.rows;
        } // if
        
        return fnresult;
    } // loadTiles
    
    function prepCanvas(prep_canvas) {
        // if the canvas is not defined, then log a warning and return
        if (! prep_canvas) {
            LOGGER.warn("Cannot prep canvas - not supplied");
            return;
        } // if
        
        // get the tile context
        var tile_context = prep_canvas.getContext("2d");
        
        tile_context.fillStyle = "rgb(200, 200, 200)";
        tile_context.fillRect(0, 0, prep_canvas.width, prep_canvas.height);
        
        // set the context line color and style
        tile_context.strokeStyle = "rgb(180, 180, 180)";
        tile_context.lineWidth = 0.5;

        for (var xx = 0; xx < prep_canvas.width; xx += GRID_LINE_SPACING) {
            // draw the column lines
            tile_context.beginPath();
            tile_context.moveTo(xx, 0);
            tile_context.lineTo(xx, prep_canvas.height);
            tile_context.stroke();
            tile_context.closePath();

            for (var yy = 0; yy < prep_canvas.height; yy += GRID_LINE_SPACING) {
                // draw the row lines
                tile_context.beginPath();
                tile_context.moveTo(0, yy);
                tile_context.lineTo(prep_canvas.width, yy);
                tile_context.stroke();
                tile_context.closePath();
            } // for
        } // for        
    }
    
    // initialise the parent
    var parent = new SLICK.OffscreenCanvas(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        customdata: {},
        columns: col_count,
        rows: row_count,
        centerTile: { 
            col: Math.ceil(col_count * 0.5),
            row: Math.ceil(row_count * 0.5)
        },
        
        /*
        This function is used to determine whether we have sufficient tiles, or whether additional
        tiles need to be loaded due to panning.  Note that tile buffers should not be examined or 
        re-evaluated when scaling as it would just be silly...
        */
        checkTileBuffers: function(view, buffer_required) {
            // if the buffer required is not defined, then set to the default
            if (! buffer_required) {
                buffer_required = SLICK.TilerConfig.TILEBUFFER_LOADNEW;
            } // if
            
            // get the offset and dimensions
            var offset = view.pannable ? view.getOffset() : new Vector();
            var dimensions = view.getDimensions();
            
            // calculate the current display rect
            var display_rect = {
                top: offset.y,
                left: offset.x,
                bottom: offset.y + dimensions.height,
                right: offset.x + dimensions.width
            }; 
            var offset_delta = {
                cols: 0,
                rows: 0
            };
            
            LOGGER.info(String.format("CHECKING TILE BUFFERS, display rect = (top: {0}, left: {1}, bottom: {2}, right: {3})", display_rect.top, display_rect.left, display_rect.bottom, display_rect.right));

            // check the y tolerances
            if (display_rect.top <= (tile_size * buffer_required)) {
                offset_delta.rows = Math.abs(Math.floor(display_rect.top / tile_size)) + 1;
            }
            else if (display_rect.bottom + (tile_size * buffer_required) >= self.height) {
                offset_delta.rows = -(Math.floor((display_rect.bottom - self.height) / tile_size) + 1);
            } // if..else

            // check the x tolerances
            if (display_rect.left <= (tile_size * buffer_required)) {
                offset_delta.cols = Math.abs(Math.floor(display_rect.left / tile_size)) + 1;
            }
            else if (display_rect.right + (tile_size * buffer_required) >= self.width) {
                offset_delta.cols = -(Math.floor((display_rect.right - self.width) / tile_size) + 1);
            } // if..else

            // if things have changed then we need to change them
            if ((offset_delta.rows !== 0) || (offset_delta.cols !== 0)) {
                updated_offset = needTiles(offset, offset_delta);
                view.updateOffset(updated_offset.x, updated_offset.y);
            } // if
        },
        
        requestUpdates: function(listener) {
            update_listeners.push(listener);
        },
        
        getGridHeight: function() {
            return row_count * tile_size;
        },
        
        getGridWidth: function() {
            return col_count * tile_size;
        },
        
        getTile: function(col, row) {
            if ((col < col_count) && (col >= 0) && (row < row_count) && (row >= 0)) {
                return tiles[(row * row_count) + col];
            } // if
            
            // otherwise, return null
            return null;
        },
        
        setTile: function(col, row, tile) {
            tile = tile ? tile : placeholder_tile;
            
            // update the tile in the arrah
            tiles[(row * row_count) + col] = tile;
            
            // draw the tile if valid
            if (tile) {
                monitorTile(tile, col, row);
            } // if
        },
        
        getTileSize: function() {
            return tile_size;
        }
    });
    
    return self;
}; // SLICK.TileGrid

SLICK.Tiler = function(args) {
    // define default args
    var DEFAULT_ARGS = {
        container: "",
        panHandler: null,
        tapHandler: null,
        onDraw: null
    }; 
    
    // TODO: add some error detection here
    
    // apply touch functionality
    jQuery(args.container).canTouchThis({
        touchStartHandler: function(x, y) {
            // reset the scale to 0
            self.scale(0);
        },

        tapHandler: function(x, y) {
            if (self.args.tapHandler) {
                self.args.tapHandler(x, y);
            } // if
        }
    });
    
    // initialise layers
    var grid = null;
    var overlays = [];
    
    // create the parent
    var view = new SLICK.View(jQuery.extend({}, args, {
        onDraw: function(context) {
            if (grid) {
                grid.drawToView(view);
                
                // iterate through the overlays and draw them to the view also
                for (var ii = 0; ii < overlays.length; ii++) {
                    overlays[ii].drawToView(view);
                } // for
            } // if
            
            // if we have been passed an onDraw handler, then call that too
            if (self.args.onDraw) {
                self.args.onDraw(context);
            } // if
        }
    }));
    
    // create some behaviour mixins
    var pannable = new SLICK.Pannable({
        container: args.container,
        /*
        checkOffset: function(offset) {
            if (grid) {
                // get the dimensions of the tiler
                var dimensions = self.getDimensions();
                
                LOGGER.info("offset before check: " + offset);
                offset.x = Math.min(Math.max(offset.x, 0), grid.width - dimensions.width);
                offset.y = Math.min(Math.max(offset.y, 0), grid.height - dimensions.height);
                LOGGER.info("offset after check:  " + offset);
            } // if
            
            return offset;
        },
        */
        onPan: function(x, y) {
            if (grid) {
                self.invalidate(true);
                
                // get the grid to check tile buffers
                grid.checkTileBuffers(self);
                
                // if we have a pan handler defined, then call it
                if (self.args.panHandler) {
                    self.args.panHandler(x, y);
                } // if
            } // if
        }
    }); // pannable
    
    var scalable = new SLICK.Scalable({
        container: args.container,
        onScale: function(scale_amount) {
            if (grid) {
                self.invalidate(true);
            } // if
        }
    }); // scalable
    
    // initialise self
    var self = jQuery.extend(view, pannable, scalable, {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        
        getGrid: function() {
            return grid;
        },
        
        setGrid: function(value) {
            grid = value;
            self.invalidate();
            
            grid.requestUpdates(function() {
                self.invalidate();
            });
        },
        
        gridPixToViewPix: function(vector) {
            var offset = self.getOffset();
            return new SLICK.Vector(vector.x - offset.x, vector.y - offset.y);
        },
        
        viewPixToGridPix: function(vector) {
            var offset = self.getOffset();
            LOGGER.info("Offset = " + offset);
            return new SLICK.Vector(vector.x + offset.x, vector.y + offset.y);
        }
    }); // self
    
    return self;
}; // Tiler
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
SLICK.MapTileGrid = function(args) {
    // initailise defaults
    var DEFAULT_BUFFER_SIZE = 1;
    
    // initialise default args
    var DEFAULT_ARGS = {
        
    };
    
    // initialise variables
    var rads_per_pixel = 0;
    var center_pos = new GEO.Position();
    var bl_mercator_pix = null;
    var grid_bounds = new GEO.BoundingBox();
    
    function calculateGridBounds() {
        if (center_pos.isEmpty() || (rads_per_pixel === 0)) { return; }
        
        // determine the mercator 
        var center_mercator_pix = center_pos.getMercatorPixels(rads_per_pixel);
            
        // now calculate the top left mercator pix
        bl_mercator_pix = new SLICK.Vector(
            center_mercator_pix.x - (self.getGridWidth() * 0.5),
            center_mercator_pix.y - (self.getGridHeight() * 0.5));
            
        LOGGER.info("CALCULATING GRID BOUNDS");
        LOGGER.info("center position:             " + center_pos);
        LOGGER.info("center mercator pixels:      " + center_mercator_pix);
        LOGGER.info("bottom left mercator pixels: " + bl_mercator_pix);
            
        updateGridBounds();
    } // calculateGridBounds
    
    function updateGridBounds() {
        // set the bounds min position
        grid_bounds.min.setMercatorPixels(
            bl_mercator_pix.x, 
            bl_mercator_pix.y, 
            rads_per_pixel);
            
        // set the max bounds position
        grid_bounds.max.setMercatorPixels(
            bl_mercator_pix.x + self.getGridWidth(),
            bl_mercator_pix.y + self.getGridHeight(),
            rads_per_pixel);
    } // updateGridBounds
    
    // initialise parent
    var parent = new SLICK.TileGrid(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        getBoundingBox: function() {
            return grid_bounds;
        },
        
        getMercatorMin: function() {
            return new SLICK.Vector(bl_mercator_pix.x, bl_mercator_pix.y);
        },
        
        getCenterPos: function() {
            return center_pos;
        },
        
        setCenterPos: function(value) {
            // update the center position
            center_pos.copy(value);
            calculateGridBounds();
        },
        
        getTopLeftMercatorPixels: function() {
            return new SLICK.Vector(bl_mercator_pix.x, bl_mercator_pix.y + self.getGridHeight());
        },
        
        getMercatorPixelsForPos: function(pos) {
            return pos.getMercatorPixels(rads_per_pixel);
        },
        
        getGridXYForPosition: function(pos) {
            // determine the mercator pixels for teh position
            var pos_mp = pos.getMercatorPixels(rads_per_pixel);

            // calculate the offsets
            LOGGER.info("GETTING OFFSET for position: " + pos);
            var offset_x = Math.abs(pos_mp.x - bl_mercator_pix.x) + self.getTileSize();
            var offset_y = self.getGridHeight() - Math.abs(pos_mp.y - bl_mercator_pix.y) + self.getTileSize();
            
            LOGGER.info("position mercator pixels: " + pos_mp);
            LOGGER.info("bottom left mercator pixels: " + bl_mercator_pix);
            LOGGER.info("calcalated pos offset:    " + offset_x + ", " + offset_y);
            
            return new SLICK.Vector(offset_x, offset_y);
        },
        
        getRadsPerPixel: function() {
            return rads_per_pixel;
        },
        
        setRadsPerPixel: function(value) {
            if (rads_per_pixel !== value) {
                rads_per_pixel = value;
                calculateGridBounds();
            } // if
        },
        
        pixelsToPos: function(vector) {
            // initialise the new position object
            var fnresult = new GEO.Position();
            
            // update the position pixels
            fnresult.setMercatorPixels(
                bl_mercator_pix.x + vector.x - self.getTileSize(), 
                bl_mercator_pix.y + Math.abs(self.getGridHeight() - vector.y) + self.getTileSize(), 
                rads_per_pixel);
            
            // return the position
            return fnresult;
        },
        
        offsetPixelPositions: function(offset_delta) {
            // get the tile size
            // inverse the results as -cols is the top, -rows is the left, which was a bit confusing in hindsight...
            var offset_x = -offset_delta.cols * self.getTileSize();
            var offset_y = -offset_delta.rows * self.getTileSize();
            
            LOGGER.info("OFFSETTING MERCATOR POSITIONS BY: x: " + offset_x + ", y: " + offset_y);
            LOGGER.info("bottom left mercator before: " + bl_mercator_pix);
            bl_mercator_pix.x += offset_x;
            bl_mercator_pix.y -= offset_y;
            LOGGER.info("bottom left mercator after:  " + bl_mercator_pix);
            
            // update the grid bounds
            updateGridBounds();
        }
    });
    
    return self;
}; // SLICK.MapTileGrid

SLICK.MappingTiler = function(args) {
    // initialise defaults
    var DEFAULT_ARGS = {
        tapExtent: 10,
        provider: null
    };
    
    // extend the args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // initialise variables
    var provider = args.provider;
    var zoom_level = 10;
    var current_position = null;
    
    // if the data provider has not been created, then create a default one
    if (! provider) {
        provider = new GEO.MapProvider();
    } // if
    
    // if we have a pan handler in the args, then save it as we are going to insert our own
    var caller_pan_handler = args.panHandler;
    var caller_tap_handler = args.tapHandler;
    var pins = {};
    
    /*
    function mercatorPixelsToScreen(x, y) {
        // get the current offset
        var offset = self.pannable ? self.getOffset() : new SLICK.Vector();
        var grid = self.getGrid();
        var dimensions = self.getDimensions();
        var fnresult = new SLICK.Vector();
        
        if (grid) {
            var minmerc = grid.getMercatorMin();
            
            // calculate the x position
            fnresult.x = Math.abs(x - minmerc.x) - offset.x;
            fnresult.y = dimensions.height - (Math.abs(minmerc.y - y) - offset.y);
        } // if
        
        return fnresult;
    } // 
    */
    
    // initialise our own pan handler
    args.panHandler = function(x, y) {
        // get the grid
        var grid = self.getGrid();
        if (grid) {
            // get the current grid rect
            bounds = grid.getBoundingBox();
        } // if
        
        if (caller_pan_handler) {
            caller_pan_handler(x, y);
        } // if
    }; // 
    
    // initialise our own tap handler
    args.tapHandler = function(x, y) {
        var grid = self.getGrid();
        var tap_bounds = null;
        
        if (grid) {
            var grid_pos = self.viewPixToGridPix(new SLICK.Vector(x, y));

            // create a min xy and a max xy using a tap extent
            var min_pos = grid.pixelsToPos(grid_pos.offset(-args.tapExtent, args.tapExtent));
            var max_pos = grid.pixelsToPos(grid_pos.offset(args.tapExtent, -args.tapExtent));
            
            // turn that into a bounds object
            tap_bounds = new GEO.BoundingBox(min_pos.toString(), max_pos.toString());
            
            LOGGER.info("tap bounds = " + tap_bounds);
        } // if
        
        if (caller_tap_handler) {
            caller_tap_handler(x, y, tap_bounds); 
        } // if
    }; // tapHandler
    
    args.onDraw = function(context) {
        // get the offset
        var offset = self.pannable ? self.getOffset() : new SLICK.Vector();;
        var grid = self.getGrid();

        // draw each of the pins
        for (var pin_id in pins) {
            if (pins[pin_id] && grid) {
                // get the offset for the position
                var xy = self.gridPixToViewPix(grid.getGridXYForPosition(pins[pin_id].poi.pos));
                pins[pin_id].drawToContext(context, xy.x, xy.y);
            } // if
        } // for
    }; // onDraw
    
    // create the base tiler
    var parent = new SLICK.Tiler(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        getBoundingBox: function(buffer_size) {
            // initialise the buffer size if left null
            buffer_size = buffer_size ? buffer_size : 0;
            
            // get the current dimensions
            var dimensions = self.getDimensions();
            var offset = self.getOffset();
            var grid_bounds = self.getGrid().getBoundingBox();

            // get the display bounds (first shrink)
            var displayBounds = grid_bounds.transform([
                    GEO.TRANSFORM.Shrink(dimensions.width + buffer_size * 2, dimensions.height + buffer_size * 2),
                    GEO.TRANSFORM.Offset(offset.x + buffer_size, offset.y + buffer_size)]);

            return displayBounds;
        },
        
        getCenterPosition: function() {
            // TODO: detect and retrieve the center position
            return null;
        },
        
        gotoPosition: function(position, new_zoom_level, callback) {
            // if a new zoom level is specified, then use it
            zoom_level = new_zoom_level ? new_zoom_level : zoom_level;
            
            // if the zoom level is not defined, then raise an exception
            if (! zoom_level) {
                throw "Zoom level required to goto a position.";
            } // if
            
            // update the provider zoom level
            provider.zoomLevel = zoom_level;
            provider.getMapTiles(self, position, function(tile_grid) {
                LOGGER.info(String.format("created tile grid {0} x {1}", tile_grid.columns, tile_grid.rows));
                self.setGrid(tile_grid);
                
                self.panToPosition(position, callback);
            });
        },
        
        panToPosition: function(position, callback) {
            var grid = self.getGrid();
            if (grid) {
                // determine the tile offset for the requested position
                var center_xy = grid.getGridXYForPosition(position);
                var dimensions = self.getDimensions();
            
                // determine the actual pan amount, by calculating the center of the viewport
                center_xy.x -= dimensions.width * 0.5;
                center_xy.y -= dimensions.height * 0.5;
            
                // pan the required amount
                LOGGER.info(String.format("need to apply pan vector of ({0}) to correctly center", center_xy));
                LOGGER.info("offset before pan = " + self.getOffset());
                self.pan(center_xy.x, center_xy.y);
                LOGGER.info("offset after pan = " + self.getOffset());
            
                // if we have a callback defined, then run it
                if (callback) {
                    callback(self);
                } // if
            } // if
        },
        
        setZoomLevel: function(value) {
            if (zoom_level !== value) {
                zoom_level = value;
            } // if
            
            // if the current position is set, then goto the updated position
            self.gotoPosition(self.getCenterPosition(), zoom_level);
        },
        
        /* poi methods */
        
        addPOI: function(poi) {
            var grid = self.getGrid();
            
            if (grid && poi && poi.id && poi.pos) {
                // create the pin
                pins[poi.id] = new GEO.POIPin({
                    poi: poi
                });
                self.invalidate();
            } // if
        },
        
        removePOI: function(poi) {
            LOGGER.info("removing poi: " + poi);
            if (poi && poi.id) {
                pins[poi.id] = null;
                self.invalidate();
            } // if
        }
    }, parent);
    
    return self;
}; // MapTiler
GEO.PointOfInterest = function(args) {
    // initialise default parameters
    var DEFAULT_ARGS = {
        id: 0,
        title: "",
        pos: null,
        lat: "",
        lon: "",
        type: "",
        retrieved: 0
    };

    // extend args with defaults
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // if the position is not defined, but we have a lat and lon, create a new position
    if ((! args.pos) && args.lat && args.lon) {
        args.pos = new GEO.Position(args.lat, args.lon);
    } // if
    
    // initialise self
    var self = {
        id: args.id,
        title: args.title,
        pos: args.pos,
        pin: null,
        type: args.type,
        
        toString: function() {
            return String.format("{0}: '{1}'", self.id, self.title);
        }
    };
    
    return self;
}; // PointOfInterest

GEO.POIPin = function(args) {
    // initialise the default args
    var DEFAULT_ARGS = {
        poi: null
    }; // DEFAULT_ARGS
    
    // initialise args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // initialise self
    var self = {
        poi: args.poi,
        
        drawToContext: function(context, x, y) {
            if (pin_image && pin_image.complete) {
                LOGGER.info(String.format("DRAWING POI: {0} @ {1}, {2}", self.poi, x, y));
                context.drawImage(pin_image, x, y);
            } // if
        }
    }; // self
    
    // load the image
    // TODO: make this more generic
    var pin_image = new Image();
    pin_image.src = "/public/images/app/markers/" + self.poi.type + ".png";
    
    return self;
}; // POIPin

GEO.POIInfoBox = function(args) {
    // initialise default args
    var DEFAULT_ARGS = {
        pois: []
    }; // initialise

    // extend args with the defaults
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // initialise the pois
    var active_poi = null;
    var pois = args.pois;
    var poi_index = 0;
    
    function updateButtons() {
        var buttons = [];
        
        if (pois.length > 1) {
            // push some test buttons
            buttons.push({
                text: "Back",
                click: function() {
                    self.setActivePOI(poi_index - 1);
                }
            });

            buttons.push({
                text: "Next",
                click: function() {
                    self.setActivePOI(poi_index + 1);
                },
                align: 'right'
            });
        } // if
        
        buttons.push({
            text: "View Details",
            click: function() {
                // save a reference to the button
                var this_button = this;
                
                if (self.getDetailsVisible()) {
                    self.hideDetails();
                }
                else if (self.args.requirePOIDetails) {
                    self.args.requirePOIDetails(self.getActivePOI(), function(details_html) {
                        self.showDetails(details_html);
                    });
                } // if..else
            },
            align: 'center'
        });

        // update the buttons
        self.setButtons(buttons);
    } // updateButtons
    
    function updateDisplay() {
        LOGGER.info("updating poi display: index = " + poi_index);
        
        active_poi = null;
        if ((poi_index >= 0) && (poi_index < pois.length)) {
            active_poi = pois[poi_index];
            self.updateContent("<h4>" + active_poi.title + "</h4>");

            // if the details are visible, then hide them
            if (self.getDetailsVisible()) {
                if (self.args.requirePOIDetails) {
                    self.args.requirePOIDetails(active_poi, function(details_html) {
                        self.showDetails(details_html);
                    });
                }
                else {
                    self.hideDetails();
                } // if..else
            } // if
        } // if
    } // updateDisplay
    
    // create the parent
    var parent = new SLICK.InfoBox(args);
    
    // initialise self
    var self = jQuery.extend({}, parent, {
        args: args,
        
        getActivePOI: function() {
            return active_poi;
        },
        
        setActivePOI: function(index, force_change) {
            // wrap the index 
            if (index < 0) {
                index = pois.length - 1;
            }
            else if (index >= pois.length) {
                index = 0;
            } // if..else
            
            // if the index is different, then update
            if ((index != poi_index) || force_change) {
                poi_index = index;
                updateDisplay();
                
                // if we have a poi changed event then fire that
                if (args.handlePOIChange) {
                    args.handlePOIChange(pois[poi_index]);
                } // if
            } // if
        },
        
        setPOIs: function(poi_array) {
            pois = [];
            for (var ii = 0; poi_array && (ii < poi_array.length); ii++) {
                pois.push(poi_array[ii]);
            } // for
            
            // if we have pois, then display the info box, if not then hide it
            if (pois.length > 0) {
                updateButtons();
                self.show();
                
                // update the display by forcing a poi update
                self.setActivePOI(0, true);
            }
            else {
                self.hide();
            } // if..else
        } // setPOIs
    });
    
    return self;
}; // POIInfoBox

/*
This class is used to store a list of points of interest and offer some 
simple operations on that array that make managing the pois simpler.

TODO: optimize the find functions
TODO: add a sort function to sort the pois 
*/
GEO.POILayer = function(args) {
    // initialise default args
    var DEFAULT_ARGS = {
        visibilityChange: null
    }; 
    
    // initialise variables
    var storage = [];
    var visible = true;
    
    // initialise self
    var self = {
        args: jQuery.extend({}, DEFAULT_ARGS, args),
        
        getPOIs: function() {
            var fnresult = [];
            for (var ii = 0; ii < storage.length; ii++) {
                fnresult.push(storage[ii]);
            } // for
            
            return fnresult;
        },
        
        getOldPOIs: function(test_time) {
            var fnresult = [];
            for (var ii = 0; ii < storage.length; ii++) {
                if (storage[ii].retrieved < test_time) {
                    fnresult.push(storage[ii]);
                } // if
            } // for
            
            return fnresult;
        },
        
        getVisible: function() {
            return visible;
        },
        
        setVisible: function(value) {
            if (value != visible) {
                visible = value;
                
                // fire the visibility change event
                if (args.visibilityChange) {
                    args.visibilityChange();
                } // if
            } // if
        },
        
        findById: function(search_id) {
            for (var ii = 0; ii < storage.length; ii++) {
                if (storage[ii].id == search_id) {
                    return storage[ii];
                } // if
            } // for
            
            // no result, found return null
            return null;
        },
        
        /*
        Method:  findByBounds
        Returns an array of the points of interest that have been located within
        the bounds of the specified bounding box
        */
        findByBounds: function(search_bounds) {
            var fnresult = [];
            
            // iterate through the pois and check whether they are in the bounds
            for (var ii = 0; ii < storage.length; ii++) {
                if (storage[ii].pos && storage[ii].pos.inBounds(search_bounds)) {
                    fnresult.push(storage[ii]);
                } // if
            } // for
            
            return fnresult;
        },
        
        removeById: function(search_id) {
            // iterate through the array and look for the matching item, when found splice it out of the array
            for (var ii = 0; ii < storage.length; ii++) {
                if (storage[ii].id == search_id) {
                    // TODO: investigate how intesive splice is and whether it would be better batched and use delete
                    storage.splice(ii, 1);
                    return;
                } // if
            } // for
        },
        
        addPOIs: function(new_pois, clear_existing) {
            // if we need to clear existing, then reset the storage
            if (clear_existing) {
                storage = [];
            } // if
            
            // iterate through the new pois and put into storage
            for (var ii = 0; new_pois && (ii < new_pois.length); ii++) {
                new_pois[ii].retrieved = new Date().getTime();
                storage.push(new_pois[ii]);
            } // for
        }
    };
    
    return self;
}; // GEO.POILayer

/*
The POIProvider class is used to define generic methods for implementing
something that is going to provide point of interest information on a map.
The provider does not handle displaying any information about the POI, nor
does it enabling pinning on the map.  It simply is responsible for optimized
data retrieval for points of interest.  To that end, the POI provider has 
events that inform the application / tiler when points of interest are added
or removed and hence should be added to or removed from the map.  
*/
GEO.POIProvider = function(args) {
    // initialise default args
    var DEFAULT_ARGS = {
        poitype: "",
        onInitRequest: null,
        onCheckBounds: null,
        onParseResponse: null,
        onPOIAdded: null,
        onPOIDeleted: null,
        onChangedPOIs: null,
        layerClass: GEO.POILayer
    }; 
    
    // initialise variables
    var last_bounds = new GEO.BoundingBox();
    var next_bounds = new GEO.BoundingBox();
    var request_active = false;
    var request_timer = 0;
    var update_listeners = [];
    
    /*
    Function:  updatePOIs
    This function is used to compare the old poi array and new poi arrays 
    retrieved from the provider.  Determine which of the pois have been added, 
    which ones removed.  TODO: support poi title changes, etc.
    */
    function updatePOIs(refreshed_pois) {
        // initialise arrays to receive the pois
        var new_pois = [];
        var ii = 0;
        var time_retrieved = new Date().getTime();
        
        LOGGER.info(String.format("{0} pois to process :)", refreshed_pois.length));
        
        // iterate through the pois and determine state
        for (ii = 0; ii < refreshed_pois.length; ii++) {
            // look for the poi in the poi layer
            var found_poi = self.pois.findById(refreshed_pois[ii].id);
        
            // add the poi to either the update or new array according to whether it was found
            if (found_poi) {
                found_poi.retrieved = time_retrieved;
            }
            else {
                new_pois.push(refreshed_pois[ii]);
            }
        } // for
    
        // now all we have left are deleted pois transpose those into the deleted list
        var deleted_pois = self.pois.getOldPOIs(time_retrieved);
        
        // add new pois to the poi layer
        self.pois.addPOIs(new_pois);
        LOGGER.info(String.format("POI-UPDATE: {0} new, {1} deleted", new_pois.length, deleted_pois.length));
            
        // fire the on poi added event when appropriate
        for (ii = 0; self.args.onPOIAdded && (ii < new_pois.length); ii++) {
            self.args.onPOIAdded(new_pois[ii]);
        } // for
    
        for (ii = 0; self.args.onPOIDeleted && (ii < deleted_pois.length); ii++) {
            self.args.onPOIDeleted(deleted_pois[ii]);
            self.pois.removeById(deleted_pois[ii].id);
        } // for
        
        // iterate through the update listeners and let them know things have changed
        for (ii = 0; ii < update_listeners.length; ii++) {
            update_listeners[ii](self);
        } // for
    } // updatePOIs
    
    // extend the args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // initialise self
    var self = {
        args: args,
        pois: new args.layerClass(),
        
        getForBounds: function(bounds, callback) {
            // if we are currently, executing a request, then save the bounds as the next query
            if (request_active) {
                next_bounds.copy(bounds);
                return;
            } // if
            
            if (request_timer) {
                clearTimeout(request_timer);
            };
            
            request_timer = setTimeout(function() {
                // check for empty bounds, if empty then exit
                if ((! bounds) || bounds.isEmpty()) {
                    LOGGER.warn("cannot get pois for empty bounding box");
                    return;
                } // if
            
                // calculate the bounds change
                var bounds_change = null;
                if (! last_bounds.isEmpty()) {
                    bounds_change = new GEO.Distance(last_bounds.min, bounds.min);
                } // if
            
                if ((! bounds_change) || self.testBoundsChange(bounds_change)) {
                    LOGGER.info("yep - bounds changed = " + bounds_change);

                    // define the ajax args
                    var ajax_args = jQuery.extend({
                        success: function(data, textStatus, raw_request) {
                            try {
                                // update the pois
                                updatePOIs(self.parseResponse(data, textStatus, raw_request));
                                request_active = false;
                            
                                if (callback) {
                                    callback(self.pois);
                                } // if
                            
                                // if we have a next request, then execute that request
                                request_timer = 0;
                                if (! next_bounds.isEmpty()) {
                                    self.getForBounds(next_bounds, callback);
                            
                                    // update the next bounds to empty
                                    next_bounds.clear();
                                } // if
                            }  
                            catch (e) {
                                LOGGER.exception(e);
                            } // try..catch
                        },
                        error: function(raw_request, textStatus, errorThrown) {
                            request_active = false;
                            LOGGER.error("failed getting POIS from server: " + textStatus + ":" + errorThrown);
                        }
                    }, self.initRequest());
                
                    // update the last bounds called and flag the request as active
                    last_bounds.copy(bounds);
                    request_active = true;
                
                    // make the request
                    LOGGER.info("Looking for POIS within bounding box");
                    jQuery.ajax(ajax_args);
                
                } // if
            }, 500);
        },
        
        initRequest: function() {
            return self.args.onInitRequest ? self.args.onInitRequest() : {};
        },
        
        parseResponse: function(data, textStatus, raw_request) {
            return self.args.onParseResponse ? self.args.onParseResponse(data, textStatus, raw_request) : [];
        },
        
        requestUpdates: function(callback) {
            update_listeners.push(callback);
        },
        
        testBoundsChange: function(distance) {
            LOGGER.info("testing for bounds change: distance = " + distance);
            
            // if the distance is equal to 0 don't call event, just return false
            if (distance && (distance.toKM() == 0)) { return false; }
            
            return self.args.onCheckBounds ? self.args.onCheckBounds(distance) : true;
        }
    };
    
    return self;
}; // GEO.POIProvider
