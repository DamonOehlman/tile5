/**
# T5
The T5 core module contains classes and functionality that support basic drawing 
operations and math that are used in managing and drawing the graphical and tiling interfaces 
that are provided in the Tile5 library.

## Classes
- T5.Vector (deprecated)

## Submodules
- T5.XY
- T5.XYRect
- T5.V
- T5.D

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


//= require "core/xy"
//= require "core/vector"
//= require "core/xyrect"
//= require "core/dimensions"