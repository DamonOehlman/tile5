/*
File:  slick.display.js
This file is used to generate utility methods that can be used with 
touchscreen devices, screen size detection, etc.

Section: Version History
21/05/2010 (DJO) - Created File
*/

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
    
    // include default args
    args = jQuery.extend({}, DEFAULT_ARGS, args);
    
    // find the container for the info box
    var container = null;
    var container_opts = [args.position, "top", "bottom"];
    for (var ii = 0; (! container) && (ii < container_opts.length); ii++) {
        container = jQuery("#anchor-" + container_opts[ii]).get(0);
    } // for
    
    // create the top box with the style of hidden
    jQuery(container).append(String.format("<div id='{0}' class='infobox {2}'><div class='box-content'>{1}</div><div class='box-buttons'></div></div>", box_id, args.content, args.classes.join(" ")));
    
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
    
    // initialise self
    var self = {
        buttons: args.buttons,
        
        getId: function() {
            return box_id;
        },
        
        setButtons: function(value) {
            // TODO: I really feel like I should copy the items across, but I don't know why...
            self.buttons = value;
            createButtons();
        },
        
        show: function() {
            getBox().slideDown("normal", function() {
                getBox().find(".box-buttons").show();
            });
        },
        
        hide: function() {
            getBox().find(".box-buttons").hide();
            getBox().slideUp("normal");
        },
        
        updateContent: function(html_content) {
            getBox().find('.box-content').html(html_content);
        }
    };
    
    // create the buttons
    createButtons();
    
    return self;
}; // SLICK.TopBox

/*
Module: SLICK.DisplayHelper
This module is used to define helpers for determining screen size, etc
*/
SLICK.DisplayHelper = function() {
    // initialise private variables

    // initialise self
    var self = {
    }; // 
    
    return self;
};

// initialise the screen object
SLICK.display = new SLICK.DisplayHelper();