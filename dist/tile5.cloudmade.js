/*!
 * Sidelab Tile5 Javascript Library v1.0RC1
 * http://tile5.org/
 *
 * Copyright 2010, Damon Oehlman <damon.oehlman@sidelab.com>
 * Licensed under the MIT licence
 * https://github.com/sidelab/tile5/blob/master/LICENSE.mdown
 *
 * Build Date: @DATE
 */

(function() {

    /* internals */

    var loadedPlugins = {},
        reTrim = /^(.*)\s+$/,
        reDots = /\./g;

    function define(id, definition) {
        loadedPlugins[id] = definition;
    } // define

    function findPlugins(input) {
        var plugins = input.split(','),
            requestedPlugins = [];

        for (var ii = 0; ii < plugins.length; ii++) {
            var pluginId = plugins[ii].replace(reTrim, '$1').replace(reDots, '/');
            requestedPlugins[ii] = loadedPlugins[pluginId];
        } // for

        return requestedPlugins;
    } // findPlugins

    function require(input, callback) {
        var plugins = input.split(','),
            allLoaded = true,
            labLoader = typeof $LAB !== 'undefined' ? $LAB : null,
            pluginName;

        for (var ii = 0; ii < plugins.length; ii++) {
            var pluginId = plugins[ii].replace(reTrim, '$1').replace(reDots, '/'),
                plugin;

            if (! loadedPlugins[pluginId]) {
                allLoaded = false;

                if (IS_COMMONJS) {
                    plugin = require('./plugins/' + pluginFile);
                }
                else if (labLoader) {
                } // if..else
            } // for
        } // for

        if (callback) {
            if (IS_COMMONJS || allLoaded) {
                callback.apply(GeoJS, findPlugins(input));
            }
            else if (labLoader) {
                $LAB.wait(function() {
                    callback.apply(GeoJS, findPlugins(input));
                });
            } // if..else
        } // if

        return GeoJS;
    } // include

var LAT_VARIABILITIES = [
    1.406245461070741,
    1.321415085624082,
    1.077179995861952,
    0.703119412486786,
    0.488332580888611
];

var IS_COMMONJS = typeof module != 'undefined' && module.exports,
    TWO_PI = Math.PI * 2,
    HALF_PI = Math.PI / 2,
    VECTOR_SIMPLIFICATION = 3,
    DEGREES_TO_RADIANS = Math.PI / 180,
    RADIANS_TO_DEGREES = 180 / Math.PI,
    MAX_LAT = 90, //  85.0511 * DEGREES_TO_RADIANS, // TODO: validate this instead of using HALF_PI
    MIN_LAT = -MAX_LAT,
    MAX_LON = 180,
    MIN_LON = -MAX_LON,
    MAX_LAT_RAD = MAX_LAT * DEGREES_TO_RADIANS,
    MIN_LAT_RAD = -MAX_LAT_RAD,
    MAX_LON_RAD = MAX_LON * DEGREES_TO_RADIANS,
    MIN_LON_RAD = -MAX_LON_RAD,
    M_PER_KM = 1000,
    KM_PER_RAD = 6371,
    M_PER_RAD = KM_PER_RAD * M_PER_KM,
    ECC = 0.08181919084262157,
    PHI_EPSILON = 1E-7,
    PHI_MAXITER = 12,

    reDelimitedSplit = /[\,\s]+/;
/**
# GeoJS.Pos

## Methods

### bearing(target)
Return the bearing in degrees to the target position.

### copy()
Return a copy of the position

### distanceTo(target)
Calculate the distance to the specified target position.  The distance
returned is in KM.

### equalTo(testPos)
Determine whether or not the position is equal to the test position.

### empty()
Return true if the position is empty

### to(dest, distance)
Calculate the position that sits between the destination Pos for the given distance.

*/
function Pos(p1, p2, radius) {
    if (p1 && p1.split) {
        var coords = p1.split(reDelimitedSplit);

        if (coords.length > 1) {
            p1 = coords[0];
            p2 = coords[1];
        } // if
    }
    else if (p1 && p1.lat) {
        p2 = p1.lon;
        p1 = p1.lat;
    } // if..else

    this.lat = parseFloat(p1 || 0);
    this.lon = parseFloat(p2 || 0);
    this.radius = radius || KM_PER_RAD;
} // Pos constructor

Pos.prototype = {
    constructor: Pos,

    bearing: function(target) {
        var lat1 = this.lat * DEGREES_TO_RADIANS,
            lat2 = target.lat * DEGREES_TO_RADIANS,
            dlon = (target.lon - this.lon) * DEGREES_TO_RADIANS,
            y = Math.sin(dlon) * Math.cos(lat2),
            x = Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlon),
            brng = Math.atan2(y, x);

        return (brng * RADIANS_TO_DEGREES + 360) % 360;
    },

    copy: function() {
        return new Pos(this.lat, this.lon);
    },

    distanceTo: function(pos) {
        if ((! pos) || this.empty() || pos.empty()) {
            return 0;
        } // if

        var halfdelta_lat = ((pos.lat - this.lat) * DEGREES_TO_RADIANS) / 2;
        var halfdelta_lon = ((pos.lon - this.lon) * DEGREES_TO_RADIANS) / 2;

        var a = Math.sin(halfdelta_lat) * Math.sin(halfdelta_lat) +
                (Math.cos(this.lat * DEGREES_TO_RADIANS) * Math.cos(pos.lat * DEGREES_TO_RADIANS)) *
                (Math.sin(halfdelta_lon) * Math.sin(halfdelta_lon)),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return this.radius * c;
    },

    equalTo: function(testPos) {
        return pos && (this.lat === testPos.lat) && (this.lon === testPos.lon);
    },

    empty: function() {
        return this.lat === 0 && this.lon === 0;
    },

    /**
    ### inArray(testArray)
    */
    inArray: function(testArray) {
        if (testArray) {
            for (var ii = testArray.length; ii--; ) {
                if (this.equal(testArray[ii])) {
                    return true;
                } // if
            } // for
        } // if

        return false;
    },

    /**
    ### offset(latOffset, lonOffset)
    Return a new position which is the original `pos` offset by
    the specified `latOffset` and `lonOffset` (which are specified in
    km distance)
    */
    offset: function(latOffset, lonOffset) {
        var radOffsetLat = latOffset / this.radius,
            radOffsetLon = lonOffset / this.radius,
            radLat = this.lat * DEGREES_TO_RADIANS,
            radLon = this.lon * DEGREES_TO_RADIANS,
            newLat = radLat + radOffsetLat,
            deltaLon = Math.asin(Math.sin(radOffsetLon) / Math.cos(radLat)),
            newLon = radLon + deltaLon;

        newLat = ((newLat + HALF_PI) % Math.PI) - HALF_PI;
        newLon = newLon % TWO_PI;

        return new Pos(newLat * RADIANS_TO_DEGREES, newLon * RADIANS_TO_DEGREES);
    },

    to: function(bearing, distance) {
        if (typeof bearing == 'object') {
            bearing = this.bearing(bearing);
        } // if

        var radDist = distance / this.radius,
            radBearing = bearing * DEGREES_TO_RADIANS,
            lat1 = this.lat * DEGREES_TO_RADIANS,
            lon1 = this.lon * DEGREES_TO_RADIANS,
            lat2 = Math.asin(Math.sin(lat1) * Math.cos(radDist) +
                    Math.cos(lat1) * Math.sin(radDist) * Math.cos(radBearing)),
            lon2 = lon1 + Math.atan2(
                    Math.sin(radBearing) * Math.sin(radDist) * Math.cos(lat1),
                    Math.cos(radDist) - Math.sin(lat1) * Math.sin(lat2)
            );

      lon2 = (lon2+3*Math.PI)%(2*Math.PI) - Math.PI;  // normalise to -180...+180

      return new Pos(lat2 * RADIANS_TO_DEGREES, lon2 * RADIANS_TO_DEGREES);
    },

    /**
    ### toBounds(distance)
    This function is very useful for creating a Geo.BoundingBox given a
    center position and a radial distance (specified in KM) from the center
    position.  Basically, imagine a circle is drawn around the center
    position with a radius of distance from the center position, and then
    a box is drawn to surround that circle.  Adapted from the [functions written
    in Java by Jan Philip Matuschek](http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates)
    */
    toBounds: function(distance) {
        var radDist = distance.radians(),
            radLat = this.lat * DEGREES_TO_RADIANS,
            radLon = this.lon * DEGREES_TO_RADIANS,
            minLat = radLat - radDist,
            maxLat = radLat + radDist,
            minLon, maxLon;


        if ((minLat > MIN_LAT_RAD) && (maxLat < MAX_LAT_RAD)) {
            var deltaLon = Math.asin(Math.sin(radDist) / Math.cos(radLat));

            minLon = radLon - deltaLon;
            if (minLon < MIN_LON_RAD) {
                minLon += TWO_PI;
            } // if

            maxLon = radLon + deltaLon;
            if (maxLon > MAX_LON_RAD) {
                maxLon -= TWO_PI;
            } // if
        }
        else {
            minLat = Math.max(minLat, MIN_LAT_RAD);
            maxLat = Math.min(maxLat, MAX_LAT_RAD);
            minLon = MIN_LON;
            maxLon = MAX_LON;
        } // if..else

        return new BBox(
            new Pos(minLat * RADIANS_TO_DEGREES, minLon * RADIANS_TO_DEGREES),
            new Pos(maxLat * RADIANS_TO_DEGREES, maxLon * RADIANS_TO_DEGREES));
    },

    /**
    ### toString()
    */
    toString: function(delimiter) {
        return this.lat + (delimiter || ' ') + this.lon;
    },

    /**
    ### valid()
    */
    valid: function() {
        return !(isNaN(this.lat) || isNaN(this.lon));
    }
};
/**
# GeoJS.Line

## Constructor

    new GeoJS.Line(positions);

## Methods

### distance()
The distance method is used to return the distance between the
positions specified in the Line.  A compound value is returned from the
method in the following form:

    {
        total: 0, // the total distance from the start to end position
        segments: [], // distance segments, 0 indexed. 0 = distance between pos 0 + pos 1
    }

### traverse(distance, distData)
This method is used to traverse along the line by the specified distance (in km). The method
will return the position that equates to the end point from travelling the distance.  If the
distance specified is longer than the line, then the end of the line is returned.  In some
cases you would call this method after a call to the `distance()` method, and if this is the
case it is best to pass that distance data in the `distData` argument.  If not, this will
be recalculated.

*/
function Line(positions) {
    this.positions = [];

    for (var ii = positions.length; ii--; ) {
        if (typeof positions[ii] == 'string') {
            this.positions[ii] = new Pos(positions[ii]);
        }
        else {
            this.positions[ii] = positions[ii];
        } // if..else
    } // for
} // Line

Line.prototype = {
    constructor: Line,

    distance: function() {
        var totalDist = 0,
            segmentDistances = [],
            distance;

        for (var ii = this.positions.length - 1; ii--; ) {
            distance = this.positions[ii].distanceTo(this.positions[ii + 1]);

            totalDist += segmentDistances[ii] = distance;;
        } // for

        return {
            total: totalDist,
            segments: segmentDistances
        };
    },

    traverse: function(distance, distData) {
        var elapsed = 0,
            posIdx = 0;

        if ((! distData) || (! distData.segments)) {
            distData = this.distance();
        } // if

        if (distance > distData.total) {
            return this.positions[this.positions.length - 1];
        }
        else if (distance <= 0) {
            return this.positions[0];
        }
        else {
            while (posIdx < distData.segments.length) {
                elapsed += distData.segments[posIdx];

                if (elapsed > distance) {
                    elapsed -= distData.segments[posIdx];
                    break;
                } // if

                posIdx++;
            } // while

            if (posIdx < this.positions.length - 1) {
                var pos1 = this.positions[posIdx],
                    pos2 = this.positions[posIdx + 1],
                    bearing = pos1.bearing(pos2);

                return pos1.to(bearing, distance - elapsed);
            }
            else {
                return this.positions[posIdx];
            } // if..else
        } // if..else
    }
};
/**
# GeoJS.BBox
*/
function BBox(p1, p2) {
    if (p1 && p1.splice) {
        var padding = p2,
            minPos = new Pos(MAX_LAT, MAX_LON),
            maxPos = new Pos(MIN_LAT, MIN_LON);

        for (var ii = p1.length; ii--; ) {
            var testPos = typeof p1[ii] == 'string' ? new Pos(p1[ii]) : p1[ii];

            if (testPos) {
                if (testPos.lat < minPos.lat) {
                    minPos.lat = testPos.lat;
                } // if

                if (testPos.lat > maxPos.lat) {
                    maxPos.lat = testPos.lat;
                } // if

                if (testPos.lon < minPos.lon) {
                    minPos.lon = testPos.lon;
                } // if

                if (testPos.lon > maxPos.lon) {
                    maxPos.lon = testPos.lon;
                } // if
            } // if
        } // for

        this.min = minPos;
        this.max = maxPos;

        if (typeof padding == 'undefined') {
            var size = this.size();

            padding = Math.max(size.x, size.y) * 0.3;
        } // if

        this.min = new Pos(minPos.lat - padding, (minPos.lon - padding) % 360);
        this.max = new Pos(maxPos.lat + padding, (maxPos.lon + padding) % 360);
    }
    else if (p1 && p1.min) {
        this.min = new Pos(p1.min);
        this.max = new Pos(p1.max);
    }
    else {
        this.min = p1;
        this.max = p2;
    } // if..else
} // BoundingBox

BBox.prototype = {
    constructor: BBox,

    /**
    ### bestZoomLevel(viewport)
    */
    bestZoomLevel: function(vpWidth, vpHeight) {
        var boundsCenter = this.center(),
            maxZoom = 1000,
            variabilityIndex = Math.min(
                Math.round(Math.abs(boundsCenter.lat) * 0.05),
                LAT_VARIABILITIES.length),
            variability = LAT_VARIABILITIES[variabilityIndex],
            delta = this.size(),
            bestZoomH = Math.ceil(
                Math.log(LAT_VARIABILITIES[3] * vpHeight / delta.y) / Math.LN2),

            bestZoomW = Math.ceil(
                Math.log(variability * vpWidth / delta.x) / Math.LN2);


        return Math.min(
            isNaN(bestZoomH) ? maxZoom : bestZoomH,
            isNaN(bestZoomW) ? maxZoom : bestZoomW
        );
    },

    /**
    ### center()
    */
    center: function() {
        var size = this.size();

        return new Pos(this.min.lat + size.y / 2, this.min.lon + size.x / 2);
    },

    /**
    ### expand(amount)
    */
    expand: function(amount) {
        return new BBox(
            new Pos(this.min.lat - amount, (this.min.lon - amount) % 360),
            new Pos(this.max.lat + amount, (this.max.lon + amount) % 360)
        );
    },

    /**
    ### size(normalize)
    */
    size: function(normalize) {
        var size = {
            x: 0,
            y: this.max.lat - this.min.lat
        };

        if (typeof normalize != 'undefined' && normalize && (this.min.lon > this.max.lon)) {
            size.x = 360 - this.min.lon + this.max.lon;
        }
        else {
            size.x = this.max.lon - this.min.lon;
        } // if..else

        return size;
    },

    /**
    ### toString()
    */
    toString: function() {
        return "min: " + this.min + ", max: " + this.max;
    },

    /**
    ### union
    */
    union: function() {
        var minPos = this.min.copy(),
            maxPos = this.max.copy();

        for (var ii = arguments.length; ii--; ) {
            if (arguments[ii]) {
                var testMin = arguments[ii].min,
                    testMax = arguments[ii].max;

                minPos.lat = Math.min(minPos.lat, testMin.lat);
                minPos.lon = Math.min(minPos.lon, testMin.lon);
                maxPos.lat = Math.max(maxPos.lat, testMax.lat);
                maxPos.lon = Math.max(maxPos.lon, testMax.lon);
            } // if
        } // for

        return new BBox(minPos, maxPos);
    }
};
/**
# GeoJS.Distance

## Methods
*/
function Distance(value) {
    if (typeof value == 'string') {
        var uom = (value.replace(/\d|\.|\s/g, '') || 'm').toLowerCase(),
            multipliers = {
                km: 1000
            };

        value = parseFloat(value) * (multipliers[uom] || 1);
    } // if

    this.meters = value || 0;
} // Distance

Distance.prototype = {
    /**
    ### add(args*)
    */
    add: function() {
        var total = this.meters;

        for (var ii = arguments.length; ii--; ) {
            var dist = typeof arguments[ii] == 'string' ?
                        new Distance(arguments[ii]) : arguments[ii];

            total += dist.meters;
        } // for

        return new Distance(total);
    },


    /**
    ### radians(value)
    */
    radians: function(value) {
        if (typeof value != 'undefined') {
            this.meters = value * M_PER_RAD;

            return this;
        }
        else {
            return this.meters / M_PER_RAD;
        } // if..else
    },

    /**
    ### toString()
    */
    toString: function() {
        if (this.meters > M_PER_KM) {
            return ((this.meters / 10 | 0) / 100) + 'km';
        } // if

        return this.meters + 'm';
    }
};

var DEFAULT_VECTORIZE_CHUNK_SIZE = 100,
    VECTORIZE_PER_CYCLE = 500,
    DEFAULT_GENERALIZATION_DISTANCE = 250;

/* exports */

/**
### generalize(sourceData, requiredPositions, minDist)
To be completed
*/
function generalize(sourceData, requiredPositions, minDist) {
    var sourceLen = sourceData.length,
        positions = [],
        lastPosition = null;


    minDist = (minDist || DEFAULT_GENERALIZATION_DISTANCE) / 1000;

    for (var ii = sourceLen; ii--; ) {
        if (ii === 0) {
            positions.unshift(sourceData[ii]);
        }
        else {
            var include = (! lastPosition) || sourceData[ii].inArray(requiredPositions),
                posDiff = include ? minDist : lastPosition.distanceTo(sourceData[ii]);

            if (sourceData[ii] && (posDiff >= minDist)) {
                positions.unshift(sourceData[ii]);

                lastPosition = sourceData[ii];
            } // if
        } // if..else
    } // for

    return positions;
} // generalize

/**
# GeoJS.Duration
A Timelord duration is what IMO is a sensible and usable representation of a
period of "human-time".  A duration value contains both days and seconds values.

## Methods
*/
function Duration(p1, p2) {
    if (typeof p1 == 'number') {
        this.days = p1 || 0;
        this.seconds = p2 || 0;
    }
    else if (typeof p1 != 'undefined') {
        this.days = p1.days || 0;
        this.seconds = p1.seconds || 0;
    } // if..else
} // Duration

Duration.prototype = {
    /**
    ### add(args*)
    The add method returns a new Duration object that is the value of the current
    duration plus the days and seconds value provided.
    */
    add: function() {
        var result = new Duration(this.days, this.seconds);

        for (var ii = arguments.length; ii--; ) {
            result.days += arguments[ii].days;
            result.seconds += arguments[ii].seconds;
        } // for

        return result;
    },

    /**
    ### toString()
    Convert the duration to it's string represenation

    __TODO__:
    - Improve the implementation
    - Add internationalization support
    */
    toString: function() {

        var days, hours, minutes, totalSeconds,
            output = '';

        if (this.days) {
            output = this.days + ' days ';
        } // if

        if (this.seconds) {
            totalSeconds = this.seconds;

            if (totalSeconds >= 3600) {
                hours = ~~(totalSeconds / 3600);
                totalSeconds = totalSeconds - (hours * 3600);
            } // if

            if (totalSeconds >= 60) {
                minutes = Math.round(totalSeconds / 60);
                totalSeconds = totalSeconds - (minutes * 60);
            } // if

            if (hours) {
                output = output + hours +
                    (hours > 1 ? ' hrs ' : ' hr ') +
                    (minutes ?
                        (minutes > 10 ?
                            minutes :
                            '0' + minutes) + ' min '
                        : '');
            }
            else if (minutes) {
                output = output + minutes + ' min';
            }
            else if (totalSeconds > 0) {
                output = output +
                    (totalSeconds > 10 ?
                        totalSeconds :
                        '0' + totalSeconds) + ' sec';
            } // if..else
        } // if

        return output;
    }
};

var parseDuration = (function() {
    var DAY_SECONDS = 86400;

    var periodRegex = /^P(\d+Y)?(\d+M)?(\d+D)?$/,
        timeRegex = /^(\d+H)?(\d+M)?(\d+S)?$/,
        durationParsers = {
            8601: parse8601Duration
        };

    /* internal functions */

    /*
    Used to convert a ISO8601 duration value (not W3C subset)
    (see http://en.wikipedia.org/wiki/ISO_8601#Durations) into a
    composite value in days and seconds
    */
    function parse8601Duration(input) {
        var durationParts = input.split('T'),
            periodMatches = null,
            timeMatches = null,
            days = 0,
            seconds = 0;

        periodRegex.lastIndex = -1;
        periodMatches = periodRegex.exec(durationParts[0]);

        days = days + (periodMatches[3] ? parseInt(periodMatches[3].slice(0, -1), 10) : 0);

        timeRegex.lastIndex = -1;
        timeMatches = timeRegex.exec(durationParts[1]);

        seconds = seconds + (timeMatches[1] ? parseInt(timeMatches[1].slice(0, -1), 10) * 3600 : 0);
        seconds = seconds + (timeMatches[2] ? parseInt(timeMatches[2].slice(0, -1), 10) * 60 : 0);
        seconds = seconds + (timeMatches[3] ? parseInt(timeMatches[3].slice(0, -1), 10) : 0);

        return new Duration(days, seconds);
    } // parse8601Duration

    return function(duration, format) {
        var parser = durationParsers[format];

        if (! parser) {
            throw 'No parser found for the duration format: ' + format;
        } // if

        return parser(duration);
    };
})();

    var GeoJS = this.GeoJS = {
        Pos: Pos,
        Line: Line,
        BBox: BBox,
        Distance: Distance,

        generalize: generalize,

        Duration: Duration,
        parseDuration: parseDuration,

        define: define,
        require: require
    };

    if (IS_COMMONJS) {
        module.exports = GeoJS;
    } // if
})();

