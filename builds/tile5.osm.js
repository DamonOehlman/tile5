/*!
 * Sidelab Tile5 Javascript Library v<%= T5_VERSION %>
 * http://tile5.org/
 *
 * Copyright 2010, <%= T5_AUTHOR %>
 * Licensed under the MIT licence
 * https://github.com/sidelab/tile5/blob/master/LICENSE.mdown
 *
 * Build Date: @DATE
 */

(function(scope) {
    //= require "../src/tile5"
    //= require "../src/engines/osm"
    
    scope.T5 = T5;
    scope.Tile5 = Tile5;
})(typeof window != 'undefined' ? window : exports);
