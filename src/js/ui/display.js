/*
File:  slick.display.js
This file is used to generate utility methods that can be used with 
touchscreen devices, screen size detection, etc.

Section: Version History
21/05/2010 (DJO) - Created File
*/

SLICK.DisplayOpts = {
    ajaxActivityImage: "images/ajax-loader.gif"
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
    args = GRUNT.extend({}, DEFAULT_ARGS, args);
    
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
                    GRUNT.Log.exception(e);
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
            // TODO: replace the jQuery ajax start and stop functionality with some GRUNTY goodness (current code does nothing)
            GRUNT.Log.info("ajax activity indicator: " + SLICK.DisplayOpts.ajaxActivityImage);
            if (SLICK.DisplayOpts.ajaxActivityImage) {
                self.addChunk(String.format("<img id='{0}' src='{1}' />", LOADER_ID, SLICK.Resources.getPath(SLICK.DisplayOpts.ajaxActivityImage)), LOADER_POS_PREFS);
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