(function() {
/*jslint white: true, safe: true, onevar: true, undef: true, nomen: true, eqeqeq: true, newcap: true, immed: true, strict: true */

function _extend() {
    var target = arguments[0] || {},
        sources = Array.prototype.slice.call(arguments, 1),
        length = sources.length,
        source,
        ii;

    for (ii = 0; ii < length; ii++) {
        if ((source = sources[ii]) !== null) {
            for (var name in source) {
                var copy = source[name];

                if (target === copy) {
                    continue;
                } // if

                if (copy !== undefined) {
                    target[name] = copy;
                } // if
            } // for
        } // if
    } // for

    return target;
} // _extend
function _log(msg, level) {
    if (typeof console !== 'undefined') {
        console[level || 'log'](msg);
    } // if
} // _log

function _logError(error) {
    if (typeof console !== 'undefined') {
        console.error(error);
        console.log(error.stack);
    } // if
} // _logError
var REGEX_FORMAT_HOLDERS = /\{(\d+)(?=\})/g;

function _formatter(format) {
    var matches = format.match(REGEX_FORMAT_HOLDERS),
        regexes = [],
        regexCount = 0,
        ii;

    for (ii = matches ? matches.length : 0; ii--; ) {
        var argIndex = matches[ii].slice(1);

        if (! regexes[argIndex]) {
            regexes[argIndex] = new RegExp('\\{' + argIndex + '\\}', 'g');
        } // if
    } // for

    regexCount = regexes.length;

    return function() {
        var output = format;

        for (ii = 0; ii < regexCount; ii++) {
            var argValue = arguments[ii];
            if (typeof argValue == 'undefined') {
                argValue = '';
            } // if

            output = output.replace(regexes[ii], argValue);
        } // for

        return output;
    };
} // _formatter

function _wordExists(string, word) {
    var words = string.split(/\s|\,/);
    for (var ii = words.length; ii--; ) {
        if (string.toLowerCase() == word.toLowerCase()) {
            return true;
        } // if
    } // for

    return false;
} // _wordExists
var _easing = (function() {
    var BACK_S = 1.70158,
        HALF_PI = Math.PI / 2,
        ANI_WAIT = 1000 / 60 | 0,

        abs = Math.abs,
        pow = Math.pow,
        sin = Math.sin,
        asin = Math.asin,
        cos = Math.cos,

        updatingTweens = false;

    /*
    Easing functions

    sourced from Robert Penner's excellent work:
    http://www.robertpenner.com/easing/

    Functions follow the function format of fn(t, b, c, d, s) where:
    - t = time
    - b = beginning position
    - c = change
    - d = duration
    */
    var easingFns = {
        linear: function(t, b, c, d) {
            return c*t/d + b;
        },

        /* back easing functions */

        backin: function(t, b, c, d) {
            return c*(t/=d)*t*((BACK_S+1)*t - BACK_S) + b;
        },

        backout: function(t, b, c, d) {
            return c*((t=t/d-1)*t*((BACK_S+1)*t + BACK_S) + 1) + b;
        },

        backinout: function(t, b, c, d) {
            return ((t/=d/2)<1) ? c/2*(t*t*(((BACK_S*=(1.525))+1)*t-BACK_S))+b : c/2*((t-=2)*t*(((BACK_S*=(1.525))+1)*t+BACK_S)+2)+b;
        },

        /* bounce easing functions */

        bouncein: function(t, b, c, d) {
            return c - easingFns.bounceout(d-t, 0, c, d) + b;
        },

        bounceout: function(t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
            }
        },

        bounceinout: function(t, b, c, d) {
            if (t < d/2) return easingFns.bouncein(t*2, 0, c, d) / 2 + b;
            else return easingFns.bounceout(t*2-d, 0, c, d) / 2 + c/2 + b;
        },

        /* cubic easing functions */

        cubicin: function(t, b, c, d) {
            return c*(t/=d)*t*t + b;
        },

        cubicout: function(t, b, c, d) {
            return c*((t=t/d-1)*t*t + 1) + b;
        },

        cubicinout: function(t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        },

        /* elastic easing functions */

        elasticin: function(t, b, c, d, a, p) {
            var s;

            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (!a || a < abs(c)) { a=c; s=p/4; }
            else s = p/TWO_PI * asin (c/a);
            return -(a*pow(2,10*(t-=1)) * sin( (t*d-s)*TWO_PI/p )) + b;
        },

        elasticout: function(t, b, c, d, a, p) {
            var s;

            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (!a || a < abs(c)) { a=c; s=p/4; }
            else s = p/TWO_PI * asin (c/a);
            return (a*pow(2,-10*t) * sin( (t*d-s)*TWO_PI/p ) + c + b);
        },

        elasticinout: function(t, b, c, d, a, p) {
            var s;

            if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
            if (!a || a < abs(c)) { a=c; s=p/4; }
            else s = p/TWO_PI * asin (c/a);
            if (t < 1) return -0.5*(a*pow(2,10*(t-=1)) * sin( (t*d-s)*TWO_PI/p )) + b;
            return a*pow(2,-10*(t-=1)) * sin( (t*d-s)*TWO_PI/p )*0.5 + c + b;
        },

        /* quad easing */

        quadin: function(t, b, c, d) {
            return c*(t/=d)*t + b;
        },

        quadout: function(t, b, c, d) {
            return -c *(t/=d)*(t-2) + b;
        },

        quadinout: function(t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },

        /* sine easing */

        sinein: function(t, b, c, d) {
            return -c * cos(t/d * HALF_PI) + c + b;
        },

        sineout: function(t, b, c, d) {
            return c * sin(t/d * HALF_PI) + b;
        },

        sineinout: function(t, b, c, d) {
            return -c/2 * (cos(Math.PI*t/d) - 1) + b;
        }
    };

    return function(typeName) {
        typeName = typeName.replace(/[\-\_\s\.]/g, '').toLowerCase();
        return easingFns[typeName] || easingFns.linear;
    };
})();
var _observable = (function() {
    var callbackCounter = 0;

    function getHandlers(target) {
        return target.hasOwnProperty('obsHandlers') ?
                target.obsHandlers :
                null;
    } // getHandlers

    function getHandlersForName(target, eventName) {
        var handlers = getHandlers(target);
        if (! handlers[eventName]) {
            handlers[eventName] = [];
        } // if

        return handlers[eventName];
    } // getHandlersForName

    return function(target) {
        if (! target) { return null; }

        /* initialization code */

        if (! getHandlers(target)) {
            target.obsHandlers = {};
        } // if

        var attached = target.hasOwnProperty('bind');
        if (! attached) {
            target.bind = function(eventName, callback) {
                var callbackId = "callback" + (callbackCounter++);
                getHandlersForName(target, eventName).unshift({
                    fn: callback,
                    id: callbackId
                });

                return callbackId;
            }; // bind

            target.triggerCustom = function(eventName, args) {
                var eventCallbacks = getHandlersForName(target, eventName),
                    evt = {
                        cancel: false,
                        name: eventName,
                        source: this
                    },
                    eventArgs;

                for (var key in args) {
                    evt[key] = args[key];
                } // for

                if (! eventCallbacks) {
                    return null;
                } // if

                eventCallbacks = eventCallbacks.concat(getHandlersForName(target, '*'));

                eventArgs = Array.prototype.slice.call(arguments, 2);

                if (target.eventInterceptor) {
                    target.eventInterceptor(eventName, evt, eventArgs);
                } // if

                eventArgs.unshift(evt);

                for (var ii = eventCallbacks.length; ii-- && (! evt.cancel); ) {
                    eventCallbacks[ii].fn.apply(this, eventArgs);
                } // for

                return evt;
            };

            target.trigger = function(eventName) {
                var eventArgs = Array.prototype.slice.call(arguments, 1);
                eventArgs.splice(0, 0, eventName, null);

                return target.triggerCustom.apply(this, eventArgs);
            }; // trigger

            target.unbind = function(eventName, callbackId) {
                if (typeof eventName === 'undefined') {
                    target.obsHandlers = {};
                }
                else {
                    var eventCallbacks = getHandlersForName(target, eventName);
                    for (var ii = 0; eventCallbacks && (ii < eventCallbacks.length); ii++) {
                        if (eventCallbacks[ii].id === callbackId) {
                            eventCallbacks.splice(ii, 1);
                            break;
                        } // if
                    } // for
                } // if..else

                return target;
            }; // unbind
        } // if

        return target;
    };
})();
var _configurable = (function() {

    function attach(target, settings, watchlist, key) {
        if (typeof target[key] == 'undefined') {
            target[key] = function(value) {
                if (typeof value != 'undefined') {
                    settings[key] = value;

                    if (watchlist[key]) {
                        watchlist[key](value);
                    } // if

                    return target;
                }
                else {
                    return settings[key];
                }
            };
        } // if
    } // attach

    return function(target, settings, watchlist) {
        settings = settings || target;

        for (var key in settings) {
            if (typeof settings[key] != 'function') {
                attach(target, settings, watchlist, key);
            } // if
        } // for

        return target;
    }; // _configurable
})();

var _indexOf = Array.indexOf || function(target) {
    for (var ii = 0; ii < this.length; ii++) {
        if (this[ii] === target) {
            return ii;
        } // if
    } // for

    return -1;
};
var _is = (function() {

    var has = 'hasOwnProperty',
        isnan = {'NaN': 1, 'Infinity': 1, '-Infinity': 1},
        proto = 'prototype',
        lowerCase = String[proto].toLowerCase,
        objectToString = Object[proto].toString;

    /*
    Dmitry Baranovskiy's wonderful is function, sourced from RaphaelJS:
    https://github.com/DmitryBaranovskiy/raphael
    */
    return function(o, type) {
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
})();
/**
Lightweight JSONP fetcher - www.nonobstrusive.com
The JSONP namespace provides a lightweight JSONP implementation.  This code
is implemented as-is from the code released on www.nonobtrusive.com, as per the
blog post listed below.  Only two changes were made. First, rename the json function
to get around jslint warnings. Second, remove the params functionality from that
function (not needed for my implementation).  Oh, and fixed some scoping with the jsonp
variable (didn't work with multiple calls).

http://www.nonobtrusive.com/2010/05/20/lightweight-jsonp-without-any-3rd-party-libraries/
*/
var _jsonp = (function(){
    var counter = 0, head, query, key;

    function load(url) {
        var script = document.createElement('script'),
            done = false;
        script.src = url;
        script.async = true;

        script.onload = script.onreadystatechange = function() {
            if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
                done = true;
                script.onload = script.onreadystatechange = null;
                if ( script && script.parentNode ) {
                    script.parentNode.removeChild( script );
                }
            }
        };
        if ( !head ) {
            head = document.getElementsByTagName('head')[0];
        }
        head.appendChild( script );
    } // load

    function clientReq(url, callback, callbackParam) {
        url += url.indexOf("?") >= 0 ? "&" : "?";

        var jsonp = "json" + (++counter);
        window[ jsonp ] = function(data){
            callback(data);
            window[ jsonp ] = null;
            try {
                delete window[ jsonp ];
            } catch (e) {}
        };

        load(url + (callbackParam ? callbackParam : "callback") + "=" + jsonp);
        return jsonp;
    } // clientRect

    function serverReq(url, callback, callbackParam) {
        var request = require('request'),
            requestURI = url + (url.indexOf("?") >= 0 ? "&" : "?") +
                (callbackParam ? callbackParam : 'callback') + '=cb';

        request({ uri: requestURI }, function(error, response, body) {
            if (! error) {
                var cleaned = body.replace(/^.*\(/, '').replace(/\).*$/, '');

                callback(JSON.parse(cleaned));
            }
            else {
                callback({
                    error: error
                });
            } // if..else
        });
    } // serverReq

    return typeof window != 'undefined' ? clientReq : serverReq;
}());
/**
# INTERACT
*/
INTERACT = (function() {
    var interactors = [];


var EventMonitor = function(target, handlers, params) {
    params = _extend({
        binder: null,
        unbinder: null,
        observable: null
    }, params);

    var MAXMOVE_TAP = 20, // pixels
        INERTIA_DURATION = 500, // ms
        INERTIA_MAXDIST = 300, // pixels
        INERTIA_TIMEOUT = 50, // ms
        INERTIA_IDLE_DISTANCE = 15; // pixels

    var observable = params.observable,
        handlerInstances = [],
        totalDeltaX,
        totalDeltaY;


    /* internals */

    function handlePointerMove(evt, absXY, relXY, deltaXY) {
        totalDeltaX += deltaXY.x || 0;
        totalDeltaY += deltaXY.y || 0;
    } // handlePanMove

    function handlePointerDown(evt, absXY, relXY) {
        totalDeltaX = 0;
        totalDeltaY = 0;
    } // handlePointerDown

    function handlePointerUp(evt, absXY, relXY) {
        var moveDelta = Math.max(Math.abs(totalDeltaX), Math.abs(totalDeltaY));

        if (moveDelta <= MAXMOVE_TAP) {
            observable.triggerCustom('tap', evt, absXY, relXY);
        } // if
    } // handlePointerUP

    /* exports */

    function bind() {
        return observable.bind.apply(null, arguments);
    } // bind

    function unbind() {
        observable.unbind();

        for (ii = 0; ii < handlerInstances.length; ii++) {
            handlerInstances[ii].unbind();
        } // for

        return self;
    } // unbind

    /* define the object */

    var self = {
        bind: bind,
        unbind: unbind
    };

    for (var ii = 0; ii < handlers.length; ii++) {
        handlerInstances.push(handlers[ii](target, observable, params));
    } // for

    observable.bind('pointerDown', handlePointerDown);
    observable.bind('pointerMove', handlePointerMove);
    observable.bind('pointerUp', handlePointerUp);

    return self;
};

    /* internal functions */

    function genBinder(target) {
        return function(evtName, callback) {
            target.addEventListener(evtName, callback, false);
        };
    } // bindDoc

    function genUnbinder(target) {
        return function(evtName, callback, customTarget) {
            target.removeEventListener(evtName, callback, false);
        };
    } // unbindDoc

    function genIEBinder(target) {
        return function(evtName, callback) {
            target.attachEvent('on' + evtName, callback);
        };
    } // genIEBinder

    function genIEUnbinder(target) {
        return function(evtName, callback) {
            target.detachEvent('on' + evtName, callback);
        };
    } // genIEUnbinder

    function getHandlers(types, capabilities) {
        var handlers = [];

        for (var ii = interactors.length; ii--; ) {
            var interactor = interactors[ii],
                selected = (! types) || (types.indexOf(interactor.type) >= 0),
                checksPass = true;

            for (var checkKey in interactor.checks) {
                var check = interactor.checks[checkKey];

                checksPass = checksPass && (check === capabilities[checkKey]);
            } // for

            if (selected && checksPass) {
                handlers[handlers.length] = interactor.handler;
            } // if
        } // for

        return handlers;
    } // getHandlers

    function point(x, y) {
        return {
            x: x ? x : 0,
            y: y ? y : 0,
            count: 1
        };
    } // point

    /* exports */

    function register(typeName, opts) {
        interactors.push(_extend({
            handler: null,
            checks: {},
            type: typeName
        }, opts));
    } // register

    /**
    ### watch(target, opts, caps)
    */
    function watch(target, opts, caps) {
        opts = _extend({
            bindTarget: null,
            observable: null,
            isIE: typeof window.attachEvent != 'undefined',
            types: null
        }, opts);

        capabilities = _extend({
            touch: 'ontouchstart' in window
        }, caps);

        if (! opts.observable) {
            opts.observable = _observable({});
            globalOpts = opts;
        } // if

        opts.binder = (opts.isIE ? genIEBinder : genBinder)(opts.bindTarget || document);
        opts.unbinder = (opts.isIE ? genIEBinder : genUnbinder)(opts.bindTarget || document);

        return new EventMonitor(target, getHandlers(opts.types, capabilities), opts);
    } // watch

/* common pointer (mouse, touch, etc) functions */

function getOffset(obj) {
    var calcLeft = 0,
        calcTop = 0;

    if (obj.offsetParent) {
        do {
            calcLeft += obj.offsetLeft;
            calcTop += obj.offsetTop;

            obj = obj.offsetParent;
        } while (obj);
    } // if

    return {
        left: calcLeft,
        top: calcTop
    };
} // getOffset

function genEventProps(source, evt) {
    return {
        source: source,
        target: evt.target ? evt.target : evt.srcElement
    };
} // genEventProps

function matchTarget(evt, targetElement) {
    var targ = evt.target ? evt.target : evt.srcElement,
        targClass = targ.className;

    while (targ && (targ !== targetElement)) {
        targ = targ.parentNode;
    } // while

    return targ && (targ === targetElement);
} // matchTarget

function pointerOffset(absPoint, offset) {
    return {
        x: absPoint.x - (offset ? offset.left : 0),
        y: absPoint.y - (offset ? offset.top : 0)
    };
} // triggerPositionEvent

function preventDefault(evt, immediate) {
    if (evt.preventDefault) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    else if (typeof evt.cancelBubble != 'undefined') {
        evt.cancelBubble = true;
    } // if..else

    if (immediate && evt.stopImmediatePropagation) {
        evt.stopImmediatePropagation();
    } // if
} // preventDefault
var MouseHandler = function(targetElement, observable, opts) {
    opts = _extend({
    }, opts);

    var WHEEL_DELTA_STEP = 120,
        WHEEL_DELTA_LEVEL = WHEEL_DELTA_STEP * 8;

    var ignoreButton = opts.isIE,
        isFlashCanvas = typeof FlashCanvas != 'undefined',
        buttonDown = false,
        start,
        currentX,
        currentY,
        lastX,
        lastY;

    /* internal functions */

    function getPagePos(evt) {
        if (evt.pageX && evt.pageY) {
            return point(evt.pageX, evt.pageY);
        }
        else {
            var doc = document.documentElement,
    			body = document.body;

            return point(
                evt.clientX +
                    (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                    (doc && doc.clientLeft || body && body.clientLeft || 0),
                evt.clientY +
                    (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                    (doc && doc.clientTop  || body && body.clientTop  || 0)
            );
        } // if
    } // getPagePos

    function handleDoubleClick(evt) {
        if (matchTarget(evt, targetElement)) {
            var clickXY = getPagePos(evt);

            observable.triggerCustom(
                'doubleTap',
                genEventProps('mouse', evt),
                clickXY,
                pointerOffset(clickXY, getOffset(targetElement))
            );
        } // if
    } // handleDoubleClick

    function handleMouseDown(evt) {
        if (matchTarget(evt, targetElement)) {
            buttonDown = isLeftButton(evt);

            if (buttonDown) {
                var pagePos = getPagePos(evt);

                targetElement.style.cursor = 'move';
                preventDefault(evt, true);

                lastX = pagePos.x;
                lastY = pagePos.y;
                start = point(lastX, lastY);

                observable.triggerCustom(
                    'pointerDown',
                    genEventProps('mouse', evt),
                    start,
                    pointerOffset(start, getOffset(targetElement))
                );
            }
        } // if
    } // mouseDown

    function handleMouseMove(evt) {
        var pagePos = getPagePos(evt);

        currentX = pagePos.x;
        currentY = pagePos.y;

        if (matchTarget(evt, targetElement)) {
            triggerCurrent(evt, buttonDown ? 'pointerMove' : 'pointerHover');
        } // if
    } // mouseMove

    function handleMouseUp(evt) {
        if (buttonDown && isLeftButton(evt)) {
            buttonDown = false;

            if (matchTarget(evt, targetElement)) {
                targetElement.style.cursor = 'default';
                triggerCurrent(evt, 'pointerUp');
            } // if
        } // if
    } // mouseUp

    function handleWheel(evt) {
        if (matchTarget(evt, targetElement)) {
            var deltaY;

            evt = evt || window.event;

            if (evt.detail) {
                if (typeof evt.axis == 'undefined' || evt.axis === 2) {
                    deltaY = -evt.detail * WHEEL_DELTA_STEP;
                } // if
            }
            else {
                deltaY = evt.wheelDeltaY ? evt.wheelDeltaY : evt.wheelDelta;
                if (window.opera) {
                    deltaY = -deltaY;
                } // if
            } // if..else

            if (deltaY) {
                var current = point(currentX, currentY);

                observable.triggerCustom(
                    'zoom',
                    genEventProps('mouse', evt),
                    current,
                    pointerOffset(current, getOffset(targetElement)),
                    deltaY / WHEEL_DELTA_LEVEL,
                    'wheel'
                );

                preventDefault(evt);
                evt.returnValue = false;
            } // if
        } // if
    } // handleWheel

    function isLeftButton(evt) {
        evt = evt || window.event;
        var button = evt.which || evt.button;
        return button == 1;
    } // leftPressed

    function preventDrag(evt) {
        return !matchTarget(evt, targetElement);
    } // preventDrag

    function triggerCurrent(evt, eventName, overrideX, overrideY, updateLast) {
        var evtX = typeof overrideX != 'undefined' ? overrideX : currentX,
            evtY = typeof overrideY != 'undefined' ? overrideY : currentY,
            deltaX = evtX - lastX,
            deltaY = evtY - lastY,
            current = point(evtX, evtY);

        observable.triggerCustom(
            eventName,
            genEventProps('mouse', evt),
            current,
            pointerOffset(current, getOffset(targetElement)),
            point(deltaX, deltaY)
        );

        if (typeof updateLast == 'undefined' || updateLast) {
            lastX = evtX;
            lastY = evtY;
        } // if
    } // triggerCurrent

    /* exports */

    function unbind() {
        opts.unbinder('mousedown', handleMouseDown);
        opts.unbinder('mousemove', handleMouseMove);
        opts.unbinder('mouseup', handleMouseUp);

        opts.unbinder("mousewheel", handleWheel);
        opts.unbinder("DOMMouseScroll", handleWheel);
    } // unbind

    opts.binder('mousedown', handleMouseDown);
    opts.binder('mousemove', handleMouseMove);
    opts.binder('mouseup', handleMouseUp);
    opts.binder('dblclick', handleDoubleClick);

    opts.binder('selectstart', preventDrag);
    opts.binder('dragstart', preventDrag);

    opts.binder('mousewheel', handleWheel);
    opts.binder('DOMMouseScroll', handleWheel);

    return {
        unbind: unbind
    };
}; // MouseHandler

register('pointer', {
    handler: MouseHandler,
    checks: {
        touch: false
    }
});
var TouchHandler = function(targetElement, observable, opts) {
    opts = _extend({
        detailed: false,
        inertia: false
    }, opts);

    var DEFAULT_INERTIA_MAX = 500,
        INERTIA_TIMEOUT_MOUSE = 100,
        INERTIA_TIMEOUT_TOUCH = 250,
        THRESHOLD_DOUBLETAP = 300,
        THRESHOLD_PINCHZOOM = 20,
        MIN_MOVEDIST = 7,
        EMPTY_TOUCH_DATA = {
            x: 0,
            y: 0
        };

    var TOUCH_MODE_UNKNOWN = 0,
        TOUCH_MODE_TAP = 1,
        TOUCH_MODE_MOVE = 2,
        TOUCH_MODE_PINCH = 3;

    var offset,
        touchMode,
        touchDown = false,
        touchesStart,
        touchesCurrent,
        startDistance,
        touchesLast,
        detailedEvents = opts.detailed,
        scaling = 1;

    /* internal functions */

    function calcChange(first, second) {
        var srcVector = (first && (first.count > 0)) ? first.touches[0] : null;
        if (srcVector && second && (second.count > 0)) {
            return calcDiff(srcVector, second.touches[0]);
        } // if

        return null;
    } // calcChange

    function calcTouchDistance(touchData) {
        if (touchData.count < 2) {
            return 0;
        } // if

        var xDist = touchData.x - touchData.next.x,
            yDist = touchData.y - touchData.next.y;

        return ~~Math.sqrt(xDist * xDist + yDist * yDist);
    } // touches

    function copyTouches(src, adjustX, adjustY) {
        adjustX = adjustX ? adjustX : 0;
        adjustY = adjustY ? adjustY : 0;

        var firstTouch = {
                x: src.x - adjustX,
                y: src.y - adjustY,
                id: src.id,
                count: src.count
            },
            touchData = firstTouch;

        while (src.next) {
            src = src.next;

            touchData = touchData.next = {
                x: src.x - adjustX,
                y: src.y - adjustY,
                id: src.id
            };
        } // while

        return firstTouch;
    } // copyTouches

    function getTouchCenter(touchData) {
        var x1 = touchData.x,
            x2 = touchData.next.x,
            y1 = touchData.y,
            y2 = touchData.next.y,
            minX = x1 < x2 ? x1 : x2,
            minY = y1 < y2 ? y1 : y2,
            width = Math.abs(x1 - x2),
            height = Math.abs(y1 - y2);

        return {
            x: minX + (width >> 1),
            y: minY + (height >> 1)
        };
    } // getTouchCenter

    function getTouchData(evt, evtProp) {
        var touches = evt[evtProp ? evtProp : 'touches'],
            firstTouch, touchData;

        if (touches.length === 0) {
            return null;
        } // if

        touchData = firstTouch = {
                x: touches[0].pageX,
                y: touches[0].pageY,
                id: touches[0].identifier,
                count: touches.length
        };

        for (var ii = 1, touchCount = touches.length; ii < touchCount; ii++) {
            touchData = touchData.next = {
                x: touches[ii].pageX,
                y: touches[ii].pageY,
                id: touches[ii].identifier
            };
        } // for

        return firstTouch;
    } // fillTouchData

    function handleTouchStart(evt) {
        if (matchTarget(evt, targetElement)) {
            offset = getOffset(targetElement);

            var changedTouches = getTouchData(evt, 'changedTouches'),
                relTouches = copyTouches(changedTouches, offset.left, offset.top);

            if (! touchesStart) {
                touchMode = TOUCH_MODE_TAP;

                observable.triggerCustom(
                    'pointerDown',
                    genEventProps('touch', evt),
                    changedTouches,
                    relTouches);
            } // if

            if (detailedEvents) {
                observable.triggerCustom(
                    'pointerDownMulti',
                    genEventProps('touch', evt),
                    changedTouches,
                    relTouches);
            } // if

            touchesStart = getTouchData(evt);

            if (touchesStart.count > 1) {
                startDistance = calcTouchDistance(touchesStart);
            } // if

            scaling = 1;

            touchesLast = copyTouches(touchesStart);
        } // if
    } // handleTouchStart

    function handleTouchMove(evt) {
        if (matchTarget(evt, targetElement)) {
            preventDefault(evt);

            touchesCurrent = getTouchData(evt);

            if (touchMode == TOUCH_MODE_TAP) {
                var cancelTap =
                        Math.abs(touchesStart.x - touchesCurrent.x) > MIN_MOVEDIST ||
                        Math.abs(touchesStart.y - touchesCurrent.y) > MIN_MOVEDIST;

                touchMode = cancelTap ? TOUCH_MODE_UNKNOWN : TOUCH_MODE_TAP;
            } // if

            if (touchMode != TOUCH_MODE_TAP) {
                touchMode = touchesCurrent.count > 1 ? TOUCH_MODE_PINCH : TOUCH_MODE_MOVE;

                if (touchMode == TOUCH_MODE_PINCH) {
                    if (touchesStart.count === 1) {
                        touchesStart = copyTouches(touchesCurrent);
                        startDistance = calcTouchDistance(touchesStart);
                    }
                    else {
                        var touchDistance = calcTouchDistance(touchesCurrent),
                            distanceDelta = Math.abs(startDistance - touchDistance);

                        if (distanceDelta < THRESHOLD_PINCHZOOM) {
                            touchMode = TOUCH_MODE_MOVE;
                        }
                        else {
                            var current = getTouchCenter(touchesCurrent),
                                currentScaling = touchDistance / startDistance,
                                scaleChange = currentScaling - scaling;

                            observable.triggerCustom(
                                'zoom',
                                genEventProps('touch', evt),
                                current,
                                pointerOffset(current, offset),
                                scaleChange,
                                'pinch'
                            );

                            scaling = currentScaling;
                        } // if..else
                    } // if..else
                } // if

                if (touchMode == TOUCH_MODE_MOVE) {
                    observable.triggerCustom(
                        'pointerMove',
                        genEventProps('touch', evt),
                        touchesCurrent,
                        copyTouches(touchesCurrent, offset.left, offset.top),
                        point(
                            touchesCurrent.x - touchesLast.x,
                            touchesCurrent.y - touchesLast.y)
                    );
                } // if

                if (detailedEvents) {
                    observable.triggerCustom(
                        'pointerMoveMulti',
                        genEventProps('touch', evt),
                        touchesCurrent,
                        copyTouches(touchesCurrent, offset.left, offset.top)
                    );
                } // if
            } // if

            touchesLast = copyTouches(touchesCurrent);
        } // if
    } // handleTouchMove

    function handleTouchEnd(evt) {
        if (matchTarget(evt, targetElement)) {
            var changedTouches = getTouchData(evt, 'changedTouches'),
                offsetTouches = copyTouches(changedTouches, offset.left, offset.top);

            touchesCurrent = getTouchData(evt);

            if (! touchesCurrent) {
                observable.triggerCustom(
                    'pointerUp',
                    genEventProps('touch', evt),
                    changedTouches,
                    offsetTouches
                );

                touchesStart = null;
            } // if

            if (detailedEvents) {
                observable.triggerCustom(
                    'pointerUpMulti',
                    genEventProps('touch', evt),
                    changedTouches,
                    offsetTouches
                );
            } // if..else
        } // if
    } // handleTouchEnd

    function initTouchData() {
        return {
            x: 0,
            y: 0,
            next: null
        };
    } // initTouchData

    /* exports */

    function unbind() {
        opts.unbinder('touchstart', handleTouchStart);
        opts.unbinder('touchmove', handleTouchMove);
        opts.unbinder('touchend', handleTouchEnd);
    } // unbind

    opts.binder('touchstart', handleTouchStart);
    opts.binder('touchmove', handleTouchMove);
    opts.binder('touchend', handleTouchEnd);

    return {
        unbind: unbind
    };
}; // TouchHandler

register('pointer', {
    handler: TouchHandler,
    checks: {
        touch: true
    }
});

    return {
        register: register,
        watch: watch
    };
})();

var T5 = this.T5 = _observable({});

var Registry = (function() {
    /* internals */

    var types = {};

    /* exports */

    function create(type, name) {
        if (types[type][name]) {
            return types[type][name].apply(null, Array.prototype.slice.call(arguments, 2));
        } // if

        throw NO_TYPE(type, name);
    } // create

    function get(type, name) {
        return types[type] ? types[type][name] : null;
    } // get

    function register(type, name, initFn) {
        if (! types[type]) {
            types[type] = {};
        } // if

        if (types[type][name]) {
            _log(WARN_REGOVERRIDE(type, name), 'warn');
        } // if

        types[type][name] = initFn;
    } // register

    return {
        create: create,
        get: get,
        register: register
    };
})();

var WARN_REGOVERRIDE = _formatter('Registration of {0}: {1} will override existing definition'),
    NO_TYPE = _formatter('Could not create {0} of type: {1}'),
    NO_DRAWABLE = _formatter('Could not create drawable of type: {0}');
/**
# T5
The T5 core module contains classes and functionality that support basic drawing
operations and math that are used in managing and drawing the graphical and tiling interfaces
that are provided in the Tile5 library.

## Module Functions
*/

/* exports */

function ticks() {
    return new Date().getTime();
} // getTicks

/* exports */

/**
### radsPerPixel(zoomLevel)
*/
function radsPerPixel(zoomLevel) {
    return TWO_PI / (256 << zoomLevel);
} // radsPerPixel


/* internal functions */

function findRadPhi(phi, t) {
    var eSinPhi = ECC * sin(phi);

    return HALF_PI - (2 * atan (t * pow((1 - eSinPhi) / (1 + eSinPhi), ECC / 2)));
} // findRadPhi

function mercatorUnproject(t) {
    return HALF_PI - 2 * atan(t);
} // mercatorUnproject

function toRad(value) {
    return value * DEGREES_TO_RADIANS;
} // toRad
var LAT_VARIABILITIES = [
    1.406245461070741,
    1.321415085624082,
    1.077179995861952,
    0.703119412486786,
    0.488332580888611
];

var TWO_PI = Math.PI * 2,
    HALF_PI = Math.PI / 2,
    PROP_WK_TRANSFORM = '-webkit-transform',
    VECTOR_SIMPLIFICATION = 3,
    DEGREES_TO_RADIANS = Math.PI / 180,
    RADIANS_TO_DEGREES = 180 / Math.PI,
    MAX_LAT = 90, //  85.0511 * DEGREES_TO_RADIANS, // TODO: validate this instead of using HALF_PI
    MIN_LAT = -MAX_LAT,
    MAX_LON = 180,
    MIN_LON = -MAX_LON,
    MAX_LAT_RAD = MAX_LAT * DEGREES_TO_RADIANS,
    MIN_LAT_RAD = -MAX_LAT_RAD,
    MAX_LON_RAD = MAX_LON * DEGREES_TO_RADIANS,
    MIN_LON_RAD = -MAX_LON_RAD,
    M_PER_KM = 1000,
    KM_PER_RAD = 6371,
    M_PER_RAD = KM_PER_RAD * M_PER_KM,
    ECC = 0.08181919084262157,
    PHI_EPSILON = 1E-7,
    PHI_MAXITER = 12,

    STYLE_RESET = 'reset';
var abs = Math.abs,
    ceil = Math.ceil,
    floor = Math.floor,
    round = Math.round,
    min = Math.min,
    max = Math.max,
    pow = Math.pow,
    sqrt = Math.sqrt,
    log = Math.log,
    sin = Math.sin,
    asin = Math.asin,
    cos = Math.cos,
    acos = Math.acos,
    tan = Math.tan,
    atan = Math.atan,
    atan2 = Math.atan2,

    isCommonJS = typeof module !== 'undefined' && module.exports,

    typeUndefined = 'undefined',
    typeString = 'string',
    typeNumber = 'number',

    typeDrawable = 'drawable',
    typeLayer = 'layer',

    reg = Registry.register,
    regCreate = Registry.create,
    regGet = Registry.get,

    drawableCounter = 0,
    layerCounter = 0,

    reDelimitedSplit = /[\,\s]+/;
/**
# T5.Animator
The animator centralizes the callbacks requiring regular update intervals in Tile5.
This simple utility module exposes `attach` and `detach` methods that allow other
classes in Tile5 to fire callbacks on a regular basis without needing to hook into
the likes of `setInterval` to run animation routines.

The animator will intelligently use `requestAnimationFrame` if available, and if not
will fall back to a `setInterval` call that will run optimized for 60fps.

## Methods
*/
var Animator = (function() {

    /* internals */

    var FRAME_RATE = 1000 / 60,
        TEST_PROPS = [
            'r',
            'webkitR',
            'mozR',
            'oR',
            'msR'
        ],
        callbacks = [],
        frameIndex = 0,
        useAnimFrame = DOM && (function() {
            for (var ii = 0; ii < TEST_PROPS.length; ii++) {
                window.animFrame = window.animFrame || window[TEST_PROPS[ii] + 'equestAnimationFrame'];
            } // for

            return animFrame;
        })();

    function frame(tickCount) {
        frameIndex++;

        tickCount = DOM ? (window.mozAnimationStartTime ||
            tickCount ||
            new Date().getTime()) : new Date().getTime();

        for (var ii = callbacks.length; ii--; ) {
            var cbData = callbacks[ii];

            if (frameIndex % cbData.every === 0) {
                cbData.cb(tickCount);
            } // if
        } // for

        if (useAnimFrame) {
            animFrame(frame);
        } // if
    } // frame

    /* exports */

    /**
    ### attach(callback, every)
    Attach `callback` to the animation callback loop.  If specified, `every`
    specified the regularity (in ms) with which this particular callback should be
    fired.  If not specified, the callback is fired for every animation frame (which
    is approximately 60 times per second).
    */
    function attach(callback, every) {
        callbacks[callbacks.length] = {
            cb: callback,
            every: every ? round(every / FRAME_RATE) : 1
        };
    } // attach

    /**
    ### detach(callback)
    Remove `callback` from the animation callback loop.
    */
    function detach(callback) {
        for (var ii = callbacks.length; ii--; ) {
            if (callbacks[ii].cb === callback) {
                callbacks.splice(ii, 1);
                break;
            } // if
        } // for
    } // detach

    useAnimFrame ? animFrame(frame) : setInterval(frame, 1000 / 60);

    return {
        attach: attach,
        detach: detach
    };
})();
var Parser = (function() {

    /* internals */
    var REGEX_XYRAW = /^xy\((.*)\).*$/i;

    /* exports */

    function parseXY(xyStr) {
        if (REGEX_XYRAW.test(xyStr)) {

        }
        else {
            var xyVals = xyStr.split(reDelimitedSplit);

            return _project(xyVals[1], xyVals[0]);
        } // if..else

        return undefined;
    } // parseXY

    return {
        parseXY: parseXY
    };
})();
/**
# T5.DOM
This is a minimal set of DOM utilities that Tile5 uses for the DOM manipulation that
is done in the library.

## Methods
*/
var DOM = typeof window != 'undefined' ? (function() {
    /* internals */

    var CORE_STYLES = {
            '-webkit-user-select': 'none',
            position: 'absolute'
        },
        css3dTransformProps = ['WebkitPerspective', 'MozPerspective'],
        testTransformProps = ['-webkit-transform', 'MozTransform'],
        testTransformOriginProps = ['-webkit-transform-origin', 'MozTransformOrigin'],
        transformProp,
        css3dTransformProp,
        transformOriginProp,
        testElemStyle;

    function checkCaps(testProps) {
        if (! testElemStyle) {
            testElemStyle = document.createElement('t5test').style;
        } // if

        for (var ii = 0; ii < testProps.length; ii++) {
            var propName = testProps[ii];
            if (typeof testElemStyle[propName] != 'undefined') {
                return propName;
            } // if
        } // for

        return undefined;
    } // checkCaps

    /* exports */

    /**
    ### create(elemType, className, cssProps)
    */
    function create(elemType, className, cssProps) {
        var elem = document.createElement(elemType),
            cssRules = [],
            props = cssProps || {};

        elem.className = className || '';

        for (var propId in props) {
            cssRules[cssRules.length] = propId + ': ' + props[propId];
        } // for

        elem.style.cssText = cssRules.join(';');

        return elem;
    } // create

    /**
    ### move(element, x, y, extraTransforms, origin)
    */
    function move(element, x, y, extraTransforms, origin) {
        if (css3dTransformProp || transformProp) {
            var translate = css3dTransformProp ?
                    'translate3d(' + x +'px, ' + y + 'px, 0)' :
                    'translate(' + x + 'px, ' + y + 'px)';

            element.style[transformProp] = translate + ' ' + (extraTransforms || []).join(' ');

            if (origin && transformOriginProp) {
                element.style[transformOriginProp] = origin.x + 'px ' + origin.y + 'px';
            } // if
        }
        else {
            element.style.left = x + 'px';
            element.style.top = y + 'px';
        } // if..else
    } // move

    /**
    ### rect(domObj)
    */
    function rect(domObj) {
        return new Rect(
            domObj.offsetLeft,
            domObj.offsetTop,
            domObj.offsetWidth,
            domObj.offsetHeight
        );
    } // rect

    /**
    ### styles(extraStyles)
    */
    function styles(extraStyles) {
        return _extend({}, CORE_STYLES, extraStyles);
    } // extraStyles

    /* initialization */

    transformProp = checkCaps(testTransformProps);
    css3DTransformProp = checkCaps(css3dTransformProps);
    transformOriginProp = checkCaps(testTransformOriginProps);

    return {
        transforms: _is(transformProp, typeString),

        create: create,
        move: move,
        rect: rect,
        styles: styles
    };
})() : null;
/**
# T5.Runner
*/
var Runner = (function() {

    /* internals */

    var TARGET_CYCLETIME = 20,
        DEFAULT_SLICESIZE = 50,
        processes = [];

    function runLoop() {
        var processCount = processes.length;

        for (var ii = processCount; ii--; ) {
            try {
                processes[ii](processCount);
            }
            catch (e) {
                _log(e.toString(), 'error');
            } // try..catch
        } // for
    } // runLoop

    /* exports */

    /**
    ### process(items, sliceCallback, completeCallback, syncParseThreshold)
    */
    function process(items, sliceCallback, completeCallback, syncParseThreshold) {
        var itemsPerCycle,
            itemIndex = 0;

        function processSlice(processesActive) {
            var currentSliceItems = (itemsPerCycle || DEFAULT_SLICESIZE) / processesActive;

            if (itemIndex < items.length) {
                var slice = items.slice(itemIndex, itemIndex + currentSliceItems),
                    sliceLen = slice.length,
                    startTicks = itemsPerCycle ? 0 : new Date().getTime();

                sliceCallback(slice, sliceLen);

                if (! itemsPerCycle) {
                    var elapsed = new Date().getTime() - startTicks,
                        itemProcessTime = elapsed / sliceLen;

                    itemsPerCycle = itemProcessTime ? (TARGET_CYCLETIME / itemProcessTime | 0) : items.length;
                } // if

                itemIndex += sliceLen;
            }
            else {
                for (var ii = processes.length; ii--; ) {
                    if (processes[ii] === processSlice) {
                        processes.splice(ii, 1);
                        break;
                    } // if
                } // for

                if (processes.length === 0) {
                    Animator.detach(runLoop);
                } // if

                if (completeCallback) {
                    completeCallback();
                } // if

            } // if..else
        } // processSlice

        if (DOM && items.length > (syncParseThreshold || 0)) {
            if (processes.push(processSlice) === 1) {
                Animator.attach(runLoop);
            } // if
        }
        else {
            sliceCallback(items, items.length);

            if (completeCallback) {
                completeCallback();
            } // if
        }

    } // process

    return {
        process: process
    };
})();

var _project = _project || function(lon, lat) {
    var radLat = parseFloat(lat) * DEGREES_TO_RADIANS,
        sinPhi = sin(radLat),
        eSinPhi = ECC * sinPhi,
        retVal = log(((1.0 + sinPhi) / (1.0 - sinPhi)) * pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ECC)) / 2.0;

    return new GeoXY(0, 0, parseFloat(lon) * DEGREES_TO_RADIANS, retVal);
}; // _project

var _unproject = _unproject || function(x, y) {
    var t = pow(Math.E, -y),
        prevPhi = mercatorUnproject(t),
        newPhi = findRadPhi(prevPhi, t),
        iterCount = 0;

    while (iterCount < PHI_MAXITER && abs(prevPhi - newPhi) > PHI_EPSILON) {
        prevPhi = newPhi;
        newPhi = findRadPhi(prevPhi, t);
        iterCount++;
    } // while

    return new GeoJS.Pos(newPhi * RADIANS_TO_DEGREES, (x % 360) * RADIANS_TO_DEGREES);
}; // _unproject
/**
# T5.XY
The internal XY class is currently created by making a call to `T5.XY.init` rather than `new T5.XY`.
This will seem strange, and it is strange, and is a result of migrating from a closure based pattern
to a prototypal pattern in areas of the Tile5 library.

## Methods
*/
function XY(p1, p2) {
    if (_is(p1, typeString)) {
        var xyVals = p1.split(reDelimitedSplit);

        this.x = parseFloat(xyVals[0]);
        this.y = parseFloat(xyVals[1]);
    }
    else if (p1 && p1.x) {
        this.x = p1.x;
        this.y = p1.y;
    }
    else {
        this.x = p1 || 0;
        this.y = p2 || 0;
    } // if..else
} // XY constructor

XY.prototype = {
    constructor: XY,

    /**
    ### add(xy*)
    Return a __new__ xy composite that is adds the current value of this xy value with the other xy
    values that have been passed to the function.  The actual value of this XY value remain unchanged.
    */
    add: function() {
        var sumX = this.x,
            sumY = this.y;

        for (var ii = arguments.length; ii--; ) {
            sumX += arguments[ii].x;
            sumY += arguments[ii].y;
        } // for

        return this.copy(sumX, sumY);
    }, // add

    /**
    ### copy(x, y)
    */
    copy: function(x, y) {
        var copy = _extend({}, this);

        copy.x = x || copy.x;
        copy.y = y || copy.y;

        return copy;
    },

    /**
    ### equals(xy)
    Return true if the two points are equal, false otherwise.  __NOTE:__ This function
    does not automatically floor the values so if the point values are floating point
    then floating point precision errors will likely occur.
    */
    equals: function(xy) {
        return this.x === xy.x && this.y === xy.y;
    },

    /**
    ### offset(x, y)
    Return a new T5.XY object which is offset from the current xy by the specified arguments.
    */
    offset: function(x, y) {
        return this.copy(this.x + x, this.y + y);
    },

    /**
    ### relative(view)
    This method is used to return xy coordinates that are relative to the view, rather
    than to the current view frame.
    */
    relative: function(view) {
        var viewport = view.viewport();

        return this.copy(
            this.x - viewport.x - viewport.padding.x,
            this.y - viewport.y - viewport.padding.y
        );
    },

    /**
    ### rotate(angle, around)
    This function is used to determine the xy position if the current xy element
    was rotated by `theta` around xy position `origin`.

    The code was written after dissecting [James Coglan's](http://jcoglan.com/) excellent
    library [Sylvester](http://sylvester.jcoglan.com/).
    */
    rotate: function(theta, origin) {
        origin = origin || new XY(0, 0);

        var x = this.x - origin.x,
            y = this.y - origin.y;

        return new XY(
            origin.x + cos(theta) * x + -sin(theta) * y,
            origin.y + sin(theta) * x +  cos(theta) * y
        );
    },

    /**
    ### scale(scaleFactor)
    */
    scale: function(scaleFactor, origin) {
        origin = origin || new XY(0, 0);

        var x = this.x - origin.x,
            y = this.y - origin.y;

        return new XY(
            origin.x + x * scaleFactor,
            origin.y + y * scaleFactor
        );
    },

    /**
    ### sync(view, reverse)
    */
    sync: function(view, reverse) {
        return this;
    },

    /**
    ### toString()
    */
    toString: function() {
        return this.x + ', ' + this.y;
    }
};
/**
# T5.Line

## Methods
*/
function Line(allowCull) {
    this.allowCull = allowCull;
    this.points = [];
};

Line.prototype = _extend(new Array(), {
    /**
    ### cull(viewport)
    */
    cull: function(viewport) {
        if (this.allowCull) {
            var minX = viewport.x,
                minY = viewport.y,
                maxX = viewport.x + viewport.w,
                maxY = viewport.y + viewport.h,
                firstIdx = Infinity,
                lastIdx = 0,
                points = this.points,
                inVP;

            for (var ii = points.length; ii--; ) {
                inVP = points[ii].x >= minX && points[ii].x <= maxX &&
                    points[ii].y >= minY && points[ii].y <= maxY;

                if (inVP) {
                    firstIdx = ii < firstIdx ? ii : firstIdx;
                    lastIdx = ii > lastIdx ? ii : lastIdx;
                } // if
            } // for

            return points.slice(max(firstIdx - 1, 0), min(lastIdx + 1, points.length));
        } // if

        return this.points;
    },

    /**
    ### simplify(generalization)
    */
    simplify: function(generalization) {
        generalization = generalization || VECTOR_SIMPLIFICATION;

        var tidied = new Line(this.allowCull),
            points = this.points,
            last = null;

        for (var ii = points.length; ii--; ) {
            var current = points[ii];

            include = !last || ii === 0 ||
                (abs(current.x - last.x) +
                    abs(current.y - last.y) >
                    generalization);

            if (include) {
                tidied.points.unshift(current);
                last = current;
            }
        } // for

        return tidied;
    }
});
/**
# T5.GeoXY

## Methods
*/
function GeoXY(p1, p2, mercX, mercY) {
    this.mercX = mercX;
    this.mercY = mercY;

    if (_is(p1, typeString)) {
        _extend(this, Parser.parseXY(p1));
    } // if
    else if (p1 && p1.toBounds) {
        _extend(this, _project(p1.lon, p1.lat));
    }
    else {
        XY.call(this, p1, p2);
    }
} // GeoXY

GeoXY.prototype = _extend(new XY(), {
    constructor: GeoXY,

    /**
    ### pos()
    */
    pos: function() {
        return _unproject(this.mercX, this.mercY);
    },

    /**
    ### sync(view, reverse)
    */
    sync: function(view, reverse) {
        var rpp = view.rpp || radsPerPixel(view.zoom());

        if (reverse) {
            this.mercX = this.x * rpp - Math.PI;
            this.mercY = Math.PI - this.y * rpp;
        }
        else {
            this.x = round(((this.mercX || 0) + Math.PI) / rpp);
            this.y = round((Math.PI - (this.mercY || 0)) / rpp);
        } // if

        return this;
    }
});
/**
# T5.Rect
*/
function Rect(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = width || 0;
    this.h = height || 0;

    this.x2 = this.x + this.w;
    this.y2 = this.y + this.h;
} // Rect

Rect.prototype = {
    constructor: Rect,

    /**
    ### buffer(amountX, amountY)
    */
    buffer: function(amountX, amountY) {
        return new Rect(
            this.x - amountX,
            this.y - (amountY || amountX),
            this.w + amountX * 2,
            this.h + (amountY || amountX) * 2
        );
    },

    /**
    ### center()
    */
    center: function() {
        return new XY(this.x + (this.w >> 1), this.y + (this.h >> 1));
    }
};

/**
# T5.Hits

Utility module for creating and managing hit tests and the hits that are
associated with that hit test.
*/
Hits = (function() {

    /* interials */

    /* exports */

    /**
    ### diffHits(oldHitData, newHitData)
    */
    function diffHits(oldHits, newHits) {
        var diff = [],
            objIds = {},
            ii;

        for (ii = newHits.length; ii--; ) {
            objIds[newHits[ii].target.id] = true;
        } // for

        for (ii = oldHits.length; ii--; ) {
            if (! objIds[oldHits[ii].target.id]) {
                diff[diff.length] = oldHits[ii];
            } // for
        } // for

        return diff;
    } // diff

    /**
    ### init
    */
    function init(hitType, absXY, relXY, scaledXY, transformedXY) {
        return {
            type: hitType,
            x: transformedXY.x,
            y: transformedXY.y,
            gridX: scaledXY.x | 0,
            gridY: scaledXY.y | 0,
            elements: [],

            absXY: absXY,
            relXY: relXY
        };
    } // init

    /**
    ### initHit(type, target, opts)
    */
    function initHit(type, target, drag) {
        return {
            type: type,
            target: target,
            drag: drag
        };
    } // initHit

    function match(hit, testType, testXY) {
        return testType === hit.type
            && testXY.x === hit.absXY.x
            && testXY.y === hit.absXY.y;
    } // match

    /**
    ### triggerEvent(hitData, target, evtSuffix, elements)
    */
    function triggerEvent(hitData, target, evtSuffix, elements) {
        target.triggerCustom(
            hitData.type + (evtSuffix ? evtSuffix : 'Hit'), {
                hitType: hitData.type
            },
            elements ? elements : hitData.elements,
            hitData.absXY,
            hitData.relXY,
            new GeoXY(hitData.gridX, hitData.gridY)
        );
    } // triggerEvent

    /* define the module */

    return {
        diffHits: diffHits,
        init: init,
        initHit: initHit,
        match: match,
        triggerEvent: triggerEvent
    };
})();
function createStoreForZoomLevel(zoomLevel, oldStorage) {
    var store = new SpatialStore(Math.sqrt(256 << zoomLevel) | 0);

    if (oldStorage && (oldStorage.zoomLevel === zoomLevel)) {
        oldStorage.copyInto(store);
    } // if

    store.zoomLevel = zoomLevel;

    return store;
}

var SpatialStore = function(cellsize) {
    cellsize = cellsize || 128;

    /* internals */

    var buckets = [],
        lookup = {},
        objectCounter = 0;

    /* internals */

    function getBucket(x, y) {
        var colBuckets = buckets[x],
            rowBucket;

        if (! colBuckets) {
            colBuckets = buckets[x] = [];
        } // if

        rowBucket = colBuckets[y];

        if (! rowBucket) {
            rowBucket = colBuckets[y] = [];
        } // if

        return rowBucket;
    } // getBuckets

    /* exports */

    /**
    ### all()
    */
    function all() {
        var items = [];

        for (var id in lookup) {
            items[items.length] = lookup[id];
        } // for

        return items;
    } // all

    /**
    ### clear()
    */
    function clear() {
        buckets = [];
        lookup = {};
    } // clear

    /**
    ### copyInto(target)
    This function is used to copy the items in the current store into the specified store.
    We use this primarily when we are creating a store with a new cellsize and need to copy
    the old items across.
    */
    function copyInto(target) {
        for (var itemId in lookup) {
            var itemData = lookup[itemId];

            target.insert(itemData.bounds || itemData, itemData, itemId);
        } // for
    } // copyInto

    function insert(rect, data, id) {
        var minX = rect.x / cellsize | 0,
            minY = rect.y / cellsize | 0,
            maxX = (rect.x + rect.w) / cellsize | 0,
            maxY = (rect.y + rect.h) / cellsize | 0;

        id = id || data.id || ('obj_' + objectCounter++);

        lookup[id] = data;

        for (var xx = minX; xx <= maxX; xx++) {
            for (var yy = minY; yy <= maxY; yy++) {
                getBucket(xx, yy).push(id);
            } // for
        } // for
    } // insert

    function remove(rect, data, id) {
        id = id || data.id;

        if (lookup[id]) {
            var minX = rect.x / cellsize | 0,
                minY = rect.y / cellsize | 0,
                maxX = (rect.x + rect.w) / cellsize | 0,
                maxY = (rect.y + rect.h) / cellsize | 0;

            delete lookup[id];

            for (var xx = minX; xx <= maxX; xx++) {
                for (var yy = minY; yy <= maxY; yy++) {
                    var bucket = getBucket(xx, yy),
                        itemIndex = _indexOf.call(bucket, id);

                    if (itemIndex >= 0) {
                        bucket.splice(itemIndex, 1);
                    } // if
                } // for
            } // for
        } // if
    } // remove

    function search(rect) {
        var minX = rect.x / cellsize | 0,
            minY = rect.y / cellsize | 0,
            maxX = (rect.x + rect.w) / cellsize | 0,
            maxY = (rect.y + rect.h) / cellsize | 0,
            ids = [],
            results = [];

        for (var xx = minX; xx <= maxX; xx++) {
            for (var yy = minY; yy <= maxY; yy++) {
                ids = ids.concat(getBucket(xx, yy));
            } // for
        } // for

        ids.sort();

        for (var ii = ids.length; ii--; ) {
            var currentId = ids[ii],
                target = lookup[currentId];

            if (target) {
                results[results.length] = target;
            } // if

            while (ii > 0 && ids[ii-1] == currentId) {
                ii--;
            }
        } // for

        return results;
    } // search

    return {
        all: all,
        clear: clear,
        copyInto: copyInto,
        insert: insert,
        remove: remove,
        search: search
    };
};

var getImage = (function() {
    var INTERVAL_LOADCHECK = 5000,
        INTERVAL_CACHECHECK = 10000,
        LOAD_TIMEOUT = 30000,
        imageCache = {},
        imageCount = 0,
        lastCacheCheck = new Date().getTime(),
        loadingData = {},
        loadingUrls = [];

    /* internals */

    function checkImageLoads(tickCount) {
        tickCount = tickCount || new Date().getTime();

        var ii = 0;
        while (ii < loadingUrls.length) {
            var url = loadingUrls[ii],
                imageData = loadingData[url],
                imageToCheck = loadingData[url].image,
                imageLoaded = isLoaded(imageToCheck),
                requestAge = tickCount - imageData.start,
                removeItem = imageLoaded || requestAge >= LOAD_TIMEOUT,
                callbacks;

            if (imageLoaded) {
                callbacks = imageData.callbacks;

                imageCache[url] = imageData.image;

                for (var cbIdx = 0; cbIdx < callbacks.length; cbIdx++) {
                    callbacks[cbIdx](imageData.image, true);
                } // for
            } // if

            if (removeItem) {
                loadingUrls.splice(ii, 1);
                delete loadingData[url];
            }
            else {
                ii++;
            } // if..else
        } // while
    } // imageLoadWorker

    function isLoaded(image) {
        return image && image.complete && image.width > 0;
    } // isLoaded

    function loadImage(url, callback) {
        var data = loadingData[url];

        if (data) {
            data.callbacks.push(callback);
        }
        else {
            var imageToLoad = new Image();

            imageToLoad.id = '_ldimg' + (++imageCount);

            loadingData[url] = {
                start: new Date().getTime(),
                image: imageToLoad,
                callbacks: [callback]
            };

            imageToLoad.src = url;

            loadingUrls[loadingUrls.length] = url;
        } // if..else
    } // loadImage

    Animator.attach(checkImageLoads, 250);

    /**
    # T5.getImage(url, callback)
    This function is used to load an image and fire a callback when the image
    is loaded.  The callback fires when the image is _really_ loaded (not
    when the onload event handler fires).
    */
    return function(url, callback) {
        var image = url && callback ? imageCache[url] : null;

        if (image && isLoaded(image)) {
            callback(image);
        }
        else {
            loadImage(url, callback);
        } // if..else
    };
})();
function Tile(x, y, url, width, height, id) {
    this.x = x;
    this.y = y;
    this.w = width || 256;
    this.h = width || 256;

    this.x2 = this.x + this.w;
    this.y2 = this.y + this.h;

    this.url = url;

    this.id = id || (x + '_' + y);

    this.loaded = false;
    this.image = null;
};

Tile.prototype = {
    constructor: Tile,

    load: function(callback) {
        var tile = this;

        getImage(this.url, function(image, loaded) {
            tile.loaded = true;
            tile.image = image;

            if (callback) {
                callback();
            } // if
        });
    }
};

/**
# T5.Renderer

## Events
Renderers fire the following events:

### detach

### predraw

### render

### reset

*/
var Renderer = function(view, container, outer, params) {

    /* internals */

    /* exports */

    var _this = {
        fastpan: true,

        /**
        ### applyStyle(style: T5.Style): string
        */
        applyStyle: function(style) {
        },

        /**
        ### applyTransform(drawable: T5.Drawable, offsetX: int, offsetY: int)
        */
        applyTransform: function(drawable, offsetX, offsetY) {
            return {
                restore: null,
                x: offsetX,
                y: offsetY
            };
        },

        /**
        ### getDimensions()
        */
        getDimensions: function() {
            return {
                width: 0,
                height: 0
            };
        },

        /**
        ### getViewport()
        */
        getViewport: function() {
        },

        /**
        ### hitTest(drawData, hitX, hitY): boolean
        */
        hitTest: function(drawData, hitX, hitY) {
            return false;
        },

        /**
        ### projectXY(srcX, srcY)
        This function is optionally implemented by a renderer to manually take
        care of projecting an x and y coordinate to the target drawing area.
        */
        projectXY: null,

        /**
        ### reset()
        */
        reset: function() {
        }
    };

    return _observable(_this);
};

/**
# attachRenderer(id, view, container, params)
*/
function attachRenderer(id, view, container, outer, params) {
    var ids = id.split('/'),
        renderer = new Renderer(view, container, outer, params);

    for (var ii = 0; ii < ids.length; ii++) {
        renderer = regCreate('renderer', ids[ii], view, container, outer, params, renderer);
    } // for

    return renderer;
};
/**
# RENDERER: canvas
*/
reg('renderer', 'canvas', function(view, panFrame, container, params, baseRenderer) {
    params = _extend({
    }, params);

    /* internals */

    var vpWidth,
        vpHeight,
        canvas,
        cr = new T5.Rect(),
        createdCanvas = false,
        context,
        drawOffsetX = 0,
        drawOffsetY = 0,
        paddingX = 0,
        paddingY = 0,
        scaleFactor = 1,
        styleFns = {},
        transform = null,
        previousStyles = {},

        drawNothing = function(drawData) {
        },

        defaultDrawFn = function(drawData) {
            if (this.fill) {
                 context.fill();
            } // if

            if (this.stroke) {
                context.stroke();
            } // if
        },

        styleParams = [
            'fill',
            'stroke',
            'lineWidth',
            'opacity'
        ],

        styleAppliers = [
            'fillStyle',
            'strokeStyle',
            'lineWidth',
            'globalAlpha'
        ];

    function checkBrokenPointInPath() {
        var c2dp = CanvasRenderingContext2D.prototype;

        function isPointInPath_mozilla(x, y) {
            this.save();
            this.setTransform( 1, 0, 0, 1, 0, 0 );
            var ret = this.isPointInPath_old( x, y );
            this.restore();
            return ret;
        }

        var ctx = document.createElement('canvas').getContext('2d');
        ctx.translate( 50, 0 );
        ctx.moveTo( 125, 50 );
        ctx.arc( 100, 50, 25, 0, 360, false );
        if (!ctx.isPointInPath( 150, 50 )) {
            c2dp.isPointInPath_old = c2dp.isPointInPath;
            c2dp.isPointInPath = isPointInPath_mozilla;
        } // if
    } // checkBrokenPointInPath

    function createCanvas() {
        if (panFrame) {
            vpWidth = panFrame.offsetWidth;
            vpHeight = panFrame.offsetHeight;

            canvas = DOM ? DOM.create('canvas', null, {
                position: 'absolute',
                'z-index': 1
            }) : new Canvas();

            canvas.width = vpWidth;
            canvas.height = vpHeight;

            view.attachFrame(canvas, true);

            context = null;
        } // if
    } // createCanvas

    function getPreviousStyle(canvasId) {
        if (! previousStyles[canvasId]) {
            previousStyles[canvasId] = [];
        } // if

        return previousStyles[canvasId].pop() || STYLE_RESET;
    } // getPreviousStyle

    function handleDetach() {
        if (canvas && canvas.parentNode) {
            panFrame.removeChild(canvas);
        } // if
    } // handleDetach

    function handlePredraw(evt, layers, viewport, tickcount, hits) {
        var ii;

        if (context) {
            context.restore();
        }
        else if (canvas) {
            context = canvas.getContext('2d');
        } // if..else

        drawOffsetX = viewport.x;
        drawOffsetY = viewport.y;
        paddingX = viewport.padding.x;
        paddingY = viewport.padding.y;
        scaleFactor = viewport.scaleFactor;

        if (context) {
            context.clearRect(cr.x, cr.y, cr.w, cr.h);
            cr = new T5.Rect();

            context.save();

            context.globalCompositeOperation = 'source-over';
        } // if
    } // handlePredraw

    function handleResize() {
    } // handleResize

    function handleStyleDefined(evt, styleId, styleData) {
        var ii, data;

        styleFns[styleId] = function(context) {
            for (ii = styleParams.length; ii--; ) {
                data = styleData[styleParams[ii]];
                if (data) {
                    context[styleAppliers[ii]] = data;
                } // if
            } // for
        };
    } // handleStyleDefined

    function initDrawData(viewport, hitData, drawFn) {
        return {
            draw: drawFn || defaultDrawFn,
            viewport: viewport,
            hit: hitData && context.isPointInPath(hitData.x, hitData.y),
            vpX: drawOffsetX,
            vpY: drawOffsetY,

            context: context
        };
    } // initDrawData

    function loadStyles() {
        Style.each(function(id, data) {
            handleStyleDefined(null, id, data);
        });

        T5.bind('styleDefined', handleStyleDefined);
    } // loadStyles

    function updateClearRect(x, y, w, h, full) {
        if (! cr.full) {
            if (x.bounds) {
                var drawable = x,
                    bounds = drawable.bounds,
                    xy = drawable.xy;

                w = (bounds.w * drawable.scaling * 1.2) | 0;
                h = (bounds.h * drawable.scaling * 1.2) | 0;
                x = xy.x - drawOffsetX - (w >> 1);
                y = xy.y - drawOffsetY - (h >> 1);
            } // if

            var x2 = x + w,
                y2 = y + h;

            cr.x = x < cr.x ? x : cr.x;
            cr.y = y < cr.y ? y : cr.y;
            cr.x2 = x2 > cr.x2 ? x2 : cr.x2;
            cr.y2 = y2 > cr.y2 ? y2 : cr.y2;
            cr.w = cr.x2 - cr.x;
            cr.h = cr.y2 - cr.y;
        } // if

        cr.full = cr.full || full;
    } // updateClearRect

    /* exports */

    function applyStyle(styleId) {
        var nextStyle = styleFns[styleId],
            canvasId = context && context.canvas ? context.canvas.id : 'default',
            previousStyle = getPreviousStyle(canvasId);

        if (nextStyle) {
            previousStyles[canvasId].push(styleId);

            nextStyle(context);

            return previousStyle;
        } // if
    } // applyStyle

    function applyTransform(drawable) {
        var translated = drawable.translateX !== 0 || drawable.translateY !== 0,
            transformed = translated || drawable.scaling !== 1 || drawable.rotation !== 0;

        if (transformed) {
            context.save();

            transform = {
                undo: function() {
                    context.restore();
                    transform = null;
                },

                x: drawable.xy.x,
                y: drawable.xy.y
            };

            context.translate(
                drawable.xy.x - drawOffsetX + drawable.translateX,
                drawable.xy.y - drawOffsetY + drawable.translateY
            );

            if (drawable.rotation !== 0) {
                context.rotate(drawable.rotation);
            } // if

            if (drawable.scaling !== 1) {
                context.scale(drawable.scaling, drawable.scaling);
            } // if
        } // if

        return transform;
    } // applyTransform

    function drawTiles(viewport, tiles, okToLoad) {
        var tile,
            minX = drawOffsetX - 256,
            minY = drawOffsetY - 256,
            maxX = viewport.x2,
            maxY = viewport.y2;

        updateClearRect(0, 0, viewport.w, viewport.h, true);

        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];

            if ((! tile.loaded) && okToLoad) {
                tile.load(view.invalidate);
            }
            else if (tile.image) {
                context.drawImage(
                    tile.image,
                    tile.x - drawOffsetX,
                    tile.y - drawOffsetY);
            } // if..else
        } // for
    } // drawTiles

    /**
    ### prepArc(drawable, viewport, hitData, opts)
    */
    function prepArc(drawable, viewport, hitData, opts) {
        context.beginPath();
        updateClearRect(drawable);

        context.arc(
            drawable.xy.x - (transform ? transform.x : drawOffsetX),
            drawable.xy.y - (transform ? transform.y : drawOffsetY),
            drawable.size >> 1,
            drawable.startAngle,
            drawable.endAngle,
            false
        );

        return initDrawData(viewport, hitData);
    } // prepArc

    /**
    ### prepImage(drawable, viewport, hitData, opts)
    */
    function prepImage(drawable, viewport, hitData, opts) {
        var realX = (opts.x || drawable.xy.x) - (transform ? transform.x : drawOffsetX),
            realY = (opts.y || drawable.xy.y) - (transform ? transform.y : drawOffsetY),
            image = opts.image || drawable.image;

        if (image) {
            context.beginPath();
            context.rect(
                realX,
                realY,
                opts.width || image.width,
                opts.height || image.height
            );

            return initDrawData(viewport, hitData, function(drawData) {
                context.drawImage(
                    image,
                    realX,
                    realY,
                    opts.width || image.width,
                    opts.height || image.height
                );
            });
        }
    } // prepImage

    /**
    ### prepMarker(drawable, viewport, hitData, opts)
    */
    function prepMarker(drawable, viewport, hitData, opts) {
        var markerX = drawable.xy.x - (transform ? transform.x : drawOffsetX),
            markerY = drawable.xy.y - (transform ? transform.y : drawOffsetY),
            size = drawable.size,
            drawX = markerX - (size >> 1),
            drawY = markerY - (size >> 1),
            drawOverride = undefined;

        context.beginPath();
        updateClearRect(drawable);

        switch (drawable.markerType.toLowerCase()) {
            case 'image':
                drawOverride = drawNothing;

                context.rect(drawX, drawY, size, size);

                if (drawable.reset && drawable.image) {
                    drawable.image = null;
                    drawable.reset = false;
                } // if

                if (drawable.image) {
                    context.drawImage(drawable.image, drawX, drawY, size, size);
                }
                else {
                    getImage(drawable.imageUrl, function(image) {
                        drawable.image = image;

                        context.drawImage(drawable.image, drawX, drawY, size, size);
                    });
                } // if..else

                break;

            default:
                context.moveTo(markerX, markerY);
                context.lineTo(markerX - (size >> 1), markerY - size);
                context.lineTo(markerX + (size >> 1), markerY - size);
                context.lineTo(markerX, markerY);
                break;
        } // switch

        return initDrawData(viewport, hitData, drawOverride);
    } // prepMarker

    /**
    ### prepPoly(drawable, viewport, hitData, opts)
    */
    function prepPoly(drawable, viewport, hitData, opts) {
        var first = true,
            points = opts.points || drawable.line().cull(viewport),
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY;

        context.beginPath();
        updateClearRect(drawable);

        for (var ii = points.length; ii--; ) {
            var x = points[ii].x - offsetX,
                y = points[ii].y - offsetY;

            if (first) {
                context.moveTo(x, y);
                first = false;
            }
            else {
                context.lineTo(x, y);
            } // if..else
        } // for

        return initDrawData(viewport, hitData);
    } // prepPoly

    /* initialization */

    if (DOM) {
        checkBrokenPointInPath();
    } // if

    createCanvas();

    var _this = _extend(baseRenderer, {
        applyStyle: applyStyle,
        applyTransform: applyTransform,

        drawTiles: drawTiles,

        prepArc: prepArc,
        prepImage: prepImage,
        prepMarker: prepMarker,
        prepPoly: prepPoly,

        getCanvas: function() {
            return canvas;
        },

        getContext: function() {
            return context;
        }
    });

    loadStyles();

    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);
    _this.bind('resize', handleResize);

    return _this;
});
/**
# RENDERER: dom
*/
reg('renderer', 'dom', function(view, panFrame, container, params, baseRenderer) {

    /* internals */

    var ID_PREFIX = 'tile_',
        PREFIX_LENGTH = ID_PREFIX.length,
        imageDiv = null,
        activeTiles = {},
        currentTiles = {};

    function createImageContainer() {
        imageDiv = DOM.create('div', 't5-tiles', DOM.styles({
            width: panFrame.offsetWidth + 'px',
            height: panFrame.offsetHeight + 'px'
        }));

        if (panFrame.childNodes.length > 0) {
            panFrame.insertBefore(imageDiv, panFrame.childNodes[0]);
        }
        else {
            panFrame.appendChild(imageDiv);
        } // if..else

        view.attachFrame(imageDiv);
    } // createImageContainer

    function createTileImage(tile) {
        var image = tile.image = new Image();

        activeTiles[tile.id] = tile;

        image.onload = function() {
            if (currentTiles[tile.id]) {
                imageDiv.appendChild(this);
            }
            else {
                tile.image = null;
            } // if..else
        };

        image.src = tile.url;

        image.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';

        return image;
    }

    function handleDetach() {
        panFrame.removeChild(imageDiv);
    } // handleDetach

    function handlePredraw(evt, layers, viewport, tickcount, hits) {
        removeOldObjects(activeTiles, currentTiles);
        currentTiles = {};
    } // handlePredraw

    function handleReset(evt) {
        removeOldObjects(activeTiles, currentTiles = {});

        while (imageDiv.childNodes.length > 0) {
            imageDiv.removeChild(imageDiv.childNodes[0]);
        } // while
    } // handleReset

    function removeOldObjects(activeObj, currentObj, flagField) {
        var deletedKeys = [];

        for (var objId in activeObj) {
            var item = activeObj[objId],
                inactive = flagField ? item[flagField] : (! currentObj[objId]);

            if (inactive) {
                if (item.image && item.image.parentNode) {
                    item.image.src = '';

                    imageDiv.removeChild(item.image);

                    item.image = null;
                } // if

                deletedKeys[deletedKeys.length] = objId;
            } // if
        } // for

        for (var ii = deletedKeys.length; ii--; ) {
            delete activeObj[deletedKeys[ii]];
        } // for
    } // removeOldObjects

    /* exports */

    function drawTiles(viewport, tiles, okToLoad) {
        var tile,
            image,
            offsetX = viewport.x,
            offsetY = viewport.y;

        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];

            if (tile.url) {
                image = tile.image || (okToLoad ? createTileImage(tile) : null);

                if (image) {
                    DOM.move(image, tile.x - offsetX, tile.y - offsetY);
                } // if

                currentTiles[tile.id] = tile;
            } // if
        } // for
    } // drawTiles

    /* initialization */

    createImageContainer();

    var _this = _extend(baseRenderer, {
        drawTiles: drawTiles
    });

    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);
    view.bind('reset', handleReset);

    return _this;
});

