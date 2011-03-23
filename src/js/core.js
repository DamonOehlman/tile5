/**
# T5
The T5 core module contains classes and functionality that support basic drawing 
operations and math that are used in managing and drawing the graphical and tiling interfaces 
that are provided in the Tile5 library.

## Module Functions
*/

/* exports */

/**
### ticks()
*/
function ticks() {
    return new Date().getTime();
} // getTicks

/**
### userMessage(msgType, msgKey, msgHtml)
*/
function userMessage(msgType, msgKey, msgHtml) {
    exports.trigger('userMessage', msgType, msgKey, msgHtml);
} // userMessage

/*
Dmitry Baranovskiy's wonderful is function, sourced from RaphaelJS:
https://github.com/DmitryBaranovskiy/raphael
*/
function isType(o, type) {
    type = lowerCase.call(type);
    if (type == "finite") {
        return !isnan[has](+o);
    }
    return  (type == "null" && o === null) ||
            (type == typeof o) ||
            (type == "object" && o === Object(o)) ||
            (type == "array" && Array.isArray && Array.isArray(o)) ||
            objectToString.call(o).slice(8, -1).toLowerCase() == type;
}; // is

//= require "core/xy"
//= require "core/vector"
//= require "core/xyrect"
//= require "core/dimensions"
//= require "core/hits"