/**
# T5.Style

## Methods
*/
var Style = (function() {

    /* internals */

    var styles = {};

    /**
    ### define()

    The define method can be used in two ways.  Firstly, you can use the
    method to define a single new style:

    ```js
    var styleId = T5.Style.define('new-style', {
        fill: '#FF0000',
        opacity: 0.8
    });
    ```

    Additionally, instead of passing through a single style definition you
    can pass through multiple definitions in a single hit:

    ```js
    T5.Style.define({
        blueStyle: {
            fill: '#0000FF'
        },
        greenStyle: {
            fill: '#00FF00'
        }
    });
    */
    function define(p1, p2) {
        if (_is(p1, typeString)) {
            T5.trigger('styleDefined', p1, styles[p1] = p2);

            return p1;
        }
        else {
            var ids = [];

            for (var styleId in p1) {
                ids[ids.length] = define(styleId, p1[styleId]);
            } // for

            return ids;
        } // if..else
    } // define

    /**
    ### each(callback)
    */
    function each(callback) {
        for (var id in styles) {
            callback(id, styles[id]);
        } // for
    } // each

    /**
    ### get(id)
    */
    function get(id) {
        return styles[id];
    } // get

    define({
        reset: {
            fill: '#ffffff',
            opacity: 1.0
        },

        highlight: {
            fill: '#ff0000'
        },

        waypoints: {
            lineWidth: 4,
            stroke: '#003377',
            fill: '#ffffff'
        },

        waypointsHover: {
            lineWidth: 4,
            stroke: '#ff0000',
            fill: '#ffffff'
        }
    });

    return {
        resetStyle: STYLE_RESET,

        each: each,
        get: get,
        define: define
    };
})();
/**
# T5.View
*/
var View = function(container, params) {
    params = _extend({
        captureHover: true,
        controls: [],
        copyright: '',
        drawOnScale: true,
        padding: 128, // other values 'auto'
        inertia: true,
        refreshDistance: 128,
        noDrawOnTween: true,
        pannable: true,
        scalable: true,
        renderer: 'canvas',
        useTransforms: true
    }, params);

    var PANSPEED_THRESHOLD_REFRESH = 0,
        PANSPEED_THRESHOLD_FASTPAN = 2,
        PADDING_AUTO = 'auto',

        _allowTransforms = true,
        _frozen = false,
        controls = [],
        copyright = '',
        layers = [],
        layerCount = 0,
        viewpane = null,
        panContainer = null,
        outer,
        dragObject = null,
        mainContext = null,
        hitFlagged = false,
        fastpan,
        pointerDown = false,
        dx = 0, dy = 0,
        totalDX = 0,
        totalDY = 0,
        refreshDist = params.refreshDistance,
        noDrawOnTween = params.noDrawOnTween,
        offsetX = 0,
        offsetY = 0,
        panX = 0,
        panY = 0,
        refreshX = 0,
        refreshY = 0,
        offsetMaxX = null,
        offsetMaxY = null,
        offsetWrapX = false,
        offsetWrapY = false,
        offsetTween = null,
        padding,
        panFrames = [],
        hits = [],
        lastHitData = null,
        renderer,
        resizeCanvasTimeout = 0,
        txCenter = new XY(),
        rotation = 0,
        rotateTween = null,
        scaleFactor = 1,
        origScaleFactor,
        scaleTween = null,
        lastScaleFactor = 1,
        lastCycleTicks = 0,
        eventMonitor = null,
        frameData = {
            index: 0,
            draw: false
        },
        scaleEasing = {
            easing: 'sine.out',
            duration: 500
        },
        tweeningOffset = false, // TODO: find a better way to determine this than with a flag
        cycleDelay = 1000 / params.fps | 0,
        viewChanges = 0,
        width, height,
        halfWidth, halfHeight,
        halfOuterWidth, halfOuterHeight,
        viewTapTimeout,
        wheelZoomTimeout = 0;

    /* event handlers */

    /* scaling functions */

    function handleZoom(evt, absXY, relXY, scaleChange, source) {
        if (scaleTween) {
            scaleTween(true);
        } // if

        var scaleVal;

        if (_allowTransforms) {
            scaleVal = max(scaleFactor + pow(2, scaleChange) - 1, 0.125);
        }
        else {
            scaleVal = scaleChange > 0 ? 2 : 0.5;
        } // if..else

        scale(scaleVal, false, true); // , getProjectedXY(relXY.x, relXY.y));
    } // handleWheelZoom

    function getProjectedXY(srcX, srcY) {
        var projectedXY = renderer && renderer.projectXY ? renderer.projectXY(srcX, srcY) : null;

        if (! projectedXY) {
            var vp = viewport(),
                scaledX = vp ? (vp.x + (srcX + vp.padding.x) / scaleFactor) : srcX,
                scaledY = vp ? (vp.y + (srcY + vp.padding.y) / scaleFactor) : srcY;

            projectedXY = new _this.XY(scaledX, scaledY);
        } // if

        return projectedXY.sync(_this, true);
    } // getProjectedXY

    function handleDoubleTap(evt, absXY, relXY) {
        var projXY = getProjectedXY(relXY.x, relXY.y);

        clearTimeout(viewTapTimeout);

        _this.trigger('doubleTap', absXY, relXY, projXY);

        if (params.scalable) {
            var center = _this.center();

            offset(
                offsetX + projXY.x - center.x,
                offsetY + projXY.y - center.y,
                _allowTransforms ? scaleEasing : null
            );

            scale(2, scaleEasing, true);
        } // if
    } // handleDoubleTap

    function handlePointerDown(evt, absXY, relXY) {
        dragObject = null;
        pointerDown = true;

        initHitData('down', absXY, relXY);
    } // handlePointerDown

    function handlePointerHover(evt, absXY, relXY) {
        initHitData('hover', absXY, relXY);
    } // handlePointerHover

    function handlePointerMove(evt, absXY, relXY, deltaXY) {
        dragSelected(absXY, relXY, false);

        if (! dragObject) {
            dx += deltaXY.x;
            dy += deltaXY.y;
        } // if
    } // handlePointerMove

    function handlePointerUp(evt, absXY, relXY) {
        dragSelected(absXY, relXY, true);
        pointerDown = false;
    } // handlePointerUp

    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(function() {
            if (outer) {
                var changed = outer.offsetWidth !== halfOuterWidth * 2 ||
                    outer.offsetHeight !== halfOuterHeight * 2;

                if (changed) {
                    var oldCenter = center();

                    updateContainer(container);

                    center(oldCenter.x, oldCenter.y);
                } // if
            } // if
        }, 250);
    } // handleResize

    function handlePointerTap(evt, absXY, relXY) {
        initHitData('tap', absXY, relXY);

        viewTapTimeout = setTimeout(function() {
            _this.trigger('tap', absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));
        }, 20);
    } // handlePointerTap

    /* private functions */

    function captureInteractionEvents() {
        if (eventMonitor) {
            eventMonitor.unbind();
        } // if

        if (DOM && renderer) {
            eventMonitor = INTERACT.watch(renderer.interactTarget || outer);

            if (params.scalable) {
                eventMonitor.bind('zoom', handleZoom);
                eventMonitor.bind('doubleTap', handleDoubleTap);
            } // if

            eventMonitor.bind('pointerDown', handlePointerDown);
            eventMonitor.bind('pointerMove', handlePointerMove);
            eventMonitor.bind('pointerUp', handlePointerUp);

            if (params.captureHover) {
                eventMonitor.bind('pointerHover', handlePointerHover);
            } // if

            eventMonitor.bind('tap', handlePointerTap);
        } // if
    } // captureInteractionEvents

    function changeRenderer(value) {
        if (renderer) {
            renderer.trigger('detach');
            renderer = null;
        } // if

        renderer = attachRenderer(value, _this, viewpane, outer, params);

        fastpan = DOM && renderer.fastpan && DOM.transforms;
        _allowTransforms = DOM && DOM.transforms && params.useTransforms;

        captureInteractionEvents();

        _this.trigger('changeRenderer', renderer);
        _this.trigger('reset');

        refresh();
    } // changeRenderer

    /*
    The constrain offset function is used to keep the view offset within a specified
    offset using wrapping if allowed.  The function is much more 'if / then / elsey'
    than I would like, and might be optimized at some stage, but it does what it needs to
    */
    function constrainOffset(vp, allowWrap) {
        if (! vp) {
            return;
        } // if

        var testX = offsetWrapX ? offsetX + (vp.w >> 1) : offsetX,
            testY = offsetWrapY ? offsetY + (vp.h >> 1) : offsetY,
            viewWidth = vp.w,
            viewHeight = vp.h;

        if (offsetMaxX && offsetMaxX > viewWidth) {
            if (testX + viewWidth > offsetMaxX) {
                if (offsetWrapX) {
                    offsetX = allowWrap && (testX - offsetMaxX > 0) ? offsetX - offsetMaxX : offsetX;
                }
                else {
                    offsetX = offsetMaxX - viewWidth;
                } // if..else
            }
            else if (testX < 0) {
                offsetX = offsetWrapX ? (allowWrap ? offsetX + offsetMaxX : offsetX) : 0;
            } // if..else
        } // if

        if (offsetMaxY && offsetMaxY > viewHeight) {
            if (testY + viewHeight > offsetMaxY) {
                if (offsetWrapY) {
                    offsetY = allowWrap && (testY - offsetMaxY > 0) ? offsetY - offsetMaxY : offsetY;
                }
                else {
                    offsetY = offsetMaxY - viewHeight;
                } // if..else
            }
            else if (testY < 0) {
                offsetY = offsetWrapY ? (allowWrap ? offsetY + offsetMaxY : offsetY) : 0;
            } // if..else
        } // if
    } // constrainOffset

    function createControls(controlTypes) {
        var ii;

        for (ii = 0; ii < controls.length; ii++) {
            controls[ii].trigger('detach');
        } // for

        controls = [];

        for (ii = 0; ii < controlTypes.length; ii++) {
            controls[controls.length] = regCreate(
                'control',
                controlTypes[ii],
                _this,
                panContainer,
                outer,
                params[controlTypes[ii]]
            );
        } // for
    } // createControls

    function dragSelected(absXY, relXY, drop) {
        if (dragObject) {
            var scaledOffset = getProjectedXY(relXY.x, relXY.y),
                dragOk = dragObject.drag.call(
                    dragObject.target,
                    dragObject,
                    scaledOffset.x,
                    scaledOffset.y,
                    drop);

            if (dragOk) {
                viewChanges++;
            } // if

            if (drop) {
                dragObject = null;
            } // if
        }
    } // dragSelected

    function dragStart(hitElement, x, y) {
        var canDrag = hitElement && hitElement.drag &&
                ((! hitElement.canDrag) || hitElement.canDrag(hitElement, x, y));

        if (canDrag) {
            dragObject = hitElement;

            dragObject.startX = x;
            dragObject.startY = y;
        } // if

        return canDrag;
    } // dragStart

    function getLayerIndex(id) {
        for (var ii = layerCount; ii--; ) {
            if (layers[ii].id === id) {
                return ii;
            } // if
        } // for

        return layerCount;
    } // getLayerIndex

    function initContainer() {
        var outerRect = DOM.rect(outer);

        if (panContainer) {
            outer.removeChild(panContainer);
        } // if

        outer.appendChild(panContainer = DOM.create('div', 't5-panframe', DOM.styles({
            overflow: 'hidden',
            width: outerRect.w + 'px',
            height: outerRect.h + 'px'
        })));

        initPadding(params.padding);

        width = panContainer.offsetWidth + padding.x * 2;
        height = panContainer.offsetHeight + padding.y * 2;
        halfWidth = width / 2;
        halfHeight = height / 2;
        halfOuterWidth = outerRect.w / 2;
        halfOuterHeight = outerRect.h / 2;

        txCenter = new XY(halfWidth, halfHeight);

        panContainer.appendChild(viewpane = DOM.create('div', 't5-view', DOM.styles({
            width: width + 'px',
            height: height + 'px',
            'z-index': 2,
            margin: (-padding.y) + 'px 0 0 ' + (-padding.x) + 'px'
        })));
    } // initContainer

    function updateContainer(value) {
        if (DOM) {
            outer = document.getElementById(value);
            if (outer) {
                initContainer(outer);

                changeRenderer(params.renderer);

                createControls(params.controls);
            }
            else {
                throw new Error('Unable to find map container element with id: ' + value);
            } // if..else
        }
        else {
            changeRenderer('canvas');
        } // if..else
    } // updateContainer

    /* draw code */

    /*
    ### checkHits
    */
    function checkHits(hitSample) {
        var changed = true,
            elements = hitSample ? hitSample.elements : [],
            doubleHover = hitSample && lastHitData && hitSample.type === 'hover' &&
                lastHitData.type === 'hover',
            ii;

        if (doubleHover) {
            diffElements = Hits.diffHits(lastHitData.elements, elements);

            if (diffElements.length > 0) {
                Hits.triggerEvent(lastHitData, _this, 'Out', diffElements);
            }
            else {
                changed = false;
            }
        } // if

        if (elements.length > 0) {
            var downX = hitSample.gridX,
                downY = hitSample.gridY;

            for (ii = elements.length; pointerDown && ii--; ) {
                if (dragStart(elements[ii], downX, downY)) {
                    break;
                } // if
            } // for

            if (changed) {
                Hits.triggerEvent(hitSample, _this);

                if (hitSample.type === 'tap') {
                    clearTimeout(viewTapTimeout);
                } // if
            } // if
        } // if

        lastHitData = elements.length > 0 ? _extend({}, hitSample) : null;
    } // checkHits

    function cycle(tickCount) {
        var extraTransforms = [],
            panning,
            scaleChanged,
            rerender,
            viewpaneX,
            viewpaneY,
            vp;

        if (_frozen) {
            return;
        }

        _this.panSpeed = panSpeed = abs(dx) + abs(dy);

        scaleChanged = scaleFactor !== lastScaleFactor;
        if (scaleChanged) {
            _this.trigger('scale');
        } // if

        if (panSpeed > 0 || scaleChanged || offsetTween || scaleTween || rotateTween) {
            viewChanges++;

            if (offsetTween && panSpeed > 0) {
                offsetTween(true);
                offsetTween = null;
            } // if
        } // if

        if ((! pointerDown) && panSpeed <= PANSPEED_THRESHOLD_REFRESH &&
                (abs(offsetX - refreshX) >= refreshDist ||
                abs(offsetY - refreshY) >= refreshDist)) {
            refresh();
        } // if

        frameData.index++;
        frameData.draw = viewChanges || panSpeed || totalDX || totalDY;


        if (renderer && frameData.draw) {
            if (scaleTween) {
                scaleFactor = scaleTween()[0];
            } // if

            if (rotateTween) {
                rotation = rotateTween()[0];
            } // if

            panX += dx;
            panY += dy;

            if (dx || dy) {
                _this.trigger('pan');
            } // if

            if (_allowTransforms) {
                if (scaleFactor !== 1) {
                    extraTransforms[extraTransforms.length] = 'scale(' + scaleFactor + ')';
                } // if

                if (rotation !== 0) {
                    extraTransforms[extraTransforms.length] = 'rotate(' + rotation + 'deg)';
                } // if
            } // if

            rerender = hitFlagged || (! fastpan) || (
                (! pointerDown) &&
                (! (offsetTween && noDrawOnTween)) &&
                (! (scaleTween && noDrawOnTween)) &&
                (params.drawOnScale || scaleFactor === 1) &&
                panSpeed <= PANSPEED_THRESHOLD_FASTPAN
            );

            if (offsetTween) {
                var values = offsetTween(),
                    scaleFactorDiff = 1;

                if (origScaleFactor) {
                    scaleFactorDiff = scaleFactor / origScaleFactor;
                } // if

                panX = (offsetX - values[0] | 0) * scaleFactorDiff;
                panY = (offsetY - values[1] | 0) * scaleFactorDiff;
            } // if

            if (rerender) {
                var theta = -rotation * DEGREES_TO_RADIANS,
                    xChange = cos(theta) * panX + -sin(theta) * panY,
                    yChange = sin(theta) * panX +  cos(theta) * panY;

                offsetX = (offsetX - xChange / scaleFactor) | 0;
                offsetY = (offsetY - yChange / scaleFactor) | 0;

                vp = viewport();

                /*
                if (offsetMaxX || offsetMaxY) {
                    constrainOffset();
                } // if
                */


                renderer.trigger('predraw', layers, vp, tickCount, hits);

                viewChanges = 0;
                viewpaneX = panX = 0;
                viewpaneY = panY = 0;

                for (ii = layerCount; ii--; ) {
                    var drawLayer = layers[ii];

                    if (drawLayer.visible) {
                        var previousStyle = drawLayer.style ?
                                renderer.applyStyle(drawLayer.style, true) :
                                null;

                        drawLayer.draw(
                            renderer,
                            vp,
                            _this,
                            tickCount,
                            hits[0]);

                        if (previousStyle) {
                            renderer.applyStyle(previousStyle);
                        } // if
                    } // if
                } // for

                renderer.trigger('render', vp);

                _this.trigger('drawComplete', vp, tickCount);

                DOM.move(viewpane, viewpaneX, viewpaneY, extraTransforms, txCenter);
            }
            else {
                DOM.move(viewpane, panX, panY, extraTransforms, txCenter);
            } // if..else

            if (pointerDown || (! params.inertia)) {
                dx = 0;
                dy = 0;
            }
            else if (dx != 0 || dy != 0) {
                dx *= 0.8;
                dy *= 0.8;

                if (abs(dx) < 0.5) {
                    dx = 0;
                } // if

                if (abs(dy) < 0.5) {
                    dy = 0;
                } // if
            } // if..else

            if (hits.length) {
                for (ii = 0; ii < hits.length; ii++) {
                    checkHits(hits[ii]);
                } // for

                hits = [];
            } // if

            if (lastScaleFactor !== scaleFactor) {
                _this.trigger('scaleChanged', scaleFactor);
                lastScaleFactor = scaleFactor;
            };
        } // if
    } // cycle

    function initHitData(hitType, absXY, relXY) {
        var hitSample,
            txXY = new XY(
                relXY.x - halfOuterWidth + halfWidth,
                relXY.y - halfOuterHeight + halfHeight
            )
            .rotate(-rotation * DEGREES_TO_RADIANS, txCenter)
            .scale(1/scaleFactor, txCenter);

        if (hits.length === 0 || (! Hits.match(hits[hits.length - 1], hitType, absXY))) {
            hits[hits.length] = hitSample = Hits.init(
                hitType,
                absXY,
                relXY,
                getProjectedXY(relXY.x, relXY.y, true),
                txXY
            );

            hitFlagged = false;

            for (var ii = layerCount; ii--; ) {
                if (layers[ii].visible) {
                    hitFlagged = hitFlagged || (layers[ii].hitGuess ?
                        layers[ii].hitGuess(hitSample.gridX, hitSample.gridY, _this) :
                        false);
                } // if
            } // for

            if (hitFlagged) {
                viewChanges++;
            } // if
        } // if
    } // initHitData

    function initPadding(input) {
        if (input === PADDING_AUTO) {
            var oWidth = outer.offsetWidth,
                oHeight = outer.offsetHeight,
                diagonal = sqrt(oWidth * oWidth + oHeight * oHeight);

            padding = new XY((diagonal - oWidth) >> 1, (diagonal - oHeight) >> 1);
        }
        else {
            padding = new XY(input, input);
        } // if..else
    } // initPadding

    /* exports */

    function addCopy(text) {
        copyright = copyright ? copyright + ' ' + text : text;
        _this.trigger('copyright', copyright);
    } // addCopy

    /**
    ### attachFrame(element)
    The attachFrame method is used to attach a dom element that will be panned around along with
    the view.
    */
    function attachFrame(element, append) {

        panFrames[panFrames.length] = element;

        if (append) {
            viewpane.appendChild(element);
        } // if
    } // attachFrame

    function center(p1, p2, tween) {
        if (typeof p1 != 'undefined' && (_is(p1, typeString) || _is(p1, 'object'))) {
            var centerXY = new _this.XY(p1);

            centerXY.sync(_this);

            p1 = centerXY.x;
            p2 = centerXY.y;
        } // if

        if (_is(p1, typeNumber)) {
            offset(p1 - halfOuterWidth - padding.x, p2 - halfOuterHeight - padding.y, tween);

            return _this;
        }
        else {
            return offset().offset(
                halfOuterWidth + padding.x | 0,
                halfOuterHeight + padding.y | 0
            ).sync(_this, true);
        } // if..else
    } // center

    /**
    ### detach
    If you plan on reusing a single canvas element to display different views then you
    will definitely want to call the detach method between usages.
    */
    function detach() {
        Animator.detach(cycle);

        if (renderer) {
            renderer.trigger('detach');
        } // if

        if (eventMonitor) {
            eventMonitor.unbind();
        } // if

        if (panContainer) {
            outer.removeChild(panContainer);

            panContainer = null;
            viewpane = null;
        } // if

        panFrames = [];
    } // detach

    /**
    ### frozen(value)
    */
    function frozen(value) {
        if (! _is(value, typeUndefined)) {
            _frozen = value;
            return _this;
        }
        else {
            return _frozen;
        } // if..else
    } // frozen

    function getCopy() {
        return copyright;
    } // getCopy

    function getRenderer() {
        return renderer;
    } // getRenderer

    /**
    ### invalidate()
    */
    function invalidate() {
        viewChanges++;
    }

    /**
    ### setMaxOffset(maxX: int, maxY: int, wrapX: bool, wrapY: bool)
    Set the bounds of the display to the specified area, if wrapX or wrapY parameters
    are set, then the bounds will be wrapped automatically.
    */
    function setMaxOffset(maxX, maxY, wrapX, wrapY) {
        offsetMaxX = maxX;
        offsetMaxY = maxY;

        offsetWrapX = wrapX;
        offsetWrapY = wrapY;
    } // setMaxOffset

    /**
    ### viewport()
    Return a T5.XYRect (annotated with scale factor and padding) for the
    current offset rect of the view
    */
    function viewport() {
        var vp = new Rect(offsetX, offsetY, width, height);

        vp.scaleFactor = scaleFactor;

        vp.padding = padding ? padding.copy() : new XY();

        return vp;
    } // viewport

    /**
    ### layer()

    The `layer` method of a view is a very poweful function and can be
    used in a number of ways:

    __To retrieve an existing layer:__
    When called with a single string argument, the method will aim to
    return the layer that has that id:

    ```
    var layer = view.layer('markers');
    ```

    __To create a layer:__
    Supply three arguments to the method and a new layer will be created
    of the specified type and using the settings passed through in the 3rd
    argument:

    ```
    var layer = view.layer('markers', 'draw', { ... });
    ```

    __To retrieve all view layers:__
    Omit all arguments, and the method will return all the layers in the view:

    ```
    var layers = view.layer();
    ```
    */
    function layer(id, layerType, settings) {
        var haveId = typeof id != 'undefined';

        if (haveId && _is(layerType, typeUndefined)) {
            for (var ii = 0; ii < layerCount; ii++) {
                if (layers[ii].id === id) {
                    return layers[ii];
                } // if
            } // for

            return undefined;
        }
        else if (haveId) {
            var layer = regCreate('layer', layerType, _this, panContainer, outer, settings),
                layerIndex = getLayerIndex(id);

            if (layerIndex !== layerCount) {
                removeLayer(layers[layerIndex]);
            } // if

            layer.added = ticks();
            layer.id = id;
            layers[layerIndex] = layer;

            layers.sort(function(itemA, itemB) {
                return itemB.zindex - itemA.zindex || itemB.added - itemA.added;
            });

            layerCount = layers.length;

            _this.trigger('resync');
            refresh();

            _this.trigger('layerChange', _this, layer);

            viewChanges++;

            return layer;
        }
        else {
            return [].concat(layers);
        } // if..else
    } // layer

    /**
    ### pan(x, y, tween)
    */
    function pan(x, y, tween) {
        return offset(offsetX + x, offsetY + y, tween);
    } // pan

    /**
    ### refresh()
    Manually trigger a refresh on the view.  Child view layers will likely be listening for `refresh`
    events and will do some of their recalculations when this is called.
    */
    function refresh() {
        var vp = viewport();
        if (vp) {
            if (offsetMaxX || offsetMaxY) {
                constrainOffset(vp);
            } // if

            refreshX = offsetX;
            refreshY = offsetY;

            _this.trigger('refresh', _this, vp);

            viewChanges++;
        } // if
    } // refresh

    /**
    ### removeLayer()
    */
    function removeLayer(layer) {
        if (_is(layer, typeString)) {
            layer = layer(layer);
        } // if

        if (layer) {
            _this.trigger('beforeRemoveLayer', layer);

            var layerIndex = _indexOf(layers, layer.id);
            if ((layerIndex >= 0) && (layerIndex < layerCount)) {
                layers.splice(layerIndex, 1);
                viewChanges++;
            } // if

            layerCount = layers.length;

            layer.trigger('removed');
        } // if
    } // removeLayer

    /**
    ### rotate(value, tween, isAbsolute)
    */
    function rotate(value, tween, isAbsolute) {
        if (_is(value, typeNumber)) {
            var targetVal = isAbsolute ? value : rotation + value;

            if (tween) {
                rotateTween = Tweener.tween([rotation], [targetVal], tween, function() {
                    rotation = targetVal % 360;
                    rotateTween = null;
                    viewChanges++;
                });
            }
            else {
                rotation = targetVal % 360;
                viewChanges++;
            } // if..else

            return _this;
        }
        else {
            return rotation;
        } // if..else
    } // rotate

    /**
    ### scale(value, tween, isAbsolute)
    */
    function scale(value, tween, isAbsolute) {
        if (_is(value, typeNumber)) {
            var scaleFactorExp,
                targetVal = isAbsolute ? value : scaleFactor * value;

            if (! _allowTransforms) {
                tween = undefined;
                scaleFactorExp = round(log(targetVal) / Math.LN2);

                targetVal = pow(2, scaleFactorExp);
            } // if

            if (tween) {
                origScaleFactor = scaleFactor;

                scaleTween = Tweener.tween([scaleFactor], [targetVal], tween, function() {
                    scaleFactor = targetVal;
                    scaleTween = null;
                    origScaleFactor = null;
                    viewChanges++;
                });
            }
            else {
                scaleFactor = targetVal;
                viewChanges++;
            }

            return _this;
        } // if
        else {
            return scaleFactor;
        }
    } // scale

    /**
    ### offset(x: int, y: int, tween: TweenOpts)

    This function allows you to specified the absolute x and y offset that should
    become the top-left corner of the view.  As per the `pan` function documentation, tween and
    callback arguments can be supplied to animate the transition.
    */
    function offset(x, y, tween) {
        if (_is(x, typeNumber)) {
            if (tween) {
                offsetTween = Tweener.tween(
                    [offsetX, offsetY],
                    [x, y],
                    tween,
                    function() {
                        offsetX = x | 0;
                        offsetY = y | 0;
                        panX = panY = 0;

                        offsetTween = null;
                        viewChanges++;
                    }
                );
            }
            else {
                offsetX = x | 0;
                offsetY = y | 0;

                viewChanges++;
            } // if..else

            return _this;
        }
        else {
            return new _this.XY(offsetX, offsetY).sync(_this, true);
        } // if..else
    } // offset

    /* object definition */

    var _this = {
        XY: XY,

        id: params.id,
        panSpeed: 0,

        addCopy: addCopy,
        attachFrame: attachFrame,
        center: center,
        detach: detach,
        frozen: frozen,
        getCopy: getCopy,
        getRenderer: getRenderer,
        layer: layer,
        invalidate: invalidate,
        pan: pan,
        refresh: refresh,
        removeLayer: removeLayer,
        rotate: rotate,
        scale: scale,

        /* offset methods */

        setMaxOffset: setMaxOffset,
        offset: offset,
        viewport: viewport
    };

    _observable(_this);

    _this.bind('resize', handleResize);

    _configurable(_this, params, {
        container: updateContainer,
        captureHover: captureInteractionEvents,
        scalable: captureInteractionEvents,
        pannable: captureInteractionEvents,
        renderer: changeRenderer
    });

    layer('markers', 'draw', { zindex: 20 });

    updateContainer(container);

    if (DOM && (! _is(window.attachEvent, typeUndefined))) {
        window.attachEvent('onresize', handleResize);
    }
    else if (DOM) {
        window.addEventListener('resize', handleResize, false);
    } // if

    if (params.copyright) {
        addCopy(params.copyright);
    } // if

    Animator.attach(cycle);

    return _this;
};
/**
# T5.Map
*/
var Map = function(container, params) {
    params = _extend({
        controls: ['zoombar', 'copyright'],

        minZoom: 1,
        maxZoom: 18,
        renderer: 'canvas/dom',
        zoom: 1,

        zoombar: {}
    }, params);

    /* internals */

    var lastBoundsChangeOffset = new GeoXY(),
        rpp,
        zoomLevel = params.zoom || params.zoomLevel,
        residualScaleFactor = 0,
        zoomTimeout = 0;

    function checkScaling(evt, scaleFactor) {
        var scaleFactorExp = log(scaleFactor) / Math.LN2 | 0;

        if (scaleFactorExp !== 0) {
            residualScaleFactor = scaleFactor - pow(2, scaleFactorExp);

            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(function() {
                zoom(zoomLevel + scaleFactorExp);
            }, 500);
        } // ifg
    } // checkScaling

    function handleRefresh(evt) {
        var viewport = _self.viewport();

        if (lastBoundsChangeOffset.x != viewport.x || lastBoundsChangeOffset.y != viewport.y) {
            _self.trigger('boundsChange', bounds());

            lastBoundsChangeOffset.x = viewport.x;
            lastBoundsChangeOffset.y = viewport.y;
        } // if
    } // handleRefresh

    /* exports */

    /**
    ### bounds(newBounds)
    */
    function bounds(newBounds, maxZoomLevel) {
        var viewport = _self.viewport();

        if (newBounds) {
            var zoomLevel = max(newBounds.bestZoomLevel(viewport.w, viewport.h) - 1, maxZoomLevel || 0);

            return zoom(zoomLevel).center(newBounds.center());
        }
        else {
            return new GeoJS.BBox(
                new GeoXY(viewport.x, viewport.y2).sync(_self, true).pos(),
                new GeoXY(viewport.x2, viewport.y).sync(_self, true).pos()
            );
        } // if..else
    } // bounds

    /**
    ### zoom(int): int
    Either update or simply return the current zoomlevel.
    */
    function zoom(value, zoomX, zoomY) {
        if (_is(value, typeNumber)) {
            value = max(params.minZoom, min(params.maxZoom, value | 0));
            if (value !== zoomLevel) {
                var viewport = _self.viewport(),
                    offset = _self.offset(),
                    halfWidth = viewport.w / 2,
                    halfHeight = viewport.h / 2,
                    scaling = pow(2, value - zoomLevel),
                    scaledHalfWidth = halfWidth / scaling | 0,
                    scaledHalfHeight = halfHeight / scaling | 0;

                zoomLevel = value;

                _self.offset(
                    ((zoomX || offset.x + halfWidth) - scaledHalfWidth) * scaling,
                    ((zoomY || offset.y + halfHeight) - scaledHalfHeight) * scaling
                );

                _self.trigger('zoom', value);
                _self.trigger('reset');

                rpp = _self.rpp = radsPerPixel(zoomLevel);

                _self.setMaxOffset(TWO_PI / rpp | 0, TWO_PI / rpp | 0, true, false);

                _self.scale(1 + residualScaleFactor, false, true);
                residualScaleFactor = 0;

                _self.trigger('resync');

                _self.refresh();
            } // if

            return _self;
        }
        else {
            return zoomLevel;
        } // if..else
    } // zoom

    var _self = _extend(new View(container, params), {
        XY: GeoXY,

        bounds: bounds,
        zoom: zoom
    });

    rpp = _self.rpp = radsPerPixel(zoomLevel);

    _self.bind('refresh', handleRefresh);
    _self.bind('scaleChanged', checkScaling);

    return _self;
};
var Tweener = (function() {

    /* internals */

    /* exports */

    function tween(valuesStart, valuesEnd, params, callback, viewToInvalidate) {
        params = _extend({
            easing: 'sine.out',
            duration: 1000,
            complete: null
        }, params);

        var valueCount = valuesStart.length,
            valuesCurrent = [].concat(valuesStart),
            callbacks = [callback, params.complete],
            easingFn = _easing(params.easing),
            valuesChange = [],
            finishedCount = 0,
            cancelTween = false,
            duration = params.duration,
            ii,
            startTicks = new Date().getTime();

        function tweenStep(tickCount) {
            var elapsed = tickCount - startTicks,
                complete = startTicks + duration <= tickCount,
                retVal;

            for (var ii = valueCount; ii--; ) {
                valuesCurrent[ii] = easingFn(
                    elapsed,
                    valuesStart[ii],
                    valuesChange[ii],
                    duration);
            } // for

            if (viewToInvalidate) {
                viewToInvalidate.invalidate();
            } // if

            if (complete || cancelTween) {
                 Animator.detach(tweenStep);

                 for (ii = 0; ii < callbacks.length; ii++) {
                     if (callbacks[ii]) {
                         callbacks[ii](valuesCurrent, elapsed, cancelTween);
                     } // if
                 } // // for
            } // if
        } // function

        for (ii = valueCount; ii--; ) {
            valuesChange[ii] = valuesEnd[ii] - valuesStart[ii];
        } // for

        Animator.attach(tweenStep);

        return function(cancel) {
            cancelTween = cancel;
            return valuesCurrent;
        }; // function
    } // tween

    function tweenDrawable(drawable, prop, startVal, endVal, tween) {
        var tweenFn = Tweener.tween(
                [startVal],
                [endVal],
                tween,
                function() {
                    drawable[prop] = endVal;

                    for (var ii = drawable.tweens.length; ii--; ) {
                        if (drawable.tweens[ii] === applicator) {
                            drawable.tweens.splice(ii, 1);
                            break;
                        } // if
                    } // for
                },
                drawable.view
            ),
            applicator = function() {
                drawable[prop] = tweenFn()[0];
            };

        return applicator;
    } // tweenDrawable

    return {
        tween: tween,
        tweenDrawable: tweenDrawable
    };
})();

/**
DRAWABLE

## Constructor
`new T5.Drawable(view, layer, params);`

## Settings
-
*/
var Drawable = function(view, layer, params) {
    params = _extend({
        style: null,
        xy: null,
        size: 20,
        fill: false,
        stroke: true,
        draggable: false,
        properties: {},
        typeName: 'Shape',
        zindex: 0
    }, params);

    _extend(this, params);

    if (_is(this.xy, typeString)) {
        this.xy = new view.XY(this.xy);
    } // if

    this.id = 'drawable_' + drawableCounter++;
    this.bounds = null;
    this.view = view;
    this.layer = layer;

    this.tweens = [];

    this.animations = 0;
    this.rotation = 0;
    this.scaling = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.visible = true;

    _observable(this);
};

Drawable.prototype = {
    constructor: Drawable,

    /**
    ### applyTweens()
    */
    applyTweens: function() {
        for (var ii = this.tweens.length; ii--; ) {
            this.tweens[ii]();
        } // for
    },

    /**
    ### drag(dragData, dragX, dragY, drop)
    */
    drag: null,

    /**
    ### draw(renderer, drawData)
    The draw method is provided for custom drawables. Internal drawables will delegate
    their drawing to the function that is returned from the various prep* methods of the
    renderer, however, when building some applications this really isn't suitable and
    more is required.  Thus if required a custom draw method can be implemented to implement
    the required functionality.
    */
    draw: null,

    /**
    ### getProps(renderer)
    Get the drawable item properties that will be passed to the renderer during
    the prepare and draw phase
    */
    getProps: null,

    /**
    ### resync(view)
    */
    resync: function() {
        if (this.xy) {
            this.xy.sync(this.view);

            if (this.size) {
                var halfSize = this.size >> 1;

                this.updateBounds(new Rect(
                    this.xy.x - halfSize,
                    this.xy.y - halfSize,
                    this.size,
                    this.size));
            } // if
        } // if

        return this;
    },

    /**
    ### rotate(value, tween, isAbsolute)
    */
    rotate: function(value, tween, isAbsolute) {
        if (_is(value, typeNumber)) {
            var targetVal = (isAbsolute ? value : this.rotation * RADIANS_TO_DEGREES + value) * DEGREES_TO_RADIANS;

            if (tween) {
                this.tweens.push(Tweener.tweenDrawable(
                    this,
                    'rotation',
                    this.rotation,
                    targetVal,
                    tween
                ));
            }
            else {
                this.rotation = targetVal;
                this.view.invalidate();
            } // if..else

            return this;
        }
        else {
            return this.rotation * RADIANS_TO_DEGREES;
        } // if..else
    },

    /**
    ### scale(value, tween, isAbsolute)
    */
    scale: function(value, tween, isAbsolute) {
        if (_is(value, typeNumber)) {
            var targetVal = (isAbsolute ? value : this.scaling * value);

            if (tween) {
                this.tweens.push(Tweener.tweenDrawable(
                    this,
                    'scaling',
                    this.scaling,
                    targetVal,
                    tween
                ));
            }
            else {
                this.scaling = targetVal;
                this.view.invalidate();
            } // if..else

            return this;
        }
        else {
            return this.scaling;
        }
    },

    /**
    ### translate(x, y, tween, isAbsolute)
    */
    translate: function(x, y, tween, isAbsolute) {
        if (_is(x, typeNumber)) {
            var targetX = isAbsolute ? x : this.translateX + x,
                targetY = isAbsolute ? y : this.translateY + y;

            if (tween) {
                this.tweens.push(Tweener.tweenDrawable(
                    this,
                    'translateX',
                    this.translateX,
                    targetX,
                    tween
                ));

                this.tweens.push(Tweener.tweenDrawable(
                    this,
                    'translateY',
                    this.translateY,
                    targetY,
                    tween
                ));
            }
            else {
                this.translateX = targetX;
                this.translateY = targetY;
                this.view.invalidate();
            } // if..else

            return this;
        }
        else {
            return new XY(this.translateX, this.translateY);
        } // if..else
    },


    /**
    ### updateBounds(bounds: XYRect, updateXY: boolean)
    */
    updateBounds: function(bounds, updateXY) {
        var moved = bounds && (
                (! this.bounds) ||
                bounds.x != this.bounds.x ||
                bounds.y != this.bounds.y
            );

        if (moved) {
            this.trigger('move', this, bounds, this.bounds);
        } // if

        this.bounds = bounds;

        if (updateXY) {
            this.xy = this.bounds.center();
        } // if
    }
};
/**
# DRAWABLE: marker
The T5.Marker class represents a generic marker for annotating an underlying view.
Originally the marker class did very little, and in most instances a T5.ImageMarker
was used instead to generate a marker that looked more visually appealing, however,
with the introduction of different rendering backends the standard marker class is
the recommended option for annotating maps and views as it allows the renderer to
implement suitable rendering behaviour which looks good regardless of the context.

## Initialization Parameters
In addition to the standard T5.Drawable initialization parameters, a Marker can
accept the following:


- `markerType` - (default = simple)

    The style of marker that will be displayed for the marker.  This is interpreted
    by each renderer individually.

*/
reg(typeDrawable, 'marker', function(view, layer, params) {
    params = _extend({
        fill: true,
        stroke: false,
        markerType: 'simple',
        hoverStyle: 'highlight',
        typeName: 'Marker'
    }, params);

    return new Drawable(view, layer, params);
});
/**
# DRAWABLE: poly

## Settings

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.

## Events

### updatedPoints

## Methods
*/
reg(typeDrawable, 'poly', function(view, layer, params) {
    params = _extend({
        allowCull: false,
        simplify: true,
        fill: true,
        points: [],
        typeName: 'Poly'
    }, params);

    /* internals */

    var SYNC_PARSE_THRESHOLD = 500,
        _poly = new Line(params.allowCull),
        _drawPoly = new Line(params.allowCull);

    function updateDrawPoints() {
        var ii, x, y, maxX, maxY, minX, minY, drawPoints;

        _drawPoly = params.simplify ? _poly.simplify() : _poly;
        drawPoints = _drawPoly.points;

        for (ii = drawPoints.length; ii--; ) {
            x = drawPoints[ii].x;
            y = drawPoints[ii].y;

            minX = _is(minX, typeUndefined) || x < minX ? x : minX;
            minY = _is(minY, typeUndefined) || y < minY ? y : minY;
            maxX = _is(maxX, typeUndefined) || x > maxX ? x : maxX;
            maxY = _is(maxY, typeUndefined) || y > maxY ? y : maxY;
        } // for

        _self.updateBounds(new Rect(minX, minY, maxX - minX, maxY - minY), true);

        _self.trigger('pointsUpdate', _self, drawPoints);

        view.invalidate();
    } // updateDrawPoints

    /* exported functions */

    function line(value) {
        if (_is(value, 'array')) {
            var polyPoints;

            _poly = new Line(params.allowCull);
            polyPoints = _poly.points;

            Runner.process(value, function(slice, sliceLen) {
                for (var ii = 0; ii < sliceLen; ii++) {
                    polyPoints.push(new view.XY(slice[ii]));
                } // for
            }, resync, SYNC_PARSE_THRESHOLD);

            return _self;
        }
        else {
            return _drawPoly;
        } // if..else
    } // points

    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync() {
        if (_poly.points.length) {
            Runner.process(_poly.points, function(slice, sliceLen) {
                for (var ii = sliceLen; ii--; ) {
                    slice[ii].sync(view);
                } // for
            }, updateDrawPoints, SYNC_PARSE_THRESHOLD);
        } // if
    } // resync

    var _self = _extend(new Drawable(view, layer, params), {
        line: line,
        resync: resync
    });

    line(params.points);

    return _self;
});
/**
# DRAWABLE: line
*/
reg(typeDrawable, 'line', function(view, layer, params, callback) {
    params.fill = false;
    params.allowCull = true;

    return regCreate(typeDrawable, 'poly', view, layer, params);
});
/*
# DRAWABLE: image
*/
reg(typeDrawable, 'image', function(view, layer, params) {
    params = _extend({
        image: null,
        imageUrl: null,
        centerOffset: null,
        typeName: 'Image'
    }, params);

    var drawableResync = Drawable.prototype.resync,
        drawX,
        drawY,
        imgOffsetX = 0,
        imgOffsetY = 0,
        image = params.image;

    /* internal functions */

    function checkOffsetAndBounds() {
        if (image && image.width > 0) {
            if (! this.centerOffset) {
                this.centerOffset = new XY(
                    -image.width >> 1,
                    -image.height >> 1
                );
            } // if

            this.updateBounds(new Rect(
                this.xy.x + this.centerOffset.x,
                this.xy.y + this.centerOffset.y,
                image.width,
                image.height),
            false);
        } // if
    } // checkOffsetAndBounds

    /* exports */

    function changeImage(imageUrl) {
        this.imageUrl = imageUrl;

        if (this.imageUrl) {
            var marker = this;

            getImage(this.imageUrl, function(retrievedImage, loaded) {
                image = retrievedImage;

                if (loaded) {
                    var view = _self.layer ? _self.layer.view : null;

                    if (view) {
                        view.invalidate();
                    } // if
                } // if

                checkOffsetAndBounds.apply(marker);
            });
        } // if
    } // changeImage

    /**
    ### getProps(renderer)
    Get the drawable item properties that will be passed to the renderer during
    the prepare and draw phase
    */
    function getProps(renderer) {
        if (! this.bounds) {
            checkOffsetAndBounds(this, image);
        } // if

        return {
            image: image,
            x: this.xy.x + imgOffsetX,
            y: this.xy.y + imgOffsetY
        };
    } // getProps

    function resync(view) {
        drawableResync.call(this, view);

        checkOffsetAndBounds.call(this);
    } // resync

    var _self = _extend(new Drawable(view, layer, params), {
        changeImage: changeImage,
        getProps: getProps,
        resync: resync
    });

    if (! image) {
        changeImage.call(this, this.imageUrl);
    } // if

    if (this.centerOffset) {
        imgOffsetX = this.centerOffset.x;
        imgOffsetY = this.centerOffset.y;
    } // if

    return _self;
});
/**
# DRAWABLE: arc
*/
reg(typeDrawable, 'arc', function(view, layer, params) {
    params = _extend({
        startAngle: 0,
        endAngle: Math.PI * 2,
        typeName: 'Arc'
    }, params);

    return new Drawable(view, layer, params);
});

/**
# LAYER

In and of it_self, a View does nothing.  Not without a
ViewLayer at least.  A view is made up of one or more of these
layers and they are drawn in order of *zindex*.

## Settings

- `id` - the id that has been assigned to the layer, this value
can be used when later accessing the layer from a View.

- `zindex` (default: 0) - a zindex in Tile5 means the same thing it does in CSS

## Events

### changed
This event is fired in response to the `changed` method being called.  This method is
called primarily when you have made modifications to the layer in code and need to
flag to the containing T5.View that an redraw is required.  Any objects that need to
perform updates in response to this layer changing (including overriden implementations)
can do this by binding to the change method

~ layer.bind('change', function(evt, layer) {
~   // do your updates here...
~ });

## Methods

*/
function ViewLayer(view, panFrame, container, params) {
    params = _extend({
        id: 'layer_' + layerCounter++,
        zindex: 0,
        animated: false,
        style: null,
        minXY: null,
        maxXY: null,
        visible: true
    }, params);

    this.visible = params.visible;
    this.view = view;

    _observable(_extend(this, params));
}; // ViewLayer constructor

ViewLayer.prototype = {
    constructor: ViewLayer,

    /**
    ### clip(context, offset, dimensions)
    */
    clip: null,

    /**
    ### cycle(tickCount, offset)

    Called in the View method of the same name, each layer has an opportunity
    to update it_self in the current animation cycle before it is drawn.
    */
    cycle: function(tickCount, offset) {
    },

    /**
    ### draw(context, offset, dimensions, view)

    The business end of layer drawing.  This method is called when a layer needs to be
    drawn and the following parameters are passed to the method:

        - renderer - the renderer that will be drawing the viewlayer
        - viewport - the current viewport
        - view - a reference to the View
        - tickCount - the current tick count
        - hitData - an object that contains information regarding the current hit data
    */
    draw: function(renderer, viewport, view, tickCount, hitData) {
    },

    /**
    ### hitGuess(hitX, hitY, view)
    The hitGuess function is used to determine if a layer would return elements for
    a more granular hitTest.  Essentially, hitGuess calls are used when events such
    as hover and tap events occur on a view and then if a positive result is detected
    the canvas is invalidated and checked in detail during the view layer `draw` operation.
    By doing this we can just do simple geometry operations in the hitGuess function
    and then make use of canvas functions such as `isPointInPath` to do most of the heavy
    lifting for us
    */
    hitGuess: null
}; // ViewLayer.prototype
/**
# LAYER: tile
*/
reg('layer', 'tile', function(view, panFrame, container, params) {
    params = _extend({
        generator: 'osm',
        imageLoadArgs: {}
    }, params);

    var TILELOAD_MAX_PANSPEED = 2,
        genFn = regCreate('generator', params.generator, view, params).run,
        generating = false,
        storage = null,
        zoomTrees = [],
        loadArgs = params.imageLoadArgs;

    /* event handlers */

    function handleRefresh(evt) {
        if (storage) {
            genFn(storage, view.invalidate);
        } // if
    } // handleViewIdle

    function handleReset(evt) {
        storage.clear();
    } // reset

    function handleResync(evt) {
        var zoomLevel = view && view.zoom ? view.zoom() : 0;

        if (! zoomTrees[zoomLevel]) {
            zoomTrees[zoomLevel] = createStoreForZoomLevel(zoomLevel);
        } // if

        storage = zoomTrees[zoomLevel];
    } // handleParentChange

    /* exports */

    /**
    ### draw(renderer)
    */
    function draw(renderer, viewport, view) {
        if (renderer.drawTiles) {
            renderer.drawTiles(
                viewport,
                storage.search(viewport.buffer(128)),
                view.panSpeed < TILELOAD_MAX_PANSPEED);
        } // if
    } // draw

    /* definition */

    var _self = _extend(new ViewLayer(view, panFrame, container, params), {
        draw: draw
    });

    view.bind('resync', handleResync);
    view.bind('refresh', handleRefresh);
    view.bind('reset', handleReset);

    return _self;
});
/**
# LAYER: Draw
*/
reg('layer', 'draw', function(view, panFrame, container, params) {
    params = _extend({
        zindex: 10
    }, params);

    var storage,
        sortTimeout = 0,
        resyncCallbackId;

    /* private functions */

    function dragObject(dragData, dragX, dragY, drop) {
        var dragOffset = this.dragOffset;

        if (! dragOffset) {
            dragOffset = this.dragOffset = new view.XY(
                dragData.startX - this.xy.x,
                dragData.startY - this.xy.y
            );
        } // if

        this.xy.x = dragX - dragOffset.x;
        this.xy.y = dragY - dragOffset.y;

        if (drop) {
            delete this.dragOffset;
            view.invalidate();

            this.xy.sync(view, true);

            this.trigger('dragDrop');
        } // if

        return true;
    } // dragObject

    /* event handlers */

    function handleItemMove(evt, drawable, newBounds, oldBounds) {
        if (storage) {
            if (oldBounds) {
                storage.remove(oldBounds, drawable);
            } // if

            storage.insert(newBounds, drawable);
        } // if
    } // handleItemMove

    function handleRemoved(evt) {
        storage = null;

        view.unbind('resync', resyncCallbackId);
    } // handleLayerRemove

    function handleResync(evt) {
        var drawables = storage ? storage.all() : [];

        storage = createStoreForZoomLevel(view.zoom(), storage); // TODO: populate with the previous storage

        for (var ii = drawables.length; ii--; ) {
            drawables[ii].resync();
        } // for
    } // handleParentChange

    /* exports */

    /**
    ### clear()
    */
    function clear() {
        if (storage) {
            storage.clear();
            _this.trigger('cleared');

            view.invalidate();
        } // if
    } // clear

    /**
    ### create(type, settings, prepend)
    */
    function create(type, settings, prepend) {
        var drawable = regCreate(typeDrawable, type, view, _this, settings);

        drawable.resync();
        if (storage && drawable.bounds) {
            storage.insert(drawable.bounds, drawable);
        } // if

        drawable.bind('move', handleItemMove);
        drawable.trigger('created');

        _this.trigger(type + 'Added', drawable);

        return drawable;
    } // create

    /**
    ### draw(renderer, viewport, view, tickCount, hitData)
    */
    function draw(renderer, viewport, view, tickCount, hitData) {
        var emptyProps = {
            },
            drawItems = storage && viewport ? storage.search(viewport): [];

        for (var ii = drawItems.length; ii--; ) {
            var drawable = drawItems[ii],
                overrideStyle = drawable.style || _this.style,
                styleType,
                previousStyle,
                transform,
                drawProps = drawable.getProps ? drawable.getProps(renderer) : emptyProps,
                prepFn = renderer['prep' + drawable.typeName],
                drawFn,
                drawData;

            if (drawable.tweens.length > 0) {
                drawable.applyTweens();
            } // if

            transform = renderer.applyTransform(drawable);
            drawData = drawable.visible && prepFn ? prepFn.call(renderer,
                drawable,
                viewport,
                hitData,
                drawProps) : null;

            if (drawData) {
                if (hitData && drawData.hit) {
                    hitData.elements.push(Hits.initHit(
                        drawable.type,
                        drawable,
                        drawable.draggable ? dragObject : null)
                    );

                    styleType = hitData.type + 'Style';

                    overrideStyle = drawable[styleType] || _this[styleType] || overrideStyle;
                } // if

                previousStyle = overrideStyle ? renderer.applyStyle(overrideStyle, true) : null;

                drawFn = drawable.draw || drawData.draw;

                if (drawFn) {
                    drawFn.call(drawable, drawData);
                } // if

                if (previousStyle) {
                    renderer.applyStyle(previousStyle);
                } // if
            } // if

            if (transform && transform.undo) {
                transform.undo();
            } // if
        } // for
    } // draw

    /**
    ### find(selector: String)
    The find method will eventually support retrieving all the shapes from the shape
    layer that match the selector expression.  For now though, it just returns all shapes
    */
    function find(selector) {
        return storage.all();
    } // find

    /**
    ### hitGuess(hitX, hitY, view)
    Return true if any of the markers are hit, additionally, store the hit elements
    so we don't have to do the work again when drawing
    */
    function hitGuess(hitX, hitY, view) {
        return storage && storage.search({
            x: hitX - 5,
            y: hitY - 5,
            w: 10,
            h: 10
        }).length > 0;
    } // hitGuess

    /* initialise _this */

    var _this = _extend(new ViewLayer(view, panFrame, container, params), {
        clear: clear,
        create: create,
        draw: draw,
        find: find,
        hitGuess: hitGuess
    });

    resyncCallbackId = view.bind('resync', handleResync);

    _this.bind('removed', handleRemoved);

    return _this;
});

function Control(view) {
    _observable(this);
};

Control.prototype = {
    constructor: Control
};
/**
# CONTROL: Zoombar
*/
reg('control', 'zoombar', function(view, panFrame, container, params) {
    params = _extend({
        width: 24,
        height: 200,
        images: 'img/zoom.png',
        align: 'right',
        marginTop: 10,
        spacing: 10,
        thumbHeight: 16,
        buttonHeight: 16
    }, params);

    /* internals */

    var STATE_STATIC = 0,
        STATE_HOVER = 1,
        STATE_DOWN = 2,
        buttonHeight = params.buttonHeight,
        eventMonitor,
        spriteStart = params.height,
        thumb,
        thumbHeight = params.thumbHeight,
        thumbMin = params.spacing + buttonHeight - (thumbHeight >> 1),
        thumbMax = params.height - buttonHeight - (thumbHeight >> 1),
        thumbPos = thumbMin,
        thumbVal = -1,
        thumbResetTimeout = 0,
        zoomMin = view.minZoom(),
        zoomMax = view.maxZoom(),
        zoomSteps = zoomMax - zoomMin + 1,
        zoomStepSpacing = (thumbMax - thumbMin) / zoomSteps | 0,
        buttons = [],
        zoomBar,
        zoomTimeout = 0,
        tapHandlers = {
            button0: function() {
                view.zoom(view.zoom() + 1);
            },

            button1: function() {
                view.zoom(view.zoom() - 1);
            }
        };

    function bindEvents() {
        eventMonitor = INTERACT.watch(zoomBar, {
            bindTarget: zoomBar
        });

        eventMonitor.bind('pointerMove', handlePointerMove);
        eventMonitor.bind('pointerDown', handlePointerDown);
        eventMonitor.bind('pointerUp', handlePointerUp);
        eventMonitor.bind('tap', handlePointerTap);
    } // bindEvents

    function createButton(btnIndex, marginTop) {
        var button = buttons[btnIndex] = DOM.create('div', 't5-zoombar-button', {
            position: 'absolute',
            background: getButtonBackground(btnIndex),
            'z-index': 51,
            width: params.width + 'px',
            height: params.buttonHeight + 'px',
            'margin-top': (marginTop || 0) + 'px'
        });

        zoomBar.appendChild(button);
    } // createButton

    function createThumb() {
        zoomBar.appendChild(thumb = DOM.create('div', 't5-zoombar-thumb', {
            position: 'absolute',
            background: getThumbBackground(),
            'z-index': 51,
            width: params.width + 'px',
            height: params.thumbHeight + 'px',
            margin: '10px 0 0 0',
            top: (thumbPos - thumbMin) + 'px'
        }));
    } // createThumb

    function createZoomBar() {
        zoomBar = DOM.create('div', 't5-zoombar', {
            position: 'absolute',
            background: getBackground(),
            'z-index': 50,
            overflow: 'hidden',
            width: params.width + 'px',
            height: params.height + 'px',
            margin: getMargin()
        });

        if (container.childNodes[0]) {
            container.insertBefore(zoomBar, container.childNodes[0]);
        }
        else {
            container.appendChild(zoomBar);
        } // if..else

        createThumb();

        createButton(0);
        createButton(1, params.height - params.buttonHeight);

        bindEvents();
    } // createImageContainer

    function getBackground() {
        return 'url(' + params.images + ')';
    } // getBackground

    function getButtonBackground(buttonIndex, state) {
        var spriteOffset = spriteStart + thumbHeight * 3 +
                (buttonIndex || 0) * buttonHeight * 3 +
                (state || 0) * buttonHeight;

        return 'url(' + params.images + ') 0 -' + spriteOffset + 'px';
    }

    function getMargin() {
        var marginLeft = params.spacing,
            formatter = _formatter('{0}px 0 0 {1}px');

        if (params.align === 'right') {
            marginLeft = container.offsetWidth - params.width - params.spacing;
        } // if

        return formatter(params.marginTop, marginLeft);
    } // getMargin

    function getThumbBackground(state) {
        var spriteOffset = spriteStart + (state || 0) * thumbHeight;

        return 'url(' + params.images + ') 0 -' + spriteOffset + 'px';
    } // getThumbBackground

    function handleDetach() {
        eventMonitor.unbind();

        container.removeChild(zoomBar);
    } // handleDetach

    function handlePointerDown(evt, absXY, relXY) {
        updateSpriteState(evt.target, STATE_DOWN);
    } // handlePointerDown

    function handlePointerMove(evt, absXY, relXY) {
        thumbPos = Math.min(Math.max(thumbMin, relXY.y - (thumbHeight >> 1)), thumbMax);

        setThumbVal(zoomSteps - ((thumbPos - thumbMin) / thumbMax) * zoomSteps | 0);
    } // handlePointerMove

    function handlePointerTap(evt, absXY, relXY) {
        var handler = tapHandlers[updateSpriteState(evt.target, STATE_DOWN)];
        if (handler) {
            handler();
        } // if
    }

    function handlePointerUp(evt, absXY, relXY) {
        updateSpriteState(evt.target, STATE_STATIC);
    } // handlePointerUp

    function handleZoomLevelChange(evt, zoomLevel) {
        setThumbVal(zoomLevel);
    } // handleZoomLevelChange

    function updateSpriteState(target, state) {
        var targetCode;

        if (target === thumb) {
            thumb.style.background = getThumbBackground(state);
            targetCode = 'thumb';
        }
        else {
            for (var ii = 0; ii < buttons.length; ii++) {
                if (target === buttons[ii]) {
                    targetCode = 'button' + ii;
                    buttons[ii].style.background = getButtonBackground(ii, state);
                    break;
                } // if
            } // for
        } // if..else

        return targetCode;
    } // updateSpriteState

    /* exports */

    function setThumbVal(value) {
        if (value !== thumbVal) {
            thumbVal = value;

            thumbPos = thumbMax - (thumbVal / zoomSteps * (thumbMax - thumbMin)) | 0;
            DOM.move(thumb, 0, thumbPos - thumbMin);

            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(function() {
                view.zoom(thumbVal);
            }, 500);
        } // if
    } // if

    /* initialization */

    createZoomBar();

    var _this = new Control(view);

    _this.bind('detach', handleDetach);

    view.bind('zoom', handleZoomLevelChange);

    setThumbVal(view.zoom());

    return _this;
});
reg('control', 'copyright', function(view, panFrame, container, params) {
    params = _extend({
        align: 'right',
        text: null,
        spacing: 5
    }, params);

    /* internals */

    var copydiv;

    function createCopyright() {
        var containerRect = DOM.rect(container),
            text = params.text || view.getCopy(),
            maxWidth = Math.max(
                containerRect.w >> 1,
                Math.min(400, containerRect.w - params.spacing * 2)
            );

        copydiv = DOM.create('div', 't5-copyright', {
            position: 'absolute',
            overflow: 'hidden',
            'max-width': maxWidth + 'px',
            'z-index': 49
        });

        if (container.childNodes[0]) {
            container.insertBefore(copydiv, container.childNodes[0]);
        }
        else {
            container.appendChild(copydiv);
        } // if..else

        if (text) {
            setText(text);
        } // if
    } // createImageContainer

    function getMargin() {
        var padding = view.viewport().padding,
            containerRect = DOM.rect(container),
            marginLeft = params.spacing,
            marginTop = containerRect.h - copydiv.offsetHeight - params.spacing,
            formatter = _formatter('{0}px 0 0 {1}px');

        if (params.align === 'right') {
            marginLeft = containerRect.w - copydiv.offsetWidth - params.spacing;
        } // if

        return formatter(marginTop, marginLeft);
    } // getMargin

    function handleCopyright(evt, copyright) {
        setText(view.getCopy());
    } // handleCopyrightUpdate

    function handleDetach() {
        if (copydiv) {
            container.removeChild(copydiv);
        } // if
    } // handleDetach

    /* exports */

    function getText() {
        return copydiv ? copydiv.innerHTML : '';
    } // getText

    function setText(text) {
        if (copydiv) {
            copydiv.innerHTML = text;
            copydiv.style.margin = getMargin();
        } // if
    } // setText

    /* initialization */

    createCopyright();

    var _this = _extend(new Control(view), {
        getText: getText,
        setText: setText
    });

    _this.bind('detach', handleDetach);

    if (! params.text) {
        view.bind('copyright', handleCopyright);
    } // if

    return _this;
});

/**
# T5

## Methods
*/
_extend(T5, {
    ex: _extend,
    log: _log,
    observable: _observable,
    configurable: _configurable,
    formatter: _formatter,
    wordExists: _wordExists,
    is: _is,
    indexOf: _indexOf,

    /**
    ### fn(name)
    */
    fn: function(name) {
        return regGet('fn', name);
    },

    project: _project,
    unproject: _unproject,

    getImage: getImage,

    Registry: Registry,
    Style: Style,
    DOM: DOM,
    Rect: Rect,
    XY: XY,
    GeoXY: GeoXY,
    Line: Line,
    Hits: Hits,

    Control: Control,
    Tile: Tile,
    Tweener: Tweener,

    ViewLayer: ViewLayer,
    View: View,
    Map: Map
});

if (typeof module != 'undefined' && module.exports) {
    module.exports = T5;
} // if

/**
# Tile5(target, settings, viewId)
*/
function Tile5(target, settings) {
    settings = _extend({
        container: target,
        type: 'map',
        renderer: 'canvas',
        starpos: null,
        zoom: 1,
        fastpan: false,
        drawOnScale: true,
        zoombar: {}
    }, settings);

    return regCreate('view', settings.type, settings);
} // Tile5
/**
# GENERATOR: osm
*/
reg('generator', 'osm', function(view, params) {
    params = _extend({
        flipY: false,
        tileSize: 256,
        tilePath: '{0}/{1}/{2}.png',
        osmDataAck: true
    }, params);

    var DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI,
        serverDetails = null,
        subDomains = [],
        subdomainFormatter,
        pathFormatter = _formatter(params.tilePath);

    /* internal functions */

    /*
    Function:  calculateTileOffset
    This function calculates the tile offset for a mapping tile in the cloudmade API.  Code is adapted
    from the pseudocode that can be found on the cloudemade site at the following location:

    http://developers.cloudmade.com/projects/tiles/examples/convert-coordinates-to-tile-numbers
    */
    function calculateTileOffset(lat, lon, numTiles) {
        var tileX, tileY;

        tileX = (lon+180) / 360 * numTiles;
        tileY = ((1-Math.log(Math.tan(lat*DEGREES_TO_RADIANS) + 1/Math.cos(lat*DEGREES_TO_RADIANS))/Math.PI)/2 * numTiles) % numTiles;

        return new GeoXY(tileX | 0, tileY | 0);
    } // calculateTileOffset

    function calculatePosition(x, y, numTiles) {
        var n = Math.PI - 2*Math.PI * y / numTiles,
            lon = x / numTiles * 360 - 180,
            lat = RADIANS_TO_DEGREES * Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));

        return new GeoJS.Pos(lat, lon);
    } // calculatePosition

    function getTileXY(x, y, numTiles, view) {
        var xy = new GeoXY(calculatePosition(x, y, numTiles));

        xy.sync(view);
        return xy;
    } // getTileXY

    /* exports */

    function buildTileUrl(tileX, tileY, zoomLevel, numTiles, flipY) {
        if (tileY >= 0 && tileY < numTiles) {
            tileX = (tileX % numTiles + numTiles) % numTiles;

            var tileUrl = pathFormatter(
                zoomLevel,
                tileX,
                flipY ? Math.abs(tileY - numTiles + 1) : tileY);

            if (serverDetails) {
                tileUrl = subdomainFormatter(subDomains[tileX % (subDomains.length || 1)]) + tileUrl;
            } // if

            return tileUrl;
        } // if
    } // buildTileUrl

    function run(store, callback) {
        var zoomLevel = view.zoom ? view.zoom() : 0,
            viewport = view.viewport();

        if (zoomLevel) {
            var numTiles = 2 << (zoomLevel - 1),
                tileSize = params.tileSize,
                radsPerPixel = (Math.PI * 2) / (tileSize << zoomLevel),
                minX = viewport.x,
                minY = viewport.y,
                xTiles = (viewport.w  / tileSize | 0) + 1,
                yTiles = (viewport.h / tileSize | 0) + 1,
                position = new GeoXY(minX, minY).sync(view, true).pos(),
                tileOffset = calculateTileOffset(position.lat, position.lon, numTiles),
                tilePixels = getTileXY(tileOffset.x, tileOffset.y, numTiles, view),
                flipY = params.flipY,
                tiles = store.search({
                    x: tilePixels.x,
                    y: tilePixels.y,
                    w: xTiles * tileSize,
                    h: yTiles * tileSize
                }),
                tileIds = {},
                ii;

            for (ii = tiles.length; ii--; ) {
                tileIds[tiles[ii].id] = true;
            } // for


            serverDetails = _self.getServerDetails ? _self.getServerDetails() : null;
            subDomains = serverDetails && serverDetails.subDomains ?
                serverDetails.subDomains : [];
            subdomainFormatter = _formatter(serverDetails ? serverDetails.baseUrl : '');

            for (var xx = 0; xx <= xTiles; xx++) {
                for (var yy = 0; yy <= yTiles; yy++) {
                    var tileX = tileOffset.x + xx,
                        tileY = tileOffset.y + yy,
                        tileId = tileX + '_' + tileY,
                        tile;

                    if (! tileIds[tileId]) {
                        tileUrl = _self.buildTileUrl(
                            tileX,
                            tileY,
                            zoomLevel,
                            numTiles,
                            flipY);

                        tile = new Tile(
                            tilePixels.x + xx * tileSize,
                            tilePixels.y + yy * tileSize,
                            tileUrl,
                            tileSize,
                            tileSize,
                            tileId);

                        store.insert(tile, tile);
                    } // if
                } // for
            } // for

            if (callback) {
                callback();
            } // if
        } // if
    } // callback

    /* define the generator */

    var _self = {
        buildTileUrl: buildTileUrl,
        run: run
    };

    if (params.osmDataAck) {
        view.addCopy('Map data &copy; <a href="http://openstreetmap.org/" target="_blank">OpenStreetMap</a> (and) contributors, CC-BY-SA');
    } // if


    return _self;
});
T5.Cloudmade = (function() {
T5.Registry.register('generator', 'osm.cloudmade', function(view, params) {
    params = T5.ex({
        apikey: null,
        styleid: 1
    }, params);

    var urlFormatter = T5.formatter('http://{3}.tile.cloudmade.com/{0}/{1}/{2}/');
    view.addCopy('This product uses the <a href="http://cloudmade.com/" target="_blank">CloudMade</a> APIs, but is not endorsed or certified by CloudMade.');

    return T5.ex(T5.Registry.create('generator', 'osm', view, params), {
        getServerDetails: function() {
            return {
                baseUrl: urlFormatter(params.apikey, params.styleid, 256, '{0}'),
                subDomains: ['a', 'b', 'c']
            };
        }
    });
});
})();
})();
