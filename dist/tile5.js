/*!
 * Sidelab Tile5 Javascript Library v0.9.5
 * http://tile5.org/
 *
 * Copyright 2010, Damon Oehlman <damon.oehlman@sidelab.com>
 * Licensed under the MIT licence
 * https://github.com/sidelab/tile5/blob/master/LICENSE.mdown
 *
 * Build Date: @DATE
 */

/*jslint white: true, safe: true, onevar: true, undef: true, nomen: true, eqeqeq: true, newcap: true, immed: true, strict: true */

/*!
 * Sidelab COG Javascript Library v0.2.0
 * http://www.sidelab.com/
 *
 * Copyright 2011, Damon Oehlman <damon.oehlman@sidelab.com>
 * Licensed under the MIT licence
 * https://github.com/sidelab/cog
 *
 */

COG = typeof COG !== 'undefined' ? COG : {};

/**
# COG.extend
*/
COG.extend = function() {
    var target = arguments[0] || {},
        source;

    for (var ii = 1, argCount = arguments.length; ii < argCount; ii++) {
        if ((source = arguments[ii]) !== null) {
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
}; // extend

(function() {
    var REGEX_TEMPLATE_VAR = /\$\{(.*?)\}/ig;

    var hasOwn = Object.prototype.hasOwnProperty,
        objectCounter = 0,
        extend = COG.extend;

    /* exports */

    var exports = {},

        toID = exports.toID = function(text) {
            return text.replace(/\s/g, "-");
        },

        objId = exports.objId = function(prefix) {
            return (prefix ? prefix : "obj") + objectCounter++;
        };

var isFunction = exports.isFunction = function( obj ) {
    return toString.call(obj) === "[object Function]";
};

var isArray = exports.isArray = function( obj ) {
    return toString.call(obj) === "[object Array]";
};

var isPlainObject = exports.isPlainObject = function( obj ) {
    if ( !obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval ) {
        return false;
    }

    if ( obj.constructor &&
        !hasOwn.call(obj, "constructor") &&
        !hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
        return false;
    }


    var key;
    for ( key in obj ) {}

    return key === undefined || hasOwn.call( obj, key );
};

var isEmptyObject = exports.isEmptyObject = function( obj ) {
    for ( var name in obj ) {
        return false;
    }
    return true;
};

var isXmlDocument = exports.isXmlDocument = function(obj) {
    return toString.call(obj) === "[object Document]";
};
/**
### contains(obj, members)
This function is used to determine whether an object contains the specified names
as specified by arguments beyond and including index 1.  For instance, if you wanted
to check whether object 'foo' contained the member 'name' then you would simply call
COG.contains(foo, 'name').
*/
var contains = exports.contains = function(obj, members) {
    var fnresult = obj;
    var memberArray = arguments;
    var startIndex = 1;

    if (members && module.isArray(members)) {
        memberArray = members;
        startIndex = 0;
    } // if

    for (var ii = startIndex; ii < memberArray; ii++) {
        fnresult = fnresult && (typeof foo[memberArray[ii]] !== 'undefined');
    } // for

    return fnresult;
}; // contains
/**
### formatStr(text, args*)
*/
var formatStr = exports.formatStr = function(text) {
    if ( arguments.length <= 1 )
    {
        return text;
    }
    var tokenCount = arguments.length - 2;
    for( var token = 0; token <= tokenCount; token++ )
    {
        text = text.replace( new RegExp( "\\{" + token + "\\}", "gi" ),
                                                arguments[ token + 1 ] );
    }
    return text;
}; // formatStr

var wordExists = exports.wordExists = function(stringToCheck, word) {
    var testString = "";

    if (word.toString) {
        word = word.toString();
    } // if

    for (var ii = 0; ii < word.length; ii++) {
        testString += (! (/\w/).test(word[ii])) ? "\\" + word[ii] : word[ii];
    } // for

    var regex = new RegExp("(^|\\s|\\,)" + testString + "(\\,|\\s|$)", "i");

    return regex.test(stringToCheck);
}; // wordExists

    COG.extend(COG, exports);
})();


(function() {
    var traceAvailable = window.console && window.console.markTimeline,
        logError = writer('error'),
        logInfo = writer('info');

    /* internal functions */

    function writer(level) {
        if (typeof console !== 'undefined') {
            return function() {
                console[level](Array.prototype.slice.call(arguments, 0).join(' '));

                return true;
            };
        }
        else {
            return function() {
                return false;
            };
        } // if..else
    } // writer

    /* exports */

    var trace = (function() {
        if (traceAvailable) {
            return function(message, startTicks) {
                console.markTimeline(message + (startTicks ? ": " +
                    (new Date().getTime() - startTicks) + "ms" : ""));
            };
        }
        else {
            return function() {};
        } // if..else
    })();

    COG.extend(COG, {
        trace: trace,
        debug: writer('debug'),
        info: logInfo,
        warn: writer('warn'),
        error: logError,

        exception: function(error) {
            if (logError) {
                for (var keyname in error) {
                    logInfo("ERROR DETAIL: " + keyname + ": " + error[keyname]);
                } // for
            }
        }

    });
})();


(function() {
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

    /**
    # COG.observable
    */
    COG.observable = function(target) {
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

                if (args) {
                    COG.extend(evt, args);
                } // if

                if (! eventCallbacks) {
                    return null;
                } // if

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

(function() {
    var configurables = {},
        counter = 0;

    /* internal functions */

    function attachHelper(target, helperName) {
        if (! target[helperName]) {
            target[helperName] = function(value) {
                return target.configure(helperName, value);
            };
        } // if
    } // attachHelper

    function getSettings(target) {
        return target.gtConfig;
    } // getSettings

    function getConfigCallbacks(target) {
        return target.gtConfigFns;
    } // getConfigGetters

    function initSettings(target) {
        target.gtConfId = 'configurable' + (counter++);
        target.gtConfig = {};
        target.gtConfigFns = [];

        return target.gtConfig;
    } // initSettings

    /* define the param tweaker */

    COG.paramTweaker = function(params, getCallbacks, setCallbacks) {
        return function(name, value) {
            if (typeof value !== "undefined") {
                if (name in params) {
                    params[name] = value;
                } // if

                if (setCallbacks && (name in setCallbacks)) {
                    setCallbacks[name](name, value);
                } // if
            }
            else {
                return (getCallbacks && (name in getCallbacks)) ?
                    getCallbacks[name](name) :
                    params[name];
            } // if..else

            return undefined;
        };
    }; // paramTweaker

    /* define configurable */

    COG.configurable = function(target, configParams, callback, bindHelpers) {
        if (! target) { return; }

        if (! target.gtConfId) {
            initSettings(target);
        } // if

        var ii,
            targetId = target.gtConfId,
            targetSettings = getSettings(target),
            targetCallbacks = getConfigCallbacks(target);

        configurables[targetId] = target;

        targetCallbacks.push(callback);

        for (ii = configParams.length; ii--; ) {
            targetSettings[configParams[ii]] = true;

            if (bindHelpers) {
                attachHelper(target, configParams[ii]);
            } // if
        } // for

        if (! target.configure) {
            target.configure = function(name, value) {
                if (targetSettings[name]) {
                    for (var ii = targetCallbacks.length; ii--; ) {
                        var result = targetCallbacks[ii](name, value);
                        if (typeof result !== "undefined") {
                            return result;
                        } // if
                    } // for

                    return configurables[targetId];
                } // if

                return null;
            };
        } // if
    };
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
(function(){
    var counter = 0, head, query, key, window = this;

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

    COG.jsonp = function(url, callback, callbackParam) {
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
    }; // jsonp
}());

(function() {
    var BACK_S = 1.70158,
        HALF_PI = Math.PI / 2,
        TWO_PI = Math.PI * 2,
        ANI_WAIT = 1000 / 60 | 0,

        abs = Math.abs,
        pow = Math.pow,
        sin = Math.sin,
        asin = Math.asin,
        cos = Math.cos,

        tweenWorker = null,
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

    /* animation internals */

    function simpleTypeName(typeName) {
        return typeName.replace(/[\-\_\s\.]/g, '').toLowerCase();
    } // simpleTypeName

    /* tween exports */

    /**
    # COG.tweenValue
    */
    COG.tweenValue = function(startValue, endValue, fn, duration, callback) {

        var startTicks = new Date().getTime(),
            lastTicks = 0,
            change = endValue - startValue,
            tween = {};

        function runTween(tickCount) {
            tickCount = tickCount ? tickCount : new Date().getTime();

            if (lastTicks + ANI_WAIT < tickCount) {
                var elapsed = tickCount - startTicks,
                    updatedValue = fn(elapsed, startValue, change, duration),
                    complete = startTicks + duration <= tickCount,
                    cont = !complete,
                    retVal;

                if (callback) {
                    retVal = callback(updatedValue, complete, elapsed);

                    cont = typeof retVal != 'undefined' ? retVal && cont : cont;
                } // if

                if (cont) {
                    animFrame(runTween);
                } // if
            } // if
        } // runTween

        animFrame(runTween);

        return tween;
    }; // T5.tweenValue

    /**
    # COG.easing
    */
    var easing = COG.easing = function(typeName) {
        return easingFns[simpleTypeName(typeName)];
    }; // easing

    /**
    # COG.registerEasingType
    */
    COG.registerEasingType = function(typeName, callback) {
        easingFns[simpleTypeName(typeName)] = callback;
    }; // registerEasingType
})();

(function() {
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

    /* exports */

    var Duration = COG.Duration = function(days, seconds) {
        return {
            days: days ? days : 0,
            seconds: seconds ? seconds : 0
        };
    };

    /**
    ### addDuration(duration*)
    This function is used to return a new duration that is the sum of the duration
    values passed to the function.
    */
    var addDuration = COG.addDuration = function() {
        var result = new Duration();

        for (var ii = arguments.length; ii--; ) {
            result.days = result.days + arguments[ii].days;
            result.seconds = result.seconds + arguments[ii].seconds;
        } // for

        if (result.seconds >= DAY_SECONDS) {
            result.days = result.days + ~~(result.seconds / DAY_SECONDS);
            result.seconds = result.seconds % DAY_SECONDS;
        } // if

        return result;
    }; // increaseDuration

    /**
    ### formatDuration(duration)

    This function is used to format the specified duration as a string value

    #### TODO
    Add formatting options and i18n support
    */
    var formatDuration = COG.formatDuration = function(duration) {

        var days, hours, minutes, totalSeconds,
            output = '';

        if (duration.days) {
            output = duration.days + ' days ';
        } // if

        if (duration.seconds) {
            totalSeconds = duration.seconds;

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
    }; // formatDuration

    var parseDuration = COG.parseDuration = function(duration, format) {
        var parser = format ? durationParsers[format] : null;

        if (parser) {
            return parser(duration);
        }

        COG.Log.warn('Could not find duration parser for specified format: ' + format);
        return new Duration();
    }; // durationToSeconds
})();

COG.ObjectStore = function() {

    /* internals */

    var index = {},
        groups = {},
        objPrefix = 'obj_' + new Date().getTime(),
        objCounter = 0,
        hasOwn = Object.prototype.hasOwnProperty;

    /* exports */

    function add(object, group) {
        var objects;

        group = group ? group : 'default';

        if (object && object.constructor) {
            if (! hasOwn.call(object, 'id')) {
                object.id = objPrefix + (++objCounter);
            } // if
        } // if

        objects = groups[group] ? groups[group] : (groups[group] = []);

        index[object.id] = objects.length;

        objects[object.length] = object;
    } // add

    return {
        add: add
    };
};
var CANI = {};
(function(exports) {
    var tests = [],
        testIdx = 0,
        publishedResults = false;

    /* exports */

    var register = exports.register = function(section, runFn) {
        tests.push({
            section: section,
            run: runFn
        });
    };

    var init = exports.init = function(callback) {

        var tmpResults = {};

        function runCurrentTest() {
            if (testIdx < tests.length) {
                var test = tests[testIdx++];

                if (! tmpResults[test.section]) {
                    tmpResults[test.section] = {};
                } // if

                test.run(tmpResults[test.section], runCurrentTest);
            }
            else {
                for (var section in tmpResults) {
                    exports[section] = tmpResults[section];
                } // for

                publishedResults = true;

                if (callback) {
                    callback(exports);
                } // if
            } // if..else
        } // runCurrentTest

        if (publishedResults && callback) {
            callback(exports);
        }
        else {
            testIdx = 0;
            runCurrentTest();
        } // if..else
    }; // run

register('canvas', function(results, callback) {

    var testCanvas = document.createElement('canvas'),
        isFlashCanvas = typeof FlashCanvas != 'undefined',
        isExplorerCanvas = typeof G_vmlCanvasManager != 'undefnined';

    /* define test functions */

    function checkPointInPath() {
        var transformed,
            testContext = testCanvas.getContext('2d');

        testContext.save();
        try {
            testContext.translate(50, 50);

            testContext.beginPath();
            testContext.rect(0, 0, 20, 20);

            transformed = testContext.isPointInPath(10, 10);
        }
        finally {
            testContext.restore();
        } // try..finally

        return transformed;
    } // checkPointInPath

    /* initialise and run the tests */

    testCanvas.width = 200;
    testCanvas.height = 200;

    results.pipTransformed = isFlashCanvas || isExplorerCanvas ? false : checkPointInPath();

    callback();
});
})(CANI);

/**
# INTERACT
*/
INTERACT = (function() {
    var interactors = [];

var EventMonitor = function(target, handlers, params) {
    params = COG.extend({
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

    function deltaGreaterThan(value) {
        return Math.abs(totalDeltaX) > value || Math.abs(totalDeltaY) > value;
    } // deltaGreaterThan

    function handlePointerMove(evt, absXY, relXY, deltaXY) {
        totalDeltaX += deltaXY.x || 0;
        totalDeltaY += deltaXY.y || 0;
    } // handlePanMove

    function handlePointerDown(evt, absXY, relXY) {
        totalDeltaX = 0;
        totalDeltaY = 0;
    } // handlePointerDown

    function handlePointerUp(evt, absXY, relXY) {
        if (! deltaGreaterThan(MAXMOVE_TAP)) {
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
                COG.info('checking ' + checkKey + ' capability. require: ' + check + ', capability = ' + capabilities[checkKey]);

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
        interactors.push(COG.extend({
            handler: null,
            checks: {},
            type: typeName
        }, opts));
    } // register

    /**
    ### watch(target, opts, caps)
    */
    function watch(target, opts, caps) {
        opts = COG.extend({
            bindTarget: null,
            observable: null,
            isIE: typeof window.attachEvent != 'undefined',
            types: null
        }, opts);

        capabilities = COG.extend({
            touch: 'ontouchstart' in window
        }, caps);

        if (! opts.observable) {
            COG.info('creating observable');
            opts.observable = COG.observable({});
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
    opts = COG.extend({
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
        COG.info('captured double click');

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
                deltaY = evt.axis === 2 ? -evt.detail * WHEEL_DELTA_STEP : 0;
            }
            else {
                deltaY = evt.wheelDeltaY ? evt.wheelDeltaY : evt.wheelDelta;
                if (window.opera) {
                    deltaY = -deltaY;
                } // if
            } // if..else

            if (deltaY !== 0) {
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
    opts = COG.extend({
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

    COG.info('initialized touch handler');

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

var T5 = {};
(function(exports) {
    COG.observable(exports);

window.animFrame = (function() {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback){
                setTimeout(function() {
                    callback(new Date().getTime());
                }, 1000 / 60);
            };
})();

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

var indexOf = Array.prototype.indexOf || function(target) {
    for (var ii = 0; ii < this.length; ii++) {
        if (this[ii] === target) {
            return ii;
        } // if
    } // for

    return -1;
};
var TWO_PI = Math.PI * 2,
    HALF_PI = Math.PI / 2,
    PROP_WK_TRANSFORM = '-webkit-transform';

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

    proto = 'prototype',
    has = 'hasOwnProperty',
    isnan = {'NaN': 1, 'Infinity': 1, '-Infinity': 1},
    lowerCase = String[proto].toLowerCase,
    objectToString = Object[proto].toString,

    typeUndefined = 'undefined',
    typeFunction = 'function',
    typeString = 'string',
    typeObject = 'object',
    typeNumber = 'number',
    typeArray = 'array',

    supportTransforms = typeof document.body.style[PROP_WK_TRANSFORM] != 'undefined',

    reDelimitedSplit = /[\,\s]/;
/**
# T5.newCanvas(width, height)
*/
var newCanvas = T5.newCanvas = function(width, height) {
    var tmpCanvas = document.createElement('canvas');

    tmpCanvas.width = width ? width : 0;
    tmpCanvas.height = height ? height : 0;

    T5.trigger('createCanvas', tmpCanvas);

    return tmpCanvas;
};
/**
# T5.Generator
The generator module is used to manage the registration and creation
of generators.  Image generators, etc
*/
var Generator = (function() {

    var generatorRegistry = {};

    /* private internal functions */

    /* exports */

    function init(id, params) {
        var generatorType = generatorRegistry[id],
            generator;

        if (! generatorType) {
            throw new Error('Unable to locate requested generator: ' + id);
        } // if

        return new generatorType(params);
    } // init

    function register(id, creatorFn) {
        generatorRegistry[id] = creatorFn;
    } // register

    /* module definition */

    return {
        init: init,
        register: register
    };
})();
/**
# T5.Service
This is a module of Tile5 that supports registration of services that provide capabilities
to Tile5.  For instance an engine for a GIS backend might provide `route` or `geocode` service
*/
var Service = (function() {
    var registry = {};

    /* exports */

    /**
    ### find(serviceType)
    */
    function find(serviceType) {
        return (registry[serviceType] || [])[0];
    } // find

    /**
    ### register(serviceType, initFn)
    */
    function register(serviceType, initFn) {
        if (! registry[serviceType]) {
            registry[serviceType] = [];
        } // if

        registry[serviceType].push(initFn());
    } // register

    return {
        find: find,
        register: register
    };
})();


/**
# T5.XY (Internal Class)
The internal XY class is currently created by making a call to `T5.XY.init` rather than `new T5.XY`.
This will seem strange, and it is strange, and is a result of migrating from a closure based pattern
to a prototypal pattern in areas of the Tile5 library.

## Methods
*/
function XY(x, y) {
    this.x = x || 0;
    this.y = y || 0;
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

        return new XY(sumX, sumY);
    }, // add

    /**
    ### equals(xy)
    Return true if the two points are equal, false otherwise.  __NOTE:__ This function
    does not automatically floor the values so if the point values are floating point
    then floating point precision errors will likely occur.
    */
    equals: function(xy) {
        return this.x === xy.x && this.y === xy.y;
    }
};
function Rect(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = width || 0;
    this.h = height || 0;

    this.x2 = this.x + this.w;
    this.y2 = this.y + this.h;
} // Rect

Rect.prototype = {
    constructor: Rect
};
/**
# T5.XY
This module contains simple functions for creating and manipulating an object literal that
contains an `x` and `y` value.  Previously this functionaliy lived in the T5.V module but has
been moved to communicate it's more generic implementation.  The T5.V module still exists, however,
and also exposes the functions of this module for the sake of backward compatibility.
*/
var XYFns = (function() {
    /* internal functions */

    /* exports */

    /**
    ### add(xy*)
    Return a new xy composite that is the value of all the xy values added together.
    */
    function add() {
        var sumX = 0, sumY = 0;
        for (var ii = arguments.length; ii--; ) {
            sumX += arguments[ii].x;
            sumY += arguments[ii].y;
        } // for

        return init(sumX, sumY);
    } // add

    /**
    ### absSize(vector)
    */
    function absSize(xy) {
        return max(abs(xy.x), abs(xy.y));
    } // absSize

    /**
    ### copy(src)
    Return a new xy composite that is a copy of the one passed to the function
    */
    function copy(src) {
        return src ? init(src.x, src.y) : null;
    } // copy

    /**
    ### diff(pt1, pt2)
    Return a point that is difference between the x and y values of `xy1` and `xy2`.
    */
    function difference(xy1, xy2) {
        return init(xy1.x - xy2.x, xy1.y - xy2.y);
    } // difference

    /**
    ### distance(xy*)
    Return the total euclidean distance between all the xy values passed to the
    function.
    */
    function distance(xy, count) {
        return edges(xy, count).total;
    } // distance

    /**
    ### edges(points, count)
    */
    function edges(points, count) {
        count = count || points.length;
        if (count <= 1) {
            return null;
        } // if

        var edgeData = new Array(count - 1),
            accrued = new Array(count - 1),
            total = 0,
            diff;

        for (var ii = 0; ii < count - 1; ii++) {
            diff = difference(points[ii], points[ii + 1]);

            edgeData[ii] = sqrt(diff.x * diff.x + diff.y * diff.y);

            accrued[ii] = total += edgeData[ii];
        } // for

        return {
            edges: edgeData,
            accrued: accrued,
            tota: total
        };
    } // edges

    /**
    ### equals(pt1, pt2)
    Return true if the two points are equal, false otherwise.  __NOTE:__ This function
    does not automatically floor the values so if the point values are floating point
    then floating point precision errors will likely occur.
    */
    function equals(pt1, pt2) {
        return pt1.equals(pt2);
    } // equals

    /**
    ### extendBy(xy, theta, delta)
    */
    function extendBy(xy, theta, delta) {
        var xDelta = cos(theta) * delta | 0,
            yDelta = sin(theta) * delta | 0;

        return init(xy.x - xDelta, xy.y - yDelta);
    } // extendBy

    /**
    ### floor(pt*)
    This function is used to take all the points in the array and convert them to
    integer values
    */
    function floorXY(points) {
        var results = new Array(points.length);
        for (var ii = points.length; ii--; ) {
            results[ii] = init(points[ii].x | 0, points[ii].y | 0);
        } // for

        return results;
    } // floor

    /**
    ### getRect(xy*)
    Get a XYRect composite that is large enough to contain the xy values passed
    to the function.
    */
    function getRect(points) {
        var minX, minY, maxX, maxY;

        for (var ii = points.length; ii--; ) {
            var xy = points[ii];

            minX = isType(minX, typeUndefined) || xy.x < minX ? xy.x : minX;
            minY = isType(minY, typeUndefined) || xy.y < minY ? xy.y : minY;

            maxX = isType(maxX, typeUndefined) || xy.x > maxX ? xy.x : maxX;
            maxY = isType(maxY, typeUndefined) || xy.y > maxY ? xy.y : maxY;
        } // for

        return new Rect(minX, minY, maxX - minX, maxY - minY);
    } // getRect

    /**
    ### init(x, y)
    Initialize a new point that can be used in Tile5.  A point is simply an
    object literal with the attributes `x` and `y`.  If initial values are passed
    through when creating the point these will be used, otherwise 0 values will
    be used.
    */
    function init(initX, initY) {
        return new XY(initX, initY);
    } // init

    /**
    ### invert(xy)
    Return a new composite xy value that is the inverted value of the one passed
    to the function.
    */
    function invert(xy) {
        return init(-xy.x, -xy.y);
    } // invert

    /**
    ### max(xy1, xy2)
    */
    function maxXY(xy1, xy2) {
        return init(
            xy1.x > xy2.x ? xy1.x : xy2.x,
            xy1.y > xy2.y ? xy1.y : xy2.y);
    } // max

    /**
    ### min(xy1, xy2)
    */
    function minXY(xy1, xy2) {
        return init(
            xy1.x < xy2.x ? xy1.x : xy2.x,
            xy1.y < xy2.y ? xy1.y : xy2.y);
    } // min

    /**
    ### offset(xy, offsetX, offsetY)
    Return a new composite xy which is offset by the specified amount.
    */
    function offset(xy, offsetX, offsetY) {
        return init(xy.x + offsetX, xy.y + (offsetY || offsetX));
    } // offset

    /**
    ### scale(xy, scaleFactor)
    Returns a new composite xy that has been scaled by the specified scale factor
    */
    function scale(xy, scaleFactor) {
        return init(xy.x / scaleFactor | 0, xy.y / scaleFactor | 0);
    } // scale

    /**
    ### simplify(xy*, generalization)
    This function is used to simplify a xy array by removing what would be considered
    'redundant' xy positions by elimitating at a similar position.
    */
    function simplify(points, generalization) {
        if (! points) {
            return null;
        } // if

        generalization = generalization ? generalization : XYFns.VECTOR_SIMPLIFICATION;

        var tidied = [],
            last = null;

        for (var ii = points.length; ii--; ) {
            var current = points[ii];

            include = !last || ii === 0 ||
                (abs(current.x - last.x) +
                    abs(current.y - last.y) >
                    generalization);

            if (include) {
                tidied.unshift(current);
                last = current;
            }
        } // for

        return tidied;
    } // simplify

    /**
    ### theta (xy1, xy2, distance)
    */
    function theta(xy1, xy2, distance) {
        var theta = asin((xy1.y - xy2.y) / distance);
        return xy1.x > xy2.x ? theta : Math.PI - theta;
    } // theta

    /**
    ### toString(xy)
    Return the string representation of the xy
    */
    function toString(xy) {
        return xy ? xy.x + ', ' + xy.y : '';
    } // toString

    /* module export */

    return {
        VECTOR_SIMPLIFICATION: 3,
        SIMPLIFICATION_MIN_VECTORS: 25,

        add: add,
        absSize: absSize,
        copy: copy,
        diff: difference,
        distance: distance,
        edges: edges,
        equals: equals,
        extendBy: extendBy,
        floor: floorXY,
        getRect: getRect,
        init: init,
        invert: invert,
        min: minXY,
        max: maxXY,
        offset: offset,
        scale: scale,
        simplify: simplify,
        theta: theta,
        toString: toString
    };
})();
/**
# T5.Vector
This module defines functions that are used to maintain T5.Vector objects and this
is removed from the actual Vector class to keep the Vector object lightweight.

## Functions
*/
var Vector = (function() {

    /* exports */

    function dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    } // dotProduct

    /*
    This method implements the Ramer–Douglas–Peucker algorithm for simplification instead.
    */
    function simplifyRDP(vectors, epsilon) {
        if ((! vectors) || (vectors.length <= 2)) {
            return vectors;
        } // if

        epsilon = epsilon ? epsilon : XYFns.VECTOR_SIMPLIFICATION;

        var distanceMax = 0,
            index = 0,
            lastIndex = vectors.length - 1,
            u,
            tailItem,
            results;

        u = unitize(vectors[0], vectors[lastIndex]);

        for (var ii = 1; ii < lastIndex; ii++) {
            var diffVector = difference(vectors[ii], vectors[0]),
                orthDist = dotProduct(diffVector, u);

            if (orthDist > distanceMax) {
                index = ii;
                distanceMax = orthDist;
            } // if
        } // for

        COG.info('max distance = ' + distanceMax + ', unitized distance vector = ', u);

        if (distanceMax >= epsilon) {
            var r1 = simplify(vectors.slice(0, index), epsilon),
                r2 = simplify(vectors.slice(index, lastIndex), epsilon);

            results = r1.slice(0, -1).concat(r2);
        }
        else {
            results = vectors;
        } // if..else

        if (tailItem) {
            results[results.length] = tailItem;
        } // if

        return results;
    } // simplify

    function unitize(v1, v2) {
        var unitLength = edges([v1, v2]).total,
            absX = unitLength !== 0 ? (v2.x - v1.x) / unitLength : 0,
            absY = unitLength !== 0 ? (v2.y - v1.y) / unitLength : 0;

        return new XY(absX, absY);
    } // unitize

    /* define module */

    return {
        dotProduct: dotProduct
    };
})(); // vectorTools
/**
# T5.XYRect
This module provides helper functions for working with an object literal that represents a set of xy
values that represent the top-left and bottom-right corners of a rectangle respectively.

## XYRect Attributes
Calling the `T5.XYRect.init` function produces an object literal with the following
properties:


- `x1` - The x value for the top left corner
- `y1` - The y value for the top left corner
- `x2` - The x value for the bottom right corner
- `y2` - The y value for the bottom right corner
- `width` - The width of the rect
- `height` - The height of the rect


## Functions
*/
var XYRect = (function() {

    /* exports */

    /**
    ### buffer(rect, bufferX, bufferY)
    */
    function buffer(rect, bufferX, bufferY) {
        return XYRect.init(
            rect.x - bufferX,
            rect.y - (bufferY || bufferX),
            rect.x2 + bufferX,
            rect.y2 + (bufferY || bufferX)
        );
    } // buffer

    /**
    ### center(rect)
    Return a xy composite for the center of the rect
    */
    function center(rect) {
        return new XY(rect.x + (rect.w >> 1), rect.y + (rect.h >> 1));
    } // center

    /**
    ### copy(rect)
    Return a duplicate of the XYRect
    */
    function copy(rect) {
        return init(rect.x, rect.y, rect.x2, rect.y2);
    } // copy

    /**
    ### diagonalSize(rect)
    Return the distance from corner to corner of the rect
    */
    function diagonalSize(rect) {
        return sqrt(rect.w * rect.w + rect.h * rect.h);
    } // diagonalSize

    /**
    ### fromCenter(centerX, centerY, width, height)
    An alternative to the `init` function, this function can create a T5.XYRect
    given a center x and y position, width and height.
    */
    function fromCenter(centerX, centerY, width, height) {
        var halfWidth = width >> 1,
            halfHeight = height >> 1;

        return init(
            centerX - halfWidth,
            centerY - halfHeight,
            centerX + halfWidth,
            centerY + halfHeight);
    } // fromCenter

    /**
    ### init(x1, y1, x2, y2)
    Create a new XYRect composite object
    */
    function init(x1, y1, x2, y2) {
        return new Rect(x1, y1, (x2 || x1) - x1, (y2 || y1) - y1);
    } // init

    /**
    ### intersect(rect1, rect2)
    Returns the intersecting rect between the two specified XYRect composites
    */
    function intersect(rect1, rect2) {
        var x1 = max(rect1.x, rect2.x),
            y1 = max(rect1.y, rect2.y),
            x2 = min(rect1.x2, rect2.x2),
            y2 = min(rect1.y2, rect2.y2),
            r = init(x1, y1, x2, y2);

        return ((r.w > 0) && (r.h > 0)) ? r : null;
    } // intersect

    /**
    ### toString(rect)
    Return the string representation of the rect
    */
    function toString(rect) {
        return rect ? ('[' + rect.x + ', ' + rect.y + ', ' + rect.x2 + ', ' + rect.y2 + ']') : '';
    } // toString

    /**
    ### union(rect1, rect2)
    Return the minimum rect required to contain both of the supplied rects
    */
    function union(rect1, rect2) {
        if (rect1.w === 0 || rect1.h === 0) {
            return copy(rect2);
        }
        else if (rect2.w === 0 || rect2.h === 0) {
            return copy(rect1);
        }
        else {
            var x1 = min(rect1.x, rect2.x),
                y1 = min(rect1.y, rect2.y),
                x2 = max(rect1.x2, rect2.x2),
                y2 = max(rect1.y2, rect2.y2),
                r = init(x1, y1, x2, y2);

            return ((r.w > 0) && (r.h > 0)) ? r : null;
        } // if..else
    } // union

    /* module definition */

    return {
        buffer: buffer,
        center: center,
        copy: copy,
        diagonalSize: diagonalSize,
        fromCenter: fromCenter,
        init: init,
        intersect: intersect,
        toString: toString,
        union: union
    };
})();
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
    function init(hitType, absXY, relXY, scaledXY) {
        return {
            type: hitType,
            x: scaledXY.x | 0,
            y: scaledXY.y | 0,
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
            new XY(hitData.x, hitData.y)
        );
    } // triggerEvent

    /* define the module */

    return {
        diffHits: diffHits,
        init: init,
        initHit: initHit,
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
        lookup = {};

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

        id = id || data.id || COG.objId('spatial');

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
                        itemIndex = indexOf.call(bucket, id);

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
        copyInto: copyInto,
        insert: insert,
        remove: remove,
        search: search
    };
};
function createEl(elemType, id, css) {
    var elem = document.createElement(elemType);

    elem.id = id;
    elem.style.cssText = css || '';

    return elem;
} // createEl

function moveEl(element, x, y) {
    if (supportTransforms) {
        element.style[PROP_WK_TRANSFORM] = 'translate3d(' + x +'px, ' + y + 'px, 0px)';
    }
    else {
        element.style.left = x + 'px';
        element.style.top = y + 'px';
    } // if..else
} // moveEl

var INTERVAL_LOADCHECK = 10,
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

    if (loadingUrls.length > 0) {
        animFrame(checkImageLoads);
    } // if
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


    animFrame(checkImageLoads);
} // loadImage

/**
# T5.getImage(url, callback)
This function is used to load an image and fire a callback when the image
is loaded.  The callback fires when the image is _really_ loaded (not
when the onload event handler fires).
*/
function getImage(url, callback) {
    var image = url && callback ? imageCache[url] : null;

    if (image && isLoaded(image)) {
        callback(image);
    }
    else {
        loadImage(url, callback);
    } // if..else
};
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

        checkSize: function() {
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
        ### getOffset()
        */
        getOffset: function() {
            return new XY();
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
        ### prepare(layers, state, tickCount, hitData)
        */
        prepare: function(layers, state, tickCount, hitData) {
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

    return COG.observable(_this);
};

var rendererRegistry = {};

/**
# T5.registerRenderer(id, creatorFn)
*/
var registerRenderer = exports.registerRenderer = function(id, creatorFn) {
    rendererRegistry[id] = creatorFn;
};

/**
# T5.attachRenderer(id, view, container, params)
*/
var attachRenderer = exports.attachRenderer = function(id, view, container, outer, params) {
    var ids = id.split('/'),
        renderer = new Renderer(view, container, outer, params);

    for (var ii = 0; ii < ids.length; ii++) {
        var rClass = rendererRegistry[ids[ii]];
        if (rClass) {
            renderer = new rClass(view, container, outer, params, renderer);
        } // if
    } // for

    return renderer;
};
/**
# Tile5 Renderer: Canvas
*/
registerRenderer('canvas', function(view, panFrame, container, params, baseRenderer) {
    params = COG.extend({
    }, params);

    /* internals */

    var vpWidth,
        vpHeight,
        canvas,
        createdCanvas = false,
        context,
        drawOffsetX = 0,
        drawOffsetY = 0,
        styleFns = {},
        transform = null,
        pipTransformed = CANI.canvas.pipTransformed,
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

    function createCanvas() {
        if (panFrame) {
            vpWidth = panFrame.offsetWidth;
            vpHeight = panFrame.offsetHeight;

            canvas = newCanvas(vpWidth, vpHeight);
            canvas.style.cssText = 'position: absolute; z-index: 1;';

            view.attachFrame(canvas, true);

            context = null;
        } // if
    } // createCanvas

    function getPreviousStyle(canvasId) {
        if (! previousStyles[canvasId]) {
            previousStyles[canvasId] = [];
        } // if

        return previousStyles[canvasId].pop() || 'basic';
    } // getPreviousStyle

    function handleDetach() {
        panFrame.removeChild(canvas);
    } // handleDetach

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

    function initDrawData(viewport, hitData, state, drawFn) {
        var isHit = false;

        if (hitData) {
            var hitX = pipTransformed ? hitData.x - drawOffsetX : hitData.relXY.x,
                hitY = pipTransformed ? hitData.y - drawOffsetY : hitData.relXY.y;

            isHit = context.isPointInPath(hitX, hitY);
        } // if

        return {
            draw: drawFn || defaultDrawFn,
            viewport: viewport,
            state: state,
            hit: isHit,
            vpX: drawOffsetX,
            vpY: drawOffsetY,

            context: context
        };
    } // initDrawData

    function loadStyles() {
        for (var styleId in T5.styles) {
            handleStyleDefined(null, styleId, T5.styles[styleId]);
        } // for

        T5.bind('styleDefined', handleStyleDefined);
    } // loadStyles

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

    function drawTiles(viewport, tiles) {
        var tile,
            inViewport,
            minX = drawOffsetX - 256,
            minY = drawOffsetY - 256,
            maxX = viewport.x2,
            maxY = viewport.y2;

        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];

            inViewport = tile.x >= minX && tile.x <= maxX &&
                tile.y >= minY && tile.y <= maxY;

            if (inViewport) {
                if (! tile.loaded) {
                    tile.load(view.invalidate);
                }
                else {
                    context.drawImage(
                        tile.image,
                        tile.x - drawOffsetX,
                        tile.y - drawOffsetY);
                } // if..else
            } // if
        } // for
    } // drawTiles

    function prepare(layers, viewport, state, tickCount, hitData) {
        var ii,
            canClip = false,
            targetVP = viewport.scaled || viewport,
            scaleFactor = viewport.scaleFactor;

        if (context) {
            context.restore();
        }
        else {
            context = canvas.getContext('2d');
        } // if..else

        for (ii = layers.length; ii--; ) {
            canClip = canClip || layers[ii].clip;
        } // for

        drawOffsetX = targetVP.x;
        drawOffsetY = targetVP.y;

        if (context) {
            if (! canClip) {
                context.clearRect(0, 0, vpWidth, vpHeight);
            } // if

            context.save();

            context.scale(scaleFactor, scaleFactor);
        } // if

        context.globalCompositeOperation = 'source-over';

        return context;
    } // prepare

    /**
    ### prepArc(drawable, viewport, hitData, state, opts)
    */
    function prepArc(drawable, viewport, hitData, state, opts) {
        context.beginPath();
        context.arc(
            drawable.xy.x - (transform ? transform.x : drawOffsetX),
            drawable.xy.y - (transform ? transform.y : drawOffsetY),
            drawable.size >> 1,
            drawable.startAngle,
            drawable.endAngle,
            false
        );

        return initDrawData(viewport, hitData, state);
    } // prepArc

    /**
    ### prepImage(drawable, viewport, hitData, state, opts)
    */
    function prepImage(drawable, viewport, hitData, state, opts) {
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

            return initDrawData(viewport, hitData, state, function(drawData) {
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
    ### prepMarker(drawable, viewport, hitData, state, opts)
    */
    function prepMarker(drawable, viewport, hitData, state, opts) {
        var markerX = drawable.xy.x - (transform ? transform.x : drawOffsetX),
            markerY = drawable.xy.y - (transform ? transform.y : drawOffsetY),
            size = drawable.size,
            drawOverride = undefined;

        context.beginPath();

        switch (drawable.markerStyle.toLowerCase()) {
            case 'image':
                drawOverride = drawNothing;

                context.rect(
                    markerX - (size >> 1),
                    markerY - (size >> 1),
                    size,
                    size);

                if (drawable.reset && drawable.image) {
                    drawable.image = null;
                    drawable.reset = false;
                } // if

                if (drawable.image) {
                    context.drawImage(
                        drawable.image,
                        markerX - (size >> 1),
                        markerY - (size >> 1),
                        size,
                        size
                    );
                }
                else {
                    getImage(drawable.imageUrl, function(image) {
                        drawable.image = image;

                        context.drawImage(
                            drawable.image,
                            markerX - (size >> 1),
                            markerY - (size >> 1),
                            size,
                            size
                        );
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

        return initDrawData(viewport, hitData, state, drawOverride);
    } // prepMarker

    /**
    ### prepPoly(drawable, viewport, hitData, state, opts)
    */
    function prepPoly(drawable, viewport, hitData, state, opts) {
        var first = true,
            points = opts.points || drawable.points,
            offsetX = transform ? transform.x : drawOffsetX,
            offsetY = transform ? transform.y : drawOffsetY;

        context.beginPath();

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

        return initDrawData(viewport, hitData, state);
    } // prepPoly

    /* initialization */

    createCanvas();

    var _this = COG.extend(baseRenderer, {
        applyStyle: applyStyle,
        applyTransform: applyTransform,

        drawTiles: drawTiles,

        prepare: prepare,

        prepArc: prepArc,
        prepImage: prepImage,
        prepMarker: prepMarker,
        prepPoly: prepPoly,

        getContext: function() {
            return context;
        }


        /*
        render: function(viewport) {
            context.strokeStyle = '#F00';
            context.moveTo(0, viewport.h >> 1);
            context.lineTo(viewport.w, viewport.h >> 1);
            context.moveTo(viewport.w >> 1, 0);
            context.lineTo(viewport.w >> 1, viewport.h);
            context.stroke();
        }
        */
    });

    loadStyles();

    _this.bind('detach', handleDetach);

    return _this;
});
registerRenderer('dom', function(view, panFrame, container, params, baseRenderer) {

    /* internals */

    var ID_PREFIX = 'tile_',
        PREFIX_LENGTH = ID_PREFIX.length,
        imageDiv = null,
        activeTiles = {},
        currentTiles = {};

    function createImageContainer() {
        imageDiv = createEl(
            'div',
            COG.objId('domImages'),
            COG.formatStr(
                '-webkit-user-select: none; position: absolute; width: {0}px; height: {1}px;',
                panFrame.offsetWidth,
                panFrame.offsetHeight)
        );

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

        image.src = tile.url;
        image.onload = function() {
            if (currentTiles[tile.id]) {
                imageDiv.appendChild(this);
            }
            else {
                tile.image = null;
            } // if..else
        };

        image.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';

        return image;
    }

    function handleDetach() {
        panFrame.removeChild(imageDiv);
    } // handleDetach

    function handlePredraw(evt, viewport, state) {

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

    function drawTiles(viewport, tiles) {
        var tile,
            image,
            offsetX = viewport.x,
            offsetY = viewport.y;

        for (var ii = tiles.length; ii--; ) {
            tile = tiles[ii];

            if (tile.url) {
                image = tile.image || createTileImage(tile);
                moveEl(image, tile.x - offsetX, tile.y - offsetY);

                currentTiles[tile.id] = tile;
            } // if
        } // for
    } // drawTiles

    /* initialization */

    createImageContainer();

    var _this = COG.extend(baseRenderer, {
        drawTiles: drawTiles
    });

    _this.bind('predraw', handlePredraw);
    _this.bind('detach', handleDetach);
    _this.bind('reset', handleReset);

    return _this;
});

var styleRegistry = exports.styles = {};

/**
# T5.defineStyle(id, data)
*/
var defineStyle = exports.defineStyle = function(id, data) {
    styleRegistry[id] = data;

    exports.trigger('styleDefined', id, styleRegistry[id]);

    return id;
};

/**
# T5.defineStyles(data)
*/
var defineStyles = exports.defineStyles = function(data) {
    for (var styleId in data) {
        defineStyle(styleId, data[styleId]);
    } // for
};

/**
# T5.getStyle(id)
*/
var getStyle = exports.getStyle = function(id) {
    return styleRegistry[id];
}; // getStyle

/**
# T5.loadStyles(path, callback)
*/
var loadStyles = exports.loadStyles = function(path) {
    COG.jsonp(path, function(data) {
        defineStyles(data);
    });
}; // loadStyles


defineStyles({
    basic: {
        fill: '#ffffff'
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
var viewStates = {
    NONE: 0,
    ACTIVE: 1,
    ANIMATING: 4,
    PAN: 8,
    ZOOM: 16,
    FREEZE: 128
};

/**
# T5.viewState
The T5.viewState function is used to return the value of the view state requested of the function.  The
function supports a request for multiple different states and in those cases, returns a bitwise-or of the
states.

## View State Bitwise Values

- NONE = 0
- ACTIVE = 1
- _UNUSED_ = 2
- ANIMATING = 4
- PAN = 8
- ZOOM = 16
- _UNUSED_ = 32
- _UNUSED_ = 64
- FREEZE = 128


## Example Usage
~ // get the active state
~ var stateActive = T5.viewState('active');
~
~ // get the bitmask for a view state of active or panning
~ var stateActivePan = T5.viewState('active', 'pan');
~
~ // add the animating state to the stateActivePan variable
~ stateActivePan = stateActivePan | T5.viewState('animating');

~ // now test whether the updated state is still considered activate
~ if ((stateActive & stateActivePan) !== 0) {
~     // yep, we are active
~ } // if
*/
function viewState() {
    var result = 0;

    for (var ii = arguments.length; ii--; ) {
        var value = viewStates[arguments[ii].toUpperCase()];
        if (value) {
            result = result | value;
        } // if
    } // for

    return result;
} // viewState
/**
# T5.View
The View is the fundamental building block for tiling and
mapping interface.  Which this class does not implement any of
the logic required for tiling, it does handle the redraw logic.
Applications implementing Tile5 maps will not need to be aware of
the implementation specifics of the View, but for those interested
in building extensions or customizations should definitely take a look.
Additionally, it is worth being familiar with the core methods that
are implemented here around the layering as these are used extensively
when creating overlays and the like for the map implementations.

## Constructor

<pre>
var view = new T5.View(params);
</pre>

#### Initialization Parameters

- `container` (required)

- `id`

- `captureHover` - whether or not hover events should be intercepted by the View.
If you are building an application for mobile devices then you may want to set this to
false, but it's overheads are minimals given no events will be generated.

- `inertia`

- `pannable`

- `scalable`

- `fps` - (int, default = 25) - the frame rate of the view, by default this is set to
25 frames per second but can be increased or decreased to compensate for device
performance.  In reality though on slower devices, the framerate will scale back
automatically, but it can be prudent to set a lower framerate to leave some cpu for
other processes :)

## Events

### tapHit
This event is fired when the view has been tapped (or the left
mouse button has been pressed)
<pre>
view.bind('tapHit', function(evt, elements, absXY, relXY, offsetXY) {
});
</pre>

- elements ([]) - an array of elements that were "hit"
- absXY (T5.Vector) - the absolute position of the tap
- relXY (T5.Vector) - the position of the tap relative to the top left position of the view.
- gridXY (T5.Vector) - the xy coordinates of the tap relative to the scrolling grid offset.


### hoverHit
As per the tapHit event, but triggered through a mouse-over event.

### refresh
This event is fired once the view has gone into an idle state or every second
(configurable).
<pre>
view.bind('refresh', function(evt) {
});
</pre>

### drawComplete
Triggered when drawing the view has been completed (who would have thought).
<pre>
view.bind('drawComplete', function(evt, viewport, tickCount) {
});
</pre>

- viewport - the current viewport of the view
- tickCount - the tick count at the start of the draw operation.


### enterFrame
Triggered on the view cycling.
<pre>
view.bind('enterFrame', function(evt, tickCount, frameData) {
});
</pre>

### zoomLevelChange
Triggered when the zoom level of the view has changed.  Given that Tile5 was primarily
built to serve as a mapping platform zoom levels are critical to the design so a view
has this functionality.

<pre>
view.bind('zoomLevelChange', function(evt, zoomLevel) {
});
</pre>

- zoomLevel (int) - the new zoom level


## Methods
*/
var View = function(params) {
    params = COG.extend({
        id: COG.objId('view'),
        container: "",
        captureHover: true,
        fastpan: false,
        fastpanPadding: 128,
        inertia: true,
        refreshDistance: 256,
        pannable: false,
        scalable: false,
        fps: 60,

        minZoom: 1,
        maxZoom: 1,
        renderer: 'canvas',
        zoomLevel: 1
    }, params);

    var TURBO_CLEAR_INTERVAL = 500,

        caps = {},
        layers = [],
        layerCount = 0,
        viewpane = null,
        panContainer = null,
        outer,
        dragObject = null,
        mainContext = null,
        isIE = !isType(window.attachEvent, typeUndefined),
        hitFlagged = false,
        fastpan = true,
        pointerDown = false,
        dx = 0, dy = 0,
        totalDX = 0,
        totalDY = 0,
        refreshDist = params.refreshDistance,
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
        padding = params.fastpan ? params.fastpanPadding : 0,
        panFrames = [],
        hitData = null,
        interacting = false,
        lastHitData = null,
        resizeCanvasTimeout = 0,
        scaleFactor = 1,
        lastScaleFactor = 1,
        lastCycleTicks = 0,
        eventMonitor = null,
        frameData = {
            index: 0,
            draw: false
        },
        partialScaling = false,
        tweeningOffset = false, // TODO: find a better way to determine this than with a flag
        cycleDelay = 1000 / params.fps | 0,
        viewChanges = 0,
        width, height,
        halfWidth, halfHeight,
        zoomX, zoomY,
        zoomLevel = params.zoomLevel,
        zoomEasing = COG.easing('quad.out'),
        zoomDuration = 300,

        /* state shortcuts */

        stateActive = viewState('ACTIVE'),
        statePan = viewState('PAN'),
        stateZoom = viewState('ZOOM'),
        stateAnimating = viewState('ANIMATING'),

        state = stateActive;

    /* event handlers */

    /* scaling functions */

    function handleZoom(evt, absXY, relXY, scaleChange, source) {
        scale(min(max(scaleFactor + pow(2, scaleChange) - 1, 0.5), 2));
    } // handleWheelZoom

    function scaleView() {
        var scaleFactorExp = log(scaleFactor) / Math.LN2 | 0;

        if (scaleFactorExp !== 0) {
            scaleFactor = pow(2, scaleFactorExp);
            setZoomLevel(zoomLevel + scaleFactorExp, zoomX, zoomY);
        }

        redraw = true;
    } // scaleView

    function setZoomCenter(xy) {
    } // setZoomCenter

    function getProjectedXY(srcX, srcY) {
        var projectedXY = renderer && renderer.projectXY ? renderer.projectXY(srcX, srcY) : null;

        if (! projectedXY) {
            var viewport = _self.getViewport(),
                invScaleFactor = 1 / scaleFactor,
                scaledX = viewport ? (viewport.x + srcX * invScaleFactor) : srcX,
                scaledY = viewport ? (viewport.y + srcY * invScaleFactor) : srcY;

            projectedXY = new XY(scaledX, scaledY);
        } // if

        return projectedXY;
    } // getProjectedXY

    function handleDoubleTap(evt, absXY, relXY) {
        triggerAll(
            'doubleTap',
            absXY,
            relXY,
            getProjectedXY(relXY.x, relXY.y));

        if (params.scalable) {
            scale(
                2,
                getProjectedXY(relXY.x, relXY.y),
                zoomEasing,
                null,
                zoomDuration);
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
            dx = deltaXY.x;
            dy = deltaXY.y;
        } // if
    } // handlePointerMove

    function handlePointerUp(evt, absXY, relXY) {
        dragSelected(absXY, relXY, true);
        pointerDown = false;
    } // handlePointerUp

    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(function() {
            renderer.checkSize();
        }, 250);
    } // handleResize

    function handleResync(evt, view) {
    } // handleResync

    function handlePointerTap(evt, absXY, relXY) {
        initHitData('tap', absXY, relXY);

        triggerAll('tap', absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));
    } // handlePointerTap

    /* private functions */

    function createRenderer(typeName) {
        renderer = attachRenderer(typeName || params.renderer, _self, viewpane, outer, params);

        fastpan = params.fastpan && renderer.fastpan;

        captureInteractionEvents();
    } // createRenderer

    function addLayer(id, value) {
        value.id = id;
        value.added = ticks();

        value.view = _self;
        value.trigger('parentChange', _self, viewpane, mainContext);

        layers.push(value);

        layers.sort(function(itemA, itemB) {
            var result = itemB.zindex - itemA.zindex;
            if (result === 0) {
                result = itemB.added - itemA.added;
            } // if

            return result;
        });

        layerCount = layers.length;
        return value;
    } // addLayer

    function captureInteractionEvents() {
        if (eventMonitor) {
            eventMonitor.unbind();
        } // if

        if (renderer) {
            eventMonitor = INTERACT.watch(renderer.interactTarget || viewpane);

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

    function changeRenderer(name, value) {
        if (renderer) {
            renderer.trigger('detach');
            renderer = null;
        } // if

        createRenderer(value);

        invalidate();
    } // changeRenderer

    /*
    The constrain offset function is used to keep the view offset within a specified
    offset using wrapping if allowed.  The function is much more 'if / then / elsey'
    than I would like, and might be optimized at some stage, but it does what it needs to
    */
    function constrainOffset(viewport, allowWrap) {
        if (! viewport) {
            return;
        } // if

        var testX = offsetWrapX ? offsetX + (viewport.w >> 1) : offsetX,
            testY = offsetWrapY ? offsetY + (viewport.h >> 1) : offsetY,
            viewWidth = viewport.w,
            viewHeight = viewport.h;

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
                invalidate();
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

        return -1;
    } // getLayerIndex

    function initContainer() {
        outer.appendChild(panContainer = createEl(
            'div',
            COG.objId('t5_container'),
            COG.formatStr(
                '-webkit-user-select: none; position: absolute; overflow: hidden; width: {0}px; height: {1}px;',
                outer.offsetWidth,
                outer.offsetHeight
            )
        ));

        width = panContainer.offsetWidth + padding * 2;
        height = panContainer.offsetHeight + padding * 2;
        halfWidth = width / 2;
        halfHeight = height / 2;

        panContainer.appendChild(viewpane = createEl(
            'div',
            COG.objId('t5_view'),
            COG.formatStr(
                '-webkit-user-select: none; position: absolute; width: {0}px; height: {1}px; margin: {2}px 0 0 {2}px;',
                width,
                height,
                -padding)
            )
        );
    } // initContainer

    function updateContainer(name, value) {
        initContainer(outer = document.getElementById(value));
        createRenderer();
    } // updateContainer

    /* draw code */

    /*
    ### checkHits
    */
    function checkHits() {
        var elements = hitData ? hitData.elements : [],
            ii;

        if (lastHitData && lastHitData.type === 'hover') {
            var diffElements = Hits.diffHits(lastHitData.elements, elements);

            if (diffElements.length > 0) {
                Hits.triggerEvent(lastHitData, _self, 'Out', diffElements);
            } // if
        } // if

        if (elements.length > 0) {
            var downX = hitData.x,
                downY = hitData.y;

            for (ii = elements.length; ii--; ) {
                if (dragStart(elements[ii], downX, downY)) {
                    break;
                } // if
            } // for

            Hits.triggerEvent(hitData, _self);
        } // if

        lastHitData = elements.length > 0 ? COG.extend({}, hitData) : null;
    } // checkHits

    function cycle(tickCount) {
        var redrawBG,
            panning,
            scaleChanged,
            newFrame = false,
            viewport,
            deltaEnergy = abs(dx) + abs(dy);

        tickCount = tickCount || new Date().getTime();

        newFrame = tickCount - lastCycleTicks > cycleDelay;

        if (newFrame) {
            var refreshXDist = abs(offsetX - refreshX),
                refreshYDist = abs(offsetY - refreshY);

            panning = deltaEnergy > 0;
            scaleChanged = scaleFactor !== lastScaleFactor;

            if (panning || scaleChanged) {
                viewChanges++;
            } // if

            if ((deltaEnergy < 2) && (refreshXDist >= refreshDist || refreshYDist >= refreshDist)) {
                refresh();
            } // if

            frameData.index++;
            frameData.draw = viewChanges || deltaEnergy || totalDX || totalDY;

            _self.trigger('enterFrame', tickCount, frameData);

            lastCycleTicks = tickCount;
        }

        if (renderer && newFrame && frameData.draw) {
            state = stateActive |
                        (scaleFactor !== 1 ? stateZoom : 0) |
                        (panning ? statePan : 0) |
                        (tweeningOffset ? stateAnimating : 0);

            redrawBG = (state & (stateZoom | statePan)) !== 0;
            interacting = redrawBG && (state & stateAnimating) === 0;

            panX += dx;
            panY += dy;

            if ((! fastpan) || deltaEnergy < 2) {
                offsetX = (offsetX - panX) | 0;
                offsetY = (offsetY - panY) | 0;

                viewport = getViewport();

                /*
                if (offsetMaxX || offsetMaxY) {
                    constrainOffset();
                } // if
                */


                renderer.trigger('predraw', viewport, state);

                if (renderer.prepare(layers, viewport, state, tickCount, hitData)) {
                    viewChanges = 0;

                    /*
                    for (var ii = layerCount; ii--; ) {
                        state = state | (layers[ii].animated ? stateAnimating : 0);

                        layers[ii].cycle(tickCount, viewport, state);
                    } // for
                    */

                    for (ii = layerCount; ii--; ) {
                        var drawLayer = layers[ii];

                        if (drawLayer.visible && ((state & drawLayer.validStates) !== 0)) {
                            var previousStyle = drawLayer.style ?
                                    renderer.applyStyle(drawLayer.style, true) :
                                    null;

                            drawLayer.draw(
                                renderer,
                                viewport,
                                state,
                                _self,
                                tickCount,
                                hitData);

                            if (previousStyle) {
                                renderer.applyStyle(previousStyle);
                            } // if
                        } // if
                    } // for

                    renderer.trigger('render', viewport, state);

                    _self.trigger('drawComplete', viewport, tickCount);

                    lastScaleFactor = scaleFactor;

                    moveEl(viewpane, panX = 0, panY = 0);
                } // if
            }
            else {
                moveEl(viewpane, panX, panY);
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

            if (hitData) {
                checkHits();
                hitData = null;
            } // if
        } // if

        animFrame(cycle);
    } // cycle

    function initHitData(hitType, absXY, relXY) {
        hitData = Hits.init(hitType, absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));

        for (var ii = layerCount; ii--; ) {
            hitFlagged = hitFlagged || (layers[ii].hitGuess ?
                layers[ii].hitGuess(hitData.x, hitData.y, state, _self) :
                false);
        } // for

        if (hitFlagged) {
            viewChanges++;
        } // if
    } // initHitData

    /* exports */

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

    /**
    ### detach
    If you plan on reusing a single canvas element to display different views then you
    will definitely want to call the detach method between usages.
    */
    function detach() {
        if (renderer) {
            renderer.trigger('detach');
        } // if

        if (eventMonitor) {
            eventMonitor.unbind();
        } // if

        if (panContainer) {
            document.getElementById(panContainer).removeChild(panContainer);

            panContainer = null;
            viewpane = null;
        } // if

        panFrames = [];
    } // detach

    /**
    ### eachLayer(callback)
    Iterate through each of the ViewLayers and pass each to the callback function
    supplied.
    */
    function eachLayer(callback) {
        for (var ii = layerCount; ii--; ) {
            callback(layers[ii]);
        } // for
    } // eachLayer

    /**
    ### getLayer(id: String): T5.ViewLayer
    Get the ViewLayer with the specified id, return null if not found
    */
    function getLayer(id) {
        for (var ii = 0; ii < layerCount; ii++) {
            if (layers[ii].id === id) {
                return layers[ii];
            } // if
        } // for

        return null;
    } // getLayer

    /**
    ### getOffset(): T5.XY
    Return a T5.XY containing the current view offset
    */
    function getOffset() {
        return new XY(offsetX, offsetY);
    } // getOffset

    /**
    ### setOffset(x, y)
    Set the offset of the display
    */
    function setOffset(x, y) {
        offsetX = x | 0;
        offsetY = y | 0;

        viewChanges++;
    } // setOffset

    /**
    ### getRenderer(): T5.Renderer
    */
    function getRenderer() {
        return renderer;
    } // getRenderer

    /**
    ### getScaleFactor(): float
    Return the current scaling factor
    */
    function getScaleFactor() {
        return scaleFactor;
    } // getScaleFactor

    /**
    ### getZoomLevel(): int
    Return the current zoom level of the view, for views that do not support
    zooming, this will always return a value of 1
    */
    function getZoomLevel() {
        return zoomLevel;
    }

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
    ### getViewport(): T5.XYRect
    Return a T5.XYRect for the last drawn view rect
    */
    function getViewport() {
        var viewport = new Rect(offsetX, offsetY, width, height);

        viewport.scaleFactor = scaleFactor;

        return viewport;
    } // getViewport

    /**
    ### pan(x: int, y: int)

    Used to pan the view by the specified x and y
    */
    function pan(x, y) {
        dx = x;
        dy = y;

        viewChanges++;
    } // pan

    /**
    ### setLayer(id: String, value: T5.ViewLayer)
    Either add or update the specified view layer
    */
    function setLayer(id, value) {
        for (var ii = 0; ii < layerCount; ii++) {
            if (layers[ii].id === id) {
                layers.splice(ii, 1);
                break;
            } // if
        } // for

        if (value) {
            addLayer(id, value);

            value.trigger('refresh', _self, getViewport());

            _self.trigger('layerChange', _self, value);
        } // if

        invalidate();

        return value;
    } // setLayer

    /**
    ### refresh()
    Manually trigger a refresh on the view.  Child view layers will likely be listening for `refresh`
    events and will do some of their recalculations when this is called.
    */
    function refresh() {
        var viewport = getViewport();
        if (viewport) {
            if (offsetMaxX || offsetMaxY) {
                constrainOffset(viewport);
            } // if

            refreshX = offsetX;
            refreshY = offsetY;

            triggerAll('refresh', _self, viewport);

            viewChanges++;
        } // if
    } // refresh

    /**
    ### removeLayer(id: String)
    Remove the T5.ViewLayer specified by the id
    */
    function removeLayer(id) {
        var layerIndex = getLayerIndex(id);
        if ((layerIndex >= 0) && (layerIndex < layerCount)) {
            _self.trigger('layerRemove', _self, layers[layerIndex]);

            layers.splice(layerIndex, 1);
            invalidate();
        } // if

        layerCount = layers.length;
    } // removeLayer

    function resetScale() {
        scaleFactor = 1;
    } // resetScale

    /**
    ### scale(targetScaling: float, targetXY: T5.XY, tweenFn: EasingFn, callback: fn)
    Scale the view to the specified `targetScaling` (1 = normal, 2 = double-size and 0.5 = half-size).
    */
    function scale(targetScaling, targetXY, tweenFn, callback, duration) {
        var scaleFactorExp;

        if (! partialScaling) {
            tweenFn = false;

            scaleFactorExp = round(log(targetScaling) / Math.LN2);

            targetScaling = pow(2, scaleFactorExp);
        } // if

        if (tweenFn) {
            COG.tweenValue(scaleFactor, targetScaling, tweenFn, duration, function(val, completed) {
                scaleFactor = val;

                if (completed) {
                    scaleFactorExp = round(log(scaleFactor) / Math.LN2);

                    scaleFactor = pow(2, scaleFactorExp);

                    if (callback) {
                        callback();
                    } // if
                } // if

                setZoomCenter(targetXY);
                scaleView();
            });
        }
        else {
            scaleFactor = targetScaling;

            setZoomCenter(targetXY);
            scaleView();
        }  // if..else

        return _self;
    } // scale

    /**
    ### setZoomLevel(value: int, zoomXY: T5.XY): boolean
    This function is used to update the zoom level of the view.  The zoom level
    is checked to ensure that it falls within the `minZoom` and `maxZoom` values.  Then
    if the requested zoom level is different from the current the zoom level is updated
    and a `zoomLevelChange` event is triggered
    */
    function setZoomLevel(value, zoomX, zoomY) {
        value = max(params.minZoom, min(params.maxZoom, value));
        if (value !== zoomLevel) {
            var scaling = pow(2, value - zoomLevel),
                scaledHalfWidth = halfWidth / scaling | 0,
                scaledHalfHeight = halfHeight / scaling | 0;

            zoomLevel = value;

            setOffset(
                ((zoomX ? zoomX : offsetX + halfWidth) - scaledHalfWidth) * scaling,
                ((zoomY ? zoomY : offsetY + halfHeight) - scaledHalfHeight) * scaling
            );

            refreshX = 0;
            refreshY = 0;

            triggerAll('zoomLevelChange', value);

            scaleFactor = 1;

            renderer.trigger('reset');

            refresh();
        } // if
    } // setZoomLevel

    /**
    ### syncXY(points, reverse)
    This function is used to keep a T5.XY derivative x and y position in sync
    with it's real world location (if it has one).  T5.GeoXY are a good example
    of this.

    If the `reverse` argument is specified and true, then the virtual world
    coordinate will be updated to match the current x and y offsets.
    */
    function syncXY(points, reverse) {
    } // syncXY

    /**
    ### triggerAll(eventName: string, args*)
    Trigger an event on the view and all layers currently contained in the view
    */
    function triggerAll() {
        var cancel = _self.trigger.apply(null, arguments).cancel;
        for (var ii = layers.length; ii--; ) {
            cancel = layers[ii].trigger.apply(null, arguments).cancel || cancel;
        } // for

        return (! cancel);
    } // triggerAll


    /**
    ### updateOffset(x: int, y: int, tweenFn: EasingFn, tweenDuration: int, callback: fn)
    __deprecated__

    This function allows you to specified the absolute x and y offset that should
    become the top-left corner of the view.  As per the `pan` function documentation, tween and
    callback arguments can be supplied to animate the transition.
    */
    function updateOffset(x, y, tweenFn, tweenDuration, callback) {
        COG.warn('updateOffset function has been deprecated, please use setOffset instead');
        setOffset(x, y);
    } // updateOffset

    /* object definition */

    var _self = {
        id: params.id,
        padding: padding,

        attachFrame: attachFrame,
        detach: detach,
        eachLayer: eachLayer,
        getLayer: getLayer,
        getZoomLevel: getZoomLevel,
        setLayer: setLayer,
        invalidate: invalidate,
        refresh: refresh,
        resetScale: resetScale,
        scale: scale,
        setZoomLevel: setZoomLevel,
        syncXY: syncXY,
        triggerAll: triggerAll,
        removeLayer: removeLayer,

        /* offset methods */

        getOffset: getOffset,
        setOffset: setOffset,

        getRenderer: getRenderer,
        getScaleFactor: getScaleFactor,
        setMaxOffset: setMaxOffset,
        getViewport: getViewport,
        updateOffset: updateOffset,
        pan: pan
    };

    COG.observable(_self);

    _self.bind('resync', handleResync);

    COG.configurable(
        _self, [
            'container',
            'captureHover',
            'scalable',
            'pannable',
            'inertia',
            'minZoom',
            'maxZoom',
            'renderer',
            'zoom'
        ],
        COG.paramTweaker(params, null, {
            'container': updateContainer,
            'captureHover': captureInteractionEvents,
            'scalable': captureInteractionEvents,
            'pannable': captureInteractionEvents,
            'renderer': changeRenderer
        }),
        true);

    CANI.init(function(testResults) {
        _self.markers = addLayer('markers', new ShapeLayer({
            zindex: 20
        }));

        caps = testResults;
        updateContainer(null, params.container);

        if (isIE) {
            window.attachEvent('onresize', handleResize);
        }
        else {
            window.addEventListener('resize', handleResize, false);
        }
    });

    animFrame(cycle);

    return _self;
}; // T5.View
/**
# T5.Map
_extends:_ T5.Tiler


The Map class is the entry point for creating a tiling map.  Creating a
map is quite simple and requires two things to operate.  A containing HTML5 canvas
that will be used to display the map and a T5.Geo.MapProvider that will populate
the map.

## Example Usage: Creating a Map

<pre lang='javascript'>
map = new T5.Map({
    container: 'mapContainer'
});
</pre>

Like all View descendants the map supports features such as intertial scrolling and
the like and is configurable through implementing the COG.configurable interface. For
more information on view level features check out the View documentation.

## Events

### zoomLevelChange
This event is triggered when the zoom level has been updated

<pre>
map.bind('zoomLevelChange', function(evt, newZoomLevel) {
});
</pre>

### boundsChange
This event is triggered when the bounds of the map have changed

<pre>
map.bind('boundsChange', function(evt, bounds) {
});
</pre>

## Methods
*/
var Map = function(params) {
    params = COG.extend({
        zoomLevel: 1,
        minZoom: 1,
        maxZoom: 18,
        pannable: true,
        scalable: true
    }, params);

    var lastBoundsChangeOffset = new XY(),
        initialized = false,
        tappedPOIs = [],
        annotations = null, // annotations layer
        guideOffset = null,
        initialTrackingUpdate = true,
        rpp = 0,
        tapExtent = params.tapExtent;

    /* internal functions */

    /* event handlers */

    function handleTap(evt, absXY, relXY, offsetXY) {
        var tapPos = GeoXY.toPos(offsetXY, rpp),
            minPos = GeoXY.toPos(
                XYFns.offset(offsetXY, -tapExtent, tapExtent),
                rpp),
            maxPos = GeoXY.toPos(
                XYFns.offset(offsetXY, tapExtent, -tapExtent),
                rpp);

        _self.trigger(
            'geotap',
            absXY,
            relXY,
            tapPos,
            BoundingBox.init(minPos, maxPos)
        );
    } // handleTap

    function handleRefresh(evt, view, viewport) {
        if (lastBoundsChangeOffset.x != viewport.x || lastBoundsChangeOffset.y != viewport.y) {
            _self.trigger('boundsChange', _self.getBoundingBox());

            lastBoundsChangeOffset.x = viewport.x;
            lastBoundsChangeOffset.y = viewport.y;
        } // if
    } // handleWork

    function handleProviderUpdate(name, value) {
        _self.cleanup();
        initialized = false;
    } // handleProviderUpdate

    function handleZoomLevelChange(evt, zoomLevel) {
        var gridSize;

        rpp = radsPerPixel(zoomLevel);

        gridSize = TWO_PI / rpp | 0;
        _self.setMaxOffset(gridSize, gridSize, true, false);


        _self.resetScale();
        _self.triggerAll('resync', _self);
    } // handleZoomLevel

    /* internal functions */

    function getLayerScaling(oldZoom, newZoom) {
        return radsPerPixel(oldZoom) / radsPerPixel(newZoom);
    } // getLayerScaling

    /* public methods */

    /**
    ### getBoundingBox()

    Return a T5.Geo.BoundingBox for the current map view area
    */
    function getBoundingBox() {
        var viewport = _self.getViewport();

        return viewport ?
            BoundingBox.init(
                GeoXY.toPos(new XY(viewport.x, viewport.y2), rpp),
                GeoXY.toPos(new XY(viewport.x2, viewport.y), rpp)) :
            null;
    } // getBoundingBox

    /**
    ### getCenterPosition()`
    Return a T5.GeoXY composite for the center position of the map
    */
    function getCenterPosition() {
        var viewport = _self.getViewport();
        if (viewport) {
            var xy = new XY(viewport.x + (viewport.w >> 1), viewport.y + (viewport.h >> 1));
            return GeoXY.toPos(xy, rpp);
        } // if

        return null;
    } // getCenterPosition

    /**
    ### gotoBounds(bounds, callback)
    Calculates the optimal display bounds for the specified T5.Geo.BoundingBox and
    then goes to the center position and zoom level best suited.
    */
    function gotoBounds(bounds, callback) {
        var zoomLevel = BoundingBox.getZoomLevel(
                            bounds,
                            _self.getViewport());

        gotoPosition(
            BoundingBox.getCenter(bounds),
            zoomLevel,
            callback);
    } // gotoBounds

    /**
    ### gotoPosition(position, newZoomLevel, callback)
    This function is used to tell the map to go to the specified position.  The
    newZoomLevel parameter is optional and updates the map zoom level if supplied.
    An optional callback argument is provided to receieve a notification once
    the position of the map has been updated.
    */
    function gotoPosition(position, newZoomLevel, callback) {
        _self.setZoomLevel(newZoomLevel);

        panToPosition(position, callback);
    } // gotoPosition

    /**
    ### panToPosition(position)
    This method is used to tell the map to pan (not zoom) to the specified
    T5.GeoXY.

    __NOTE:__ callback, easingFn & easingDuration parameters removed
    */
    function panToPosition(position, callback, easingFn, easingDuration) {
        var centerXY = GeoXY.init(position, radsPerPixel(_self.getZoomLevel())),
            viewport = _self.getViewport(),
            offsetX = centerXY.x - (viewport.w >> 1),
            offsetY = centerXY.y - (viewport.h >> 1);

        _self.setOffset(offsetX, offsetY);

        if (callback) {
            callback();
            COG.warn('panToPosition callback parameter deprecated');
        } // if

        if (easingFn || easingDuration) {
            COG.warn('panToPosition easingFn and easingDuration parameters not supported');
        } // if
    } // panToPosition

    /**
    ### syncXY(points)
    This function iterates through the specified vectors and if they are
    of type GeoXY composite they are provided the rads per pixel of the
    grid so they can perform their calculations
    */
    function syncXY(points, reverse) {
        return (reverse ? GeoXY.syncPos : GeoXY.sync)(points, rpp);
    } // syncXY

    /* public object definition */

    params.adjustScaleFactor = function(scaleFactor) {
        var roundFn = scaleFactor < 1 ? Math.floor : Math.ceil;
        return Math.pow(2, roundFn(Math.log(scaleFactor)));
    };

    var _self = COG.extend(new View(params), {

        getBoundingBox: getBoundingBox,
        getCenterPosition: getCenterPosition,

        gotoBounds: gotoBounds,
        gotoPosition: gotoPosition,
        panToPosition: panToPosition,
        syncXY: syncXY
    });

    _self.bind('tap', handleTap);

    _self.bind('refresh', handleRefresh);

    _self.bind('zoomLevelChange', handleZoomLevelChange);

    return _self;
}; // T5.Map

/**
# T5.Drawable
The T5.Shape class is simply a template class that provides placeholder methods
that need to be implemented for shapes that can be drawn in a T5.ShapeLayer.

## Constructor
`new T5.Drawable(params);`


#### Initialization Parameters

-
*/
var Drawable = function(params) {
    params = COG.extend({
        style: null,
        xy: null,
        size: 10,
        fill: false,
        stroke: true,
        draggable: false,
        observable: true, // TODO: should this be true or false by default
        properties: {},
        typeName: 'Shape'
    }, params);

    COG.extend(this, params);

    this.id = COG.objId(this.typeName);
    this.bounds = null;
    this.view = null;

    this.animations = 0;
    this.rotation = 0;
    this.scaling = 1;
    this.translateX = 0;
    this.translateY = 0;

    if (this.observable) {
        COG.observable(this);
    } // if
};

Drawable.prototype = {
    constructor: Drawable,

    /**
    ### animate(fn, argsStart, argsEnd, opts)
    */
    animate: function(fn, argsStart, argsEnd, opts) {
        animateDrawable(this, fn, argsStart, argsEnd, opts);
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
    ### getProps(renderer, state)
    Get the drawable item properties that will be passed to the renderer during
    the prepare and draw phase
    */
    getProps: null,

    /**
    ### resync(view)
    */
    resync: function(view) {
        if (this.xy) {
            view.syncXY([this.xy]);

            if (this.size) {
                this.updateBounds(XYRect.fromCenter(
                    this.xy.x, this.xy.y, this.size, this.size));
            } // if
        } // if
    },

    /**
    ### rotate(value)
    */
    rotate: function(value) {
        this.rotation = value;
    },

    /**
    ### scale(value)
    */
    scale: function(value) {
        this.scaling = value;
    },

    /**
    ### translate(x, y)
    */
    translate: function(x, y) {
        this.translateX = x;
        this.translateY = y;
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
            this.xy = XYRect.center(this.bounds);
        } // if
    }
};
var ANI_WAIT = 1000 / 60 | 0,
    animateCallbacks = [],
    lastAniTicks = 0;

function runAnimationCallbacks(tickCount) {
    tickCount = tickCount ? tickCount : new Date().getTime();

    if (tickCount - lastAniTicks > ANI_WAIT) {
        var callbacks = animateCallbacks.splice(0);

        for (var ii = callbacks.length; ii--; ) {
            callbacks[ii](tickCount);
        } // for

        lastAniTicks = tickCount;
    } // if

    if (animateCallbacks.length) {
        animFrame(runAnimationCallbacks);
    } // if
} // runAnimationCallback

function registerAnimationCallback(fn) {
    var scheduleCallbacks = animateCallbacks.length == 0;

    animateCallbacks[animateCallbacks.length] = fn;

    if (scheduleCallbacks) {
        animFrame(runAnimationCallbacks);
    } // if
} // registerAnimationCallback

function animateDrawable(target, fnName, argsStart, argsEnd, opts) {
    opts = COG.extend({
        easing: 'sine.out',
        duration: 1000,
        progress: null,
        complete: null,
        autoInvalidate: true
    }, opts);

    var startTicks = new Date().getTime(),
        lastTicks = 0,
        targetFn = target[fnName],
        floorValue = fnName == 'translate',
        argsComplete = 0,
        autoInvalidate = opts.autoInvalidate,
        animateValid = argsStart.length && argsEnd.length &&
            argsStart.length == argsEnd.length,
        argsCount = animateValid ? argsStart.length : 0,
        argsChange = new Array(argsCount),
        argsCurrent = new Array(argsCount),
        easingFn = COG.easing(opts.easing),
        duration = opts.duration,
        callback = opts.progress,
        ii,

        runTween = function(tickCount) {
            var elapsed = tickCount - startTicks,
                complete = startTicks + duration <= tickCount,
                view = target.layer ? target.layer.view : null,
                easedValue;

            for (var ii = argsCount; ii--; ) {
                easedValue = easingFn(
                    elapsed,
                    argsStart[ii],
                    argsChange[ii],
                    duration);

                argsCurrent[ii] = floorValue ? easedValue | 0 : easedValue;
            } // for

            targetFn.apply(target, argsCurrent);

            if (autoInvalidate && view) {
                view.invalidate();
            } // if

            if (callback) {
                var cbArgs = [].concat(complete ? argsEnd : argsCurrent);

                cbArgs.unshift(complete);

                callback.apply(target, cbArgs);
            } // if

            if (! complete) {
                registerAnimationCallback(runTween);
            }
            else {
                target.animations--;
                targetFn.apply(target, argsEnd);

                if (opts.complete) {
                    opts.complete.apply(target, argsEnd);
                } // if
            } // if..else
        };

    if (targetFn && targetFn.apply && argsCount > 0) {
        duration = duration ? duration : DEFAULT_DURATION;

        for (ii = argsCount; ii--; ) {
            argsChange[ii] = argsEnd[ii] - argsStart[ii];
        } // for

        target.animations++;

        registerAnimationCallback(runTween);
    } // if
} // animate
/**
# T5.Marker
The T5.Marker class represents a generic marker for annotating an underlying view.
Originally the marker class did very little, and in most instances a T5.ImageMarker
was used instead to generate a marker that looked more visually appealing, however,
with the introduction of different rendering backends the standard marker class is
the recommended option for annotating maps and views as it allows the renderer to
implement suitable rendering behaviour which looks good regardless of the context.

## Initialization Parameters
In addition to the standard T5.Drawable initialization parameters, a Marker can
accept the following:


- `markerStyle` - (default = simple)

    The style of marker that will be displayed for the marker.  This is interpreted
    by each renderer individually.

*/
function Marker(params) {
    params = COG.extend({
        fill: true,
        stroke: false,
        markerStyle: 'simple',
        hoverStyle: 'highlight',
        typeName: 'Marker'
    }, params);

    Drawable.call(this, params);
};

Marker.prototype = COG.extend(Drawable.prototype, {
    constructor: Marker
});
/**
# T5.Poly
__extends__: T5.Shape

## Constructor

`new T5.Poly(points, params)`

The constructor requires an array of vectors that represent the poly and
also accepts optional initialization parameters (see below).


#### Initialization Parameters

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.


## Methods
*/
function Poly(points, params) {
    params = COG.extend({
        simplify: false,
        fill: true,
        typeName: 'Poly'
    }, params);

    var simplify = params.simplify;

    /* exported functions */

    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync(view) {
        var x, y, maxX, maxY, minX, minY, drawPoints;

        view.syncXY(points);

        drawPoints = this.points = XYFns.floor(simplify ? XYFns.simplify(points) : points);

        for (var ii = drawPoints.length; ii--; ) {
            x = drawPoints[ii].x;
            y = drawPoints[ii].y;

            minX = isType(minX, typeUndefined) || x < minX ? x : minX;
            minY = isType(minY, typeUndefined) || y < minY ? y : minY;
            maxX = isType(maxX, typeUndefined) || x > maxX ? x : maxX;
            maxY = isType(maxY, typeUndefined) || y > maxY ? y : maxY;
        } // for

        this.updateBounds(new Rect(minX, minY, maxX - minX, maxY - minY), true);
    } // resync

    Drawable.call(this, params);

    COG.extend(this, {
        getPoints: function() {
            return [].concat(points);
        },

        resync: resync
    });

    this.haveData = points && (points.length >= 2);
};

Poly.prototype = COG.extend({}, Drawable.prototype, {
    constructor: Poly
});
/**
### T5.Line(points, params)
*/
function Line(points, params) {
    params.fill = false;

    Poly.call(this, points, params);
};

Line.prototype = COG.extend({}, Poly.prototype);
/**
# T5.ImageDrawable
_extends:_ T5.Drawable


An image drawable is the class that provides support for drawing images to a T5.DrawLayer.

## TODO

- currently hits on animated markers not working as well as they should, need to
tweak touch handling to get this better...


## Initialization Parameters

- `image` (HTMLImage, default = null) - one of either this or the `imageUrl` parameter
is required and the specified image is used to display the annotation.

- `imageUrl` (String, default = null) - one of either this of the `image` parameter is
required.  If specified, the image is obtained using T5.Images module and then drawn
to the canvas.

- `centerOffset` (T5.XY, default = null) - a XY composite that optionally specifies the
offset that should be applied to the image when it is drawn by the renderer.


## Methods
*/
function ImageDrawable(params) {
    params = COG.extend({
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
    ### getProps(renderer, state)
    Get the drawable item properties that will be passed to the renderer during
    the prepare and draw phase
    */
    function getProps(renderer, state) {
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

    Drawable.call(this, params);

    var _self = COG.extend(this, {
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
};

ImageDrawable.prototype = COG.extend({}, Drawable.prototype, {
    constructor: ImageDrawable
});
/**
# T5.ImageMarker
The T5.ImageMarker is a class that provides a mechanism for displaying an image
marker as an annotation for a T5.Map or T5.View


_extends_: T5.ImageDrawable
*/
function ImageMarker(params) {
    params = COG.extend({
        imageAnchor: null
    }, params);

    if (params.imageAnchor) {
        params.centerOffset = XYFns.invert(params.imageAnchor);
    } // if

    ImageDrawable.call(this, params);
};

ImageMarker.prototype = COG.extend({}, ImageDrawable.prototype, {
    constructor: ImageMarker
});
/**
### T5.Arc(params)
*/
function Arc(params) {
    params = COG.extend({
        startAngle: 0,
        endAngle: Math.PI * 2,
        typeName: 'Arc'
    }, params);

    Drawable.call(this, params);
};

Arc.prototype = COG.extend(Drawable.prototype, {
    constructor: Arc
});

/**
# T5.ViewLayer

In and of it_self, a View does nothing.  Not without a
ViewLayer at least.  A view is made up of one or more of these
layers and they are drawn in order of *zindex*.

## Constructor
`T5.ViewLayer(params)`

### Initialization Parameters

- `id` - the id that has been assigned to the layer, this value
can be used when later accessing the layer from a View.

- `zindex` (default: 0) - a zindex in Tile5 means the same thing it does in CSS

- `validStates` - the a bitmask of DisplayState that the layer will be drawn for


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

### parentChange
This event is fired with the parent of the layer has been changed

<pre>
layer.bind('parentChange', function(evt, parent) {
);
</pre>

## Methods

*/
function ViewLayer(params) {
    params = COG.extend({
        id: COG.objId('layer'),
        zindex: 0,
        animated: false,
        validStates: viewState('ACTIVE', 'ANIMATING', 'PAN', 'ZOOM'),
        style: null,
        minXY: null,
        maxXY: null
    }, params);

    this.view = null;
    this.visible = true;

    COG.observable(COG.extend(this, params));
}; // ViewLayer constructor

ViewLayer.prototype = {
    constructor: ViewLayer,

    /**
    ### clip(context, offset, dimensions, state)
    */
    clip: null,

    /**
    ### cycle(tickCount, offset, state)

    Called in the View method of the same name, each layer has an opportunity
    to update it_self in the current animation cycle before it is drawn.
    */
    cycle: function(tickCount, offset, state) {
    },

    /**
    ### draw(context, offset, dimensions, state, view)

    The business end of layer drawing.  This method is called when a layer needs to be
    drawn and the following parameters are passed to the method:

        - renderer - the renderer that will be drawing the viewlayer
        - viewport - the current viewport
        - state - the current DisplayState of the view
        - view - a reference to the View
        - tickCount - the current tick count
        - hitData - an object that contains information regarding the current hit data
    */
    draw: function(renderer, viewport, state, view, tickCount, hitData) {
    },

    /**
    ### hitGuess(hitX, hitY, state, view)
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
# T5.ImageLayer
*/
var TileLayer = function(genId, params) {
    params = COG.extend({
        imageLoadArgs: {}
    }, params);

    var genFn = genId ? Generator.init(genId, params).run : null,
        generating = false,
        storage = null,
        zoomTrees = [],
        tiles = [],
        loadArgs = params.imageLoadArgs;

    /* event handlers */

    function handleRefresh(evt, view, viewport) {
        var tickCount = new Date().getTime();

        if (storage) {
            genFn(view, viewport, storage, function() {
                view.invalidate();
                COG.info('GEN COMPLETED IN ' + (new Date().getTime() - tickCount) + ' ms');
            });
        } // if
    } // handleViewIdle

    function handleResync(evt, view) {
        var zoomLevel = view && view.getZoomLevel ? view.getZoomLevel() : 0;

        if (! zoomTrees[zoomLevel]) {
            zoomTrees[zoomLevel] = createStoreForZoomLevel(zoomLevel);
        } // if

        storage = zoomTrees[zoomLevel];
    } // handleParentChange

    /* exports */

    /**
    ### draw(renderer)
    */
    function draw(renderer, viewport) {
        if (renderer.drawTiles) {
            renderer.drawTiles(viewport, storage.search(XYRect.buffer(viewport, 128)));
        } // if
    } // draw

    /* definition */

    var _self = COG.extend(new ViewLayer(params), {
        draw: draw
    });

    _self.bind('refresh', handleRefresh);
    _self.bind('parentChange', handleResync);
    _self.bind('resync', handleResync);

    return _self;
};
/**
# T5.DrawLayer
_extends:_ T5.ViewLayer


The DrawLayer is a generic layer that handles drawing, hit testing and syncing a list
of drawables.  A T5.DrawLayer itself is never meant to be implemented as it has no
internal `T5.Drawable` storage, but rather relies on descendants to implement storage and
provide the drawables by the `loadDrawables` method.

## Methods
*/
var DrawLayer = function(params) {
    params = COG.extend({
        zindex: 10
    }, params);

    var drawables = [],
        storage,
        sortTimeout = 0;

    /* private functions */

    function dragObject(dragData, dragX, dragY, drop) {
        var dragOffset = this.dragOffset;

        if (! dragOffset) {
            dragOffset = this.dragOffset = new XY(
                dragData.startX - this.xy.x,
                dragData.startY - this.xy.y
            );
        } // if

        this.xy.x = dragX - dragOffset.x;
        this.xy.y = dragY - dragOffset.y;

        if (drop) {
            delete this.dragOffset;


            var view = _self.view;
            if (view) {
                view.syncXY([this.xy], true);
                view.invalidate();
            } // if

            this.trigger('dragDrop');
        } // if

        return true;
    } // dragObject

    function triggerSort(view) {
        clearTimeout(sortTimeout);
        sortTimeout = setTimeout(function() {
            drawables.sort(function(shapeA, shapeB) {
                if (shapeB.xy && shapeA.xy) {
                    var diff = shapeB.xy.y - shapeA.xy.y;
                    return diff != 0 ? diff : shapeB.xy.x - shapeA.xy.x;
                } // if
            });

            if (view) {
                view.invalidate();
            } // if
        }, 50);
    } // triggerSort

    /* event handlers */

    function handleItemMove(evt, drawable, newBounds, oldBounds) {
        if (oldBounds) {
            storage.remove(oldBounds, drawable);
        } // if

        storage.insert(newBounds, drawable);
    } // handleItemMove

    function handleResync(evt, view) {
        storage = createStoreForZoomLevel(view.getZoomLevel(), storage); // TODO: populate with the previous storage

        for (var ii = drawables.length; ii--; ) {
            var drawable = drawables[ii];

            drawable.resync(view);
        } // for

    } // handleParentChange

    /* exports */

    function draw(renderer, viewport, state, view, tickCount, hitData) {
        var emptyProps = {
            },
            drawItems = storage && viewport ? storage.search(viewport): [];

        for (var ii = drawItems.length; ii--; ) {
            var drawable = drawItems[ii],
                overrideStyle = drawable.style || _self.style,
                styleType,
                previousStyle,
                transform = renderer.applyTransform(drawable),
                drawProps = drawable.getProps ? drawable.getProps(renderer, state) : emptyProps,

                prepFn = renderer['prep' + drawable.typeName],
                drawFn,

                drawData = prepFn ? prepFn.call(renderer,
                    drawable,
                    viewport,
                    hitData,
                    state,
                    drawProps) : null;

            if (drawData) {
                if (hitData && drawData.hit) {
                    hitData.elements.push(Hits.initHit(
                        drawable.type,
                        drawable,
                        drawable.draggable ? dragObject : null)
                    );

                    styleType = hitData.type + 'Style';

                    overrideStyle = drawable[styleType] || _self[styleType] || overrideStyle;
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
        return [].concat(drawables);
    } // find

    /**
    ### hitGuess(hitX, hitY, state, view)
    Return true if any of the markers are hit, additionally, store the hit elements
    so we don't have to do the work again when drawing
    */
    function hitGuess(hitX, hitY, state, view) {
        return storage && storage.search({
            x: hitX - 10,
            y: hitY - 10,
            w: 20,
            h: 20
        }).length > 0;
    } // hitGuess

    /* initialise _self */

    var _self = COG.extend(new ViewLayer(params), {
        itemCount: 0,

        /**
        ### add(poly)
        Used to add a T5.Poly to the layer
        */
        add: function(drawable, prepend) {
            if (drawable) {
                drawable.layer = _self;

                if (prepend) {
                    drawables.unshift(drawable);
                }
                else {
                    drawables[drawables.length] = drawable;
                } // if..else

                var view = _self.view;
                if (view) {
                    drawable.resync(view);
                    if (storage && drawable.bounds) {
                        storage.insert(drawable.bounds, drawable);
                    } // if

                    triggerSort(view);
                } // if

                drawable.bind('move', handleItemMove);
            } // if

            _self.itemCount = drawables.length;
        },

        clear: function() {
            storage = new SpatialStore();

            drawables = [];
            _self.itemCount = 0;
        },

        draw: draw,
        find: find,
        hitGuess: hitGuess
    });

    _self.bind('parentChange', handleResync);
    _self.bind('resync', handleResync);

    return _self;
};
/**
# T5.ShapeLayer
_extends:_ T5.DrawLayer


The ShapeLayer is designed to facilitate the storage and display of multiple
geometric shapes.  This is particularly useful for displaying [GeoJSON](http://geojson.org)
data and the like.

## Methods
*/
var ShapeLayer = function(params) {
    return new DrawLayer(params);
};

/**
# T5.Pos (internal class)
The T5.Pos class is a currently an internal class that is used by the `T5.Geo.Position` module.
This is currently a little obscure and is due to a change in the way Tile5 is structured internally.

# Methods
*/
function Pos(p1, p2) {
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
} // Pos constructor

Pos.prototype = {
    constructor: Pos,

    /**
    ### offset(latOffset, lonOffset)
    Return a new T5.Geo.Position which is the original `pos` offset by
    the specified `latOffset` and `lonOffset` (which are specified in
    km distance)
    */
    offset: function(latOffset, lonOffset) {
        var radOffsetLat = latOffset / KM_PER_RAD,
            radOffsetLon = lonOffset / KM_PER_RAD,
            radLat = this.lat * DEGREES_TO_RADIANS,
            radLon = this.lon * DEGREES_TO_RADIANS,
            newLat = radLat + radOffsetLat,
            deltaLon = asin(sin(radOffsetLon) / cos(radLat)),
            newLon = radLon + deltaLon;

        newLat = ((newLat + HALF_PI) % Math.PI) - HALF_PI;
        newLon = newLon % TWO_PI;

        return new Pos(newLat * RADIANS_TO_DEGREES, newLon * RADIANS_TO_DEGREES);
    },

    toString: function(delimiter) {
        return this.lat + (delimiter || ' ') + this.lon;
    }
};

    COG.extend(exports, {
        ex: COG.extend,
        is: isType,
        ticks: ticks,
        userMessage: userMessage,
        indexOf: indexOf,

        Rect: Rect,
        XY: XYFns,
        XYRect: XYRect,
        Vector: Vector,
        Hits: Hits,

        Generator: Generator,
        Service: Service,

        tweenValue: COG.tweenValue,
        easing: COG.easing,

        Tile: Tile,
        TileLayer: TileLayer,
        getImage: getImage,

        viewState: viewState,
        View: View,
        ViewLayer: ViewLayer,
        ImageLayer: TileLayer,

        Drawable: Drawable,
        Marker: Marker,
        Poly: Poly,
        Line: Line,
        Arc: Arc,
        ImageDrawable: ImageDrawable,
        ImageMarker: ImageMarker,

        DrawLayer: DrawLayer,
        ShapeLayer: ShapeLayer,

        Map: Map,

        Pos: Pos
    });

var LAT_VARIABILITIES = [
    1.406245461070741,
    1.321415085624082,
    1.077179995861952,
    0.703119412486786,
    0.488332580888611
];

var DEGREES_TO_RADIANS = Math.PI / 180,
    RADIANS_TO_DEGREES = 180 / Math.PI,
    MAX_LAT = HALF_PI, //  85.0511 * DEGREES_TO_RADIANS, // TODO: validate this instead of using HALF_PI
    MIN_LAT = -MAX_LAT,
    MAX_LON = TWO_PI,
    MIN_LON = -MAX_LON,
    M_PER_KM = 1000,
    KM_PER_RAD = 6371,
    ECC = 0.08181919084262157,
    PHI_EPSILON = 1E-7,
    PHI_MAXITER = 12,

    ROADTYPE_REGEX = null,

    ROADTYPE_REPLACEMENTS = {
        RD: "ROAD",
        ST: "STREET",
        CR: "CRESCENT",
        CRES: "CRESCENT",
        CT: "COURT",
        LN: "LANE",
        HWY: "HIGHWAY",
        MWY: "MOTORWAY"
    },

    DEFAULT_GENERALIZATION_DISTANCE = 250;
/* exports */

/**
### distanceToString(distance)
This function simply formats a distance value (in meters) into a human readable string.

#### TODO
- Add internationalization and other formatting support to this function
*/
function distanceToString(distance) {
    if (distance > 1000) {
        return (~~(distance / 10) / 100) + " km";
    } // if

    return distance ? distance + " m" : '';
} // distanceToString

/**
### dist2rad(distance)
To be completed
*/
function dist2rad(distance) {
    return distance / KM_PER_RAD;
} // dist2rad

/**
### lat2pix(lat)
To be completed
*/
function lat2pix(lat) {
    var radLat = parseFloat(lat) * DEGREES_TO_RADIANS,
        sinPhi = sin(radLat),
        eSinPhi = ECC * sinPhi,
        retVal = log(((1.0 + sinPhi) / (1.0 - sinPhi)) * pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ECC)) / 2.0;

    return retVal;
} // lat2Pix

/**
### lon2pix(lon)
To be completed
*/
function lon2pix(lon) {
    return parseFloat(lon) * DEGREES_TO_RADIANS;
} // lon2pix

/**
### pix2lat(mercY)
To be completed
*/
function pix2lat(mercY) {
    var t = pow(Math.E, -mercY),
        prevPhi = mercatorUnproject(t),
        newPhi = findRadPhi(prevPhi, t),
        iterCount = 0;

    while (iterCount < PHI_MAXITER && abs(prevPhi - newPhi) > PHI_EPSILON) {
        prevPhi = newPhi;
        newPhi = findRadPhi(prevPhi, t);
        iterCount++;
    } // while

    return newPhi * RADIANS_TO_DEGREES;
} // pix2lat

/**
### pix2lon(mercX)
To be completed
*/
function pix2lon(mercX) {
    return (mercX % 360) * RADIANS_TO_DEGREES;
} // pix2lon

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

/*
This function is used to determine the match weight between a freeform geocoding
request and it's structured response.
*/
function plainTextAddressMatch(request, response, compareFns, fieldWeights) {
    var matchWeight = 0;

    request = request.toUpperCase();


    for (var fieldId in fieldWeights) {
        var fieldVal = response[fieldId];

        if (fieldVal) {
            var compareFn = compareFns[fieldId],
                matchStrength = compareFn ? compareFn(request, fieldVal) : (COG.wordExists(request, fieldVal) ? 1 : 0);

            matchWeight += (matchStrength * fieldWeights[fieldId]);
        } // if
    } // for

    return matchWeight;
} // plainTextAddressMatch

function toRad(value) {
    return value * DEGREES_TO_RADIANS;
} // toRad

/**
# T5.Geo.Position

The Geo.Position submodule is used to perform operations on Geo.Position objects rather
than have those operations bundled with the object.

## Functions
*/
var Position = (function() {
    var DEFAULT_VECTORIZE_CHUNK_SIZE = 100,
        VECTORIZE_PER_CYCLE = 500;

    /* exports */

    /**
    ### calcDistance(pos1, pos2)
    Calculate the distance between two T5.Geo.Position objects, pos1 and pos2.  The
    distance returned is measured in kilometers.
    */
    function calcDistance(pos1, pos2) {
        if (empty(pos1) || empty(pos2)) {
            return 0;
        } // if

        var halfdelta_lat = toRad(pos2.lat - pos1.lat) >> 1;
        var halfdelta_lon = toRad(pos2.lon - pos1.lon) >> 1;

        var a = sin(halfdelta_lat) * sin(halfdelta_lat) +
                (cos(toRad(pos1.lat)) * cos(toRad(pos2.lat))) *
                (sin(halfdelta_lon) * sin(halfdelta_lon)),
            c = 2 * atan2(sqrt(a), sqrt(1 - a));

        return KM_PER_RAD * c;
    } // calcDistance

    /**
    ### copy(src)
    Create a copy of the specified T5.Geo.Position object.
    */
    function copy(src) {
        return src ? init(src.lat, src.lon) : null;
    } // copy

    /**
    ### empty(pos)
    Returns true if the T5.Geo.Position object is empty, false if not.
    */
    function empty(pos) {
        return (! pos) || ((pos.lat === 0) && (pos.lon === 0));
    } // empty

    /**
    ### equal(pos1, pos2)
    Compares to T5.Geo.Position objects and returns true if they
    have the same latitude and longitude values
    */
    function equal(pos1, pos2) {
        return pos1 && pos2 && (pos1.lat == pos2.lat) && (pos1.lon == pos2.lon);
    } // equal

    /**
    ### fromMercatorPixels(x, y)
    This function is used to take x and y mercator pixels values,
    and using the value passed in the radsPerPixel value convert
    that to a Geo.Position object.
    */
    function fromMercatorPixels(mercX, mercY) {
        return init(pix2lat(mercY), pix2lon(mercX));
    } // fromMercatorPixel

    /**
    ### generalize(sourceData, requiredPositions, minDist)
    To be completed
    */
    function generalize(sourceData, requiredPositions, minDist) {
        var sourceLen = sourceData.length,
            positions = [],
            lastPosition = null;

        if (! minDist) {
            minDist = DEFAULT_GENERALIZATION_DISTANCE;
        } // if

        minDist = minDist / 1000;

        COG.info("generalizing positions, must include " + requiredPositions.length + " positions");

        for (var ii = sourceLen; ii--; ) {
            if (ii === 0) {
                positions.unshift(sourceData[ii]);
            }
            else {
                var include = (! lastPosition) || Position.inArray(sourceData[ii], requiredPositions),
                    posDiff = include ? minDist : Position.calcDistance(lastPosition, sourceData[ii]);

                if (sourceData[ii] && (posDiff >= minDist)) {
                    positions.unshift(sourceData[ii]);

                    lastPosition = sourceData[ii];
                } // if
            } // if..else
        } // for

        COG.info("generalized " + sourceLen + " positions into " + positions.length + " positions");
        return positions;
    } // generalize

    /**
    ### inArray(pos, testArray)
    Checks to see whether the specified T5.Geo.Position is contained within
    the array of position objects passed in the testArray.
    */
    function inArray(pos, testArray) {
        var arrayLen = testArray.length,
            testFn = Position.equal;

        for (var ii = arrayLen; ii--; ) {
            if (testFn(pos, testArray[ii])) {
                return true;
            } // if
        } // for

        return false;
    } // inArray

    /**
    ### inBounds(pos, bounds)
    Returns true if the specified Geo.Position object is within the
    T5.Geo.BoundingBox specified by the bounds argument.
    */
    function inBounds(pos, bounds) {
        var fnresult = ! (Position.empty(pos) || Position.empty(bounds));

        fnresult = fnresult && (pos.lat >= bounds.min.lat) && (pos.lat <= bounds.max.lat);

        fnresult = fnresult && (pos.lon >= bounds.min.lon) && (pos.lon <= bounds.max.lon);

        return fnresult;
    } // inBounds

    /**
    ### init(initLat, initLon)
    */
    function init(initLat, initLon) {
        return new Pos(initLat, initLon);
    } // init

    /**
    ### offset(pos, latOffset, lonOffset)
    __deprecated:__ will be replaced by direct access to `T5.Pos.offset()`

    Return a new T5.Geo.Position which is the original `pos` offset by
    the specified `latOffset` and `lonOffset` (which are specified in
    km distance)
    */
    function offset(pos, latOffset, lonOffset) {
        return pos.offset(latOffset, lonOffset);
    } // offset

    /**
    ### parse(object)
    This function is used to take a latitude and longitude String
    pair (either space or comma delimited) and return a new T5.Geo.Position
    value.  The function is also tolerant of being passed an existing
    T5.Geo.Position object as the object argument, and in these cases
    returns a copy of the position.
    */
    function parse(pos) {
        return new Pos(pos);
    } // parse

    /**
    ### parseArray(sourceData)
    Just like parse, but with lots of em'
    */
    function parseArray(sourceData) {
        var sourceLen = sourceData.length,
            positions = new Array(sourceLen);

        for (var ii = sourceLen; ii--; ) {
            positions[ii] = new Pos(sourceData[ii]);
        } // for

        return positions;
    } // parseArray

    /**
    ### toMercatorPixels(pos, radsPerPixel)
    Basically, the reverse of the fromMercatorPixels function -
    pass it a Geo.Position object and get a Vector object back
    with x and y mercator pixel values back.
    */
    function toMercatorPixels(pos) {
        return T5.XY.init(lon2pix(pos.lon), lat2pix(pos.lat));
    } // toMercatorPixels

    /**
    ### toString(pos)
    Return a string representation of the Geo.Position object
    */
    function toString(pos) {
        return pos ? pos.toString() : "";
    } // toString

    /**
    ### vectorize(positions, options)
    The vectorize function is used to take an array of positions specified in the
    `positions` argument and convert these into GeoXY composites. By default
    the vectorize function will process these asyncronously and will return a
    COG Worker that will be taking care of chunking up and processing the request
    in an efficient way.  It is, however, possible to specify that the conversion should
    happen synchronously and in this case the array of vectors is returned rather
    than a worker instance.

    #### Example Usage (Asyncronous)
    ~ // default options are used (async + 500 conversions per cycle)
    ~ T5.Geo.Position.vectorize(positions);
    ~
    #### Example Usage (Synchronous)
    ~ var vectors = T5.Geo.Position.vectorize(positions, {
    ~     async: false
    ~ });
    */
    function vectorize(positions, options) {
        var posIndex = positions.length,
            vectors = new Array(posIndex);

        options = COG.extend({
            chunkSize: VECTORIZE_PER_CYCLE,
            async: true,
            callback: null
        }, options);

        function processPositions(tickCount) {
            var chunkCounter = 0,
                chunkSize = options.chunkSize,
                ii = posIndex;

            for (; ii--;) {
                vectors[ii] = T5.GeoXY.init(positions[ii]);

                chunkCounter += 1;

                if (chunkCounter > chunkSize) {
                    break;
                } // if
            } // for

            posIndex = ii;
            if (posIndex <= 0) {
                if (options.callback) {
                    options.callback(vectors);
                }
            }
            else {
                animFrame(processPositions);
            } // if..else
        } // processPositions

        if (! options.async) {
            for (var ii = posIndex; ii--; ) {
                vectors[ii] = T5.GeoXY.init(positions[ii]);
            } // for

            return vectors;
        } // if

        animFrame(processPositions);
        return null;
    } // vectorize

    return {
        calcDistance: calcDistance,
        copy: copy,
        empty: empty,
        equal: equal,
        fromMercatorPixels: fromMercatorPixels,
        generalize: generalize,
        inArray: inArray,
        inBounds: inBounds,
        init: init,
        offset: offset,
        parse: parse,
        parseArray: parseArray,
        toMercatorPixels: toMercatorPixels,
        toString: toString,
        vectorize: vectorize
    };
})();
/**
# T5.Geo.BoundingBox

A collection of utilities that are primarily designed to help with working
with Geo.BoundingBox objects.  The functions are implemented here rather
than with the actual object it_self to ensure that the object remains lightweight.

## Functions
*/
var BoundingBox = (function() {

    /* exports */

    /**
    ### calcSize(min, max, normalize)
    The calcSize function is used to determine the size of a Geo.BoundingBox given
    a minimum position (relates to the bottom-left / south-western corner) and
    maximum position (top-right / north-eastern corner) of the bounding box.
    The 3rd parameter specifies whether the size calculations should normalize the
    calculation in cases where the bounding box crosses the 360 degree boundary.
    */
    function calcSize(min, max, normalize) {
        var size = new XY(0, max.lat - min.lat);

        if ((normalize || isType(normalize, typeUndefined)) && (min.lon > max.lon)) {
            size.x = 360 - min.lon + max.lon;
        }
        else {
            size.x = max.lon - min.lon;
        } // if..else

        return size;
    } // calcSize

    /**
    ### createBoundsFromCenter(centerPos, distance)
    This function is very useful for creating a Geo.BoundingBox given a
    center position and a radial distance (specified in KM) from the center
    position.  Basically, imagine a circle is drawn around the center
    position with a radius of distance from the center position, and then
    a box is drawn to surround that circle.  Adapted from the [functions written
    in Java by Jan Philip Matuschek](http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates)
    */
    function createBoundsFromCenter(centerPos, distance) {
        var radDist = distance / KM_PER_RAD,
            radLat = centerPos.lat * DEGREES_TO_RADIANS,
            radLon = centerPos.lon * DEGREES_TO_RADIANS,
            minLat = radLat - radDist,
            maxLat = radLat + radDist,
            minLon, maxLon;


        if ((minLat > MIN_LAT) && (maxLat < MAX_LAT)) {
            var deltaLon = asin(sin(radDist) / cos(radLat));

            minLon = (radLon - deltaLon) % TWO_PI;
            maxLon = (radLon + deltaLon) % TWO_PI;
        }
        else {
            minLat = max(minLat, MIN_LAT);
            maxLat = min(maxLat, MAX_LAT);
            minLon = MIN_LON;
            maxLon = MAX_LON;
        } // if..else

        return BoundingBox.init(
            new Pos(minLat * RADIANS_TO_DEGREES, minLon * RADIANS_TO_DEGREES),
            new Pos(maxLat * RADIANS_TO_DEGREES, maxLon * RADIANS_TO_DEGREES));
    } // createBoundsFromCenter

    /**
    ### expand(bounds, amount)
    A simple function that is used to expand a Geo.BoundingBox
    by the specified amount (in degrees).
    */
    function expand(bounds, amount) {
        return BoundingBox.init(
            new Pos(bounds.min.lat - amount, bounds.min.lon - amount % 360),
            new Pos(bounds.max.lat + amount, bounds.max.lon + amount % 360));
    } // expand

    /**
    ### forPositions(positions, padding)

    This function is very useful when you need to create a
    Geo.BoundingBox to contain an array of T5.Geo.Position.
    The optional second parameter allows you to specify an amount of
    padding (in degrees) to apply to the bounding box that is created.
    */
    function forPositions(positions, padding) {
        var bounds = null,
            startTicks = T5.ticks();

        if (! padding) {
            padding = "auto";
        } // if

        for (var ii = positions.length; ii--; ) {
            if (! bounds) {
                bounds = init(positions[ii], positions[ii]);
            }
            else {
                var minDiff = calcSize(bounds.min, positions[ii], false),
                    maxDiff = calcSize(positions[ii], bounds.max, false);

                if (minDiff.x < 0) { bounds.min.lon = positions[ii].lon; }
                if (minDiff.y < 0) { bounds.min.lat = positions[ii].lat; }
                if (maxDiff.x < 0) { bounds.max.lon = positions[ii].lon; }
                if (maxDiff.y < 0) { bounds.max.lat = positions[ii].lat; }
            } // if..else
        } // for

        if (padding) {
            if (padding == "auto") {
                var size = calcSize(bounds.min, bounds.max);

                padding = max(size.x, size.y) * 0.3;
            } // if

            bounds = expand(bounds, padding);
        } // if

        COG.trace("calculated bounds for " + positions.length + " positions", startTicks);
        return bounds;
    } // forPositions

    /**
    ### getCenter(bounds)
    Returns a Geo.Position for the center position of the bounding box.
    */
    function getCenter(bounds) {
        var size = calcSize(bounds.min, bounds.max);

        return new Pos(bounds.min.lat + (size.y >> 1), bounds.min.lon + (size.x >> 1));
    } // getCenter

    /**
    ### getZoomLevel(bounds, viewport)

    This function is used to return the zoom level (seems consistent across
    mapping providers at this stage) that is required to properly display
    the specified T5.Geo.BoundingBox given the screen dimensions (specified as
    a Dimensions object) of the map display. Adapted from
    [this code](http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/43958790eafe037f/66e889029c555bee)
    */
    function getZoomLevel(bounds, viewport) {
        var boundsCenter = getCenter(bounds),
            maxZoom = 1000,
            variabilityIndex = min(round(abs(boundsCenter.lat) * 0.05), LAT_VARIABILITIES.length),
            variability = LAT_VARIABILITIES[variabilityIndex],
            delta = calcSize(bounds.min, bounds.max),
            bestZoomH = ceil(log(LAT_VARIABILITIES[3] * viewport.h / delta.y) / log(2)),
            bestZoomW = ceil(log(variability * viewport.w / delta.x) / log(2));


        return min(isNaN(bestZoomH) ? maxZoom : bestZoomH, isNaN(bestZoomW) ? maxZoom : bestZoomW);
    } // getZoomLevel

    function init(initMin, initMax) {
        return {
            min: new Pos(initMin),
            max: new Pos(initMax)
        };
    } // init

    /**
    ### isEmpty(bounds)
    Returns true if the specified T5.Geo.BoundingBox is empty.
    */
    function isEmpty(bounds) {
        return (! bounds) || Position.empty(bounds.min) || Position.empty(bounds.max);
    } // isEmpty

    /**
    ### toString(bounds)
    Returns a string representation of a Geo.BoundingBox
    */
    function toString(bounds) {
        return "min: " + Position.toString(bounds.min) + ", max: " + Position.toString(bounds.max);
    } // toString

    return {
        calcSize: calcSize,
        createBoundsFromCenter: createBoundsFromCenter,
        expand: expand,
        forPositions: forPositions,
        getCenter: getCenter,
        getZoomLevel: getZoomLevel,
        init: init,
        isEmpty: isEmpty,
        toString: toString
    };
})();
var Radius = function(init_dist, init_uom) {
    return {
        distance: parseInt(init_dist, 10),
        uom: init_uom
    };
}; // Radius

/**
# T5.Geo.Address
To be completed
*/
var Address = function(params) {
    params = COG.extend({
        streetDetails: "",
        location: "",
        country: "",
        postalCode: "",
        pos: null,
        boundingBox: null
    }, params);

    return params;
}; // Address

/* define the address tools */

/**
# T5.Geo.A

A collection of utilities for working with Geo.Address objects

## Functions
*/
var addrTools = (function() {
    var REGEX_BUILDINGNO = /^(\d+).*$/,
        REGEX_NUMBERRANGE = /(\d+)\s?\-\s?(\d+)/;

    var subModule = {
        /**
        ### buildingMatch(freeForm, numberRange, name)
        */
        buildingMatch: function(freeform, numberRange, name) {
            REGEX_BUILDINGNO.lastIndex = -1;
            if (REGEX_BUILDINGNO.test(freeform)) {
                var buildingNo = freeform.replace(REGEX_BUILDINGNO, "$1");

                var numberRanges = numberRange.split(",");
                for (var ii = 0; ii < numberRanges.length; ii++) {
                    REGEX_NUMBERRANGE.lastIndex = -1;
                    if (REGEX_NUMBERRANGE.test(numberRanges[ii])) {
                        var matches = REGEX_NUMBERRANGE.exec(numberRanges[ii]);
                        if ((buildingNo >= parseInt(matches[1], 10)) && (buildingNo <= parseInt(matches[2], 10))) {
                            return true;
                        } // if
                    }
                    else if (buildingNo == numberRanges[ii]) {
                        return true;
                    } // if..else
                } // for
            } // if

            return false;
        },

        /**
        ### normalize(addressText)
        Used to take an address that could be in a variety of formats
        and normalize as many details as possible.  Text is uppercased, road types are replaced, etc.
        */
        normalize: function(addressText) {
            if (! addressText) { return ""; }

            addressText = addressText.toUpperCase();

            if (! ROADTYPE_REGEX) {
                var abbreviations = [];
                for (var roadTypes in ROADTYPE_REPLACEMENTS) {
                    abbreviations.push(roadTypes);
                } // for

                ROADTYPE_REGEX = new RegExp("(\\s)(" + abbreviations.join("|") + ")(\\s|$)", "i");
            } // if

            ROADTYPE_REGEX.lastIndex = -1;

            var matches = ROADTYPE_REGEX.exec(addressText);
            if (matches) {
                var normalizedRoadType = ROADTYPE_REPLACEMENTS[matches[2]];
                addressText = addressText.replace(ROADTYPE_REGEX, "$1" + normalizedRoadType);
            } // if

            return addressText;
        },

        /**
        ### toString(address)
        Returns a string representation of the T5.Geo.Address object
        */
        toString: function(address) {
            return address.streetDetails + " " + address.location;
        }
    };

    return subModule;
})(); // addrTools
/**
# T5.GeoXY

The GeoXY class is used to convert a position (T5.Geo.Position) into a
composite xy that can be used to draw on the various T5.ViewLayer implementations.
This class provides the necessary mechanism that allows the view layers to
assume operation using a simple vector (containing an x and y) with no need
geospatial awareness built in.

Layers are aware that particular events may require vector resynchronization
which is facilitated by the `syncXY` method of the T5.Map.

## Functions
*/
var GeoXY = exports.GeoXY = (function() {

    /* internal functions */

    /* exports */

    /**
    ### init(pos, rpp)
    */
    function init(pos, rpp) {
        var xy = new XY();

        updatePos(xy, pos, rpp);

        return xy;
    } // init

    /**
    ### sync(xy, rpp)
    */
    function sync(xy, rpp) {
        if (xy.length) {
            var minX, minY, maxX, maxY;

            for (var ii = xy.length; ii--; ) {
                sync(xy[ii], rpp);

                minX = isType(minX, typeUndefined) || xy.x < minX ? xy.x : minX;
                minY = isType(minY, typeUndefined) || xy.y < minY ? xy.y : minY;

                maxX = isType(maxX, typeUndefined) || xy.x > maxX ? xy.x : maxX;
                maxY = isType(maxY, typeUndefined) || xy.y > maxY ? xy.y : maxY;
            } // for

            return new Rect(minX, minY, maxX - minX, maxY - minY);
        }
        else if (xy.mercXY) {
            var mercXY = xy.mercXY;

            xy.x = round((mercXY.x + Math.PI) / rpp);
            xy.y = round((Math.PI - mercXY.y) / rpp);

            xy.rpp = rpp;
        } // if

        return xy;
    } // setRadsPerPixel

    function syncPos(xy, rpp) {
        if (xy.length) {
            for (var ii = xy.length; ii--; ) {
                syncPos(xy[ii], rpp);
            } // for
        }
        else {
            xy.mercXY = new XY(xy.x * rpp - Math.PI, Math.PI - xy.y * rpp);
            xy.pos = Position.fromMercatorPixels(xy.mercXY.x, xy.mercXY.y);
        } // if..else

        return xy;
    } // syncPos

    function toPos(xy, rpp) {
        rpp = rpp || xy.rpp;

        return Position.fromMercatorPixels(xy.x * rpp - Math.PI, Math.PI - xy.y * rpp);
    } // toPos

    function updatePos(xy, pos, rpp) {
        xy.pos = pos;
        xy.mercXY = Position.toMercatorPixels(pos);

        rpp = isType(rpp, typeNumber) ? rpp : xy.rpp;

        if (rpp) {
            sync(xy, rpp);
        } // if
    } // updatePos

    /* create the module */

    return {
        init: init,
        sync: sync,
        syncPos: syncPos,
        toPos: toPos,
        updatePos: updatePos
    };
})();

var FEATURE_TYPE_COLLECTION = 'featurecollection',
    FEATURE_TYPE_FEATURE = 'feature',
    VECTORIZE_OPTIONS = {
        async: false
    },

    DEFAULT_FEATUREDEF = {
        processor: null,
        group: 'shapes',
        layerClass: ShapeLayer
    };

var featureDefinitions = {

    point: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processPoint,
        group: 'markers',
        layerClass: ShapeLayer
    }),

    linestring: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processLineString
    }),
    multilinestring: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processMultiLineString
    }),

    polygon: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processPolygon
    }),
    multipolygon: COG.extend({}, DEFAULT_FEATUREDEF, {
        processor: processMultiPolygon
    })
};

/* feature processor utilities */

function createShape(layer, coordinates, options, builder) {
    var vectors = readVectors(coordinates);
    layer.add(builder(vectors, options));

    return vectors.length;
} // createShape

function readVectors(coordinates) {
    var count = coordinates ? coordinates.length : 0,
        positions = new Array(count);

    for (var ii = count; ii--; ) {
        positions[ii] = new Pos(coordinates[ii][1], coordinates[ii][0]);
    } // for

    return Position.vectorize(positions, VECTORIZE_OPTIONS);
} // getLineStringVectors

/* feature processor functions */

function processLineString(layer, featureData, options, builders) {
    var vectors = readVectors(featureData && featureData.coordinates ? featureData.coordinates : []);

    return createShape(layer, vectors, options, builders.line);
} // processLineString

function processMultiLineString(layer, featureData, options, builders) {
    var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
        pointsProcessed = 0;

    for (var ii = coordinates.length; ii--; ) {
        pointsProcessed += createShape(layer, coordinates[ii], options, builders.line);
    } // for

    return pointsProcessed;
} // processMultiLineString

function processPoint(layer, featureData, options, builders) {
    var points = readVectors([featureData.coordinates], VECTORIZE_OPTIONS);

    if (points.length > 0) {
        var marker = builders.marker(points[0], options);

        if (marker) {
            layer.add(marker);
            return points.length;
        } // if
    } // if
} // processPoint

function processPolygon(layer, featureData, options, builders) {
    var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [];
    if (coordinates.length > 0) {
        return createShape(layer, coordinates[0], options, builders.poly);
    } // if

    return 0;
} // processPolygon

function processMultiPolygon(layer, featureData, options, builders) {
    var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
        pointsProcessed = 0;

    for (var ii = 0; ii < coordinates.length; ii++) {
        pointsProcessed += createShape(layer, coordinates[ii][0], options, builders.poly);
    } // for

    return pointsProcessed;
} // processMultiPolygon

/* define the GeoJSON parser */

var GeoJSONParser = function(data, callback, options, builders) {
    options = COG.extend({
        rowPreParse: null,
        simplify: false,
        layerPrefix: 'geojson-'
    }, options);

    builders = COG.extend({
        marker: function(xy, builderOpts) {
            return new Marker({
                xy: xy
            });
        },

        line: function(vectors, builderOpts) {
            return new Poly(vectors, COG.extend({}, options, builderOpts));
        },

        poly: function(vectors, builderOpts) {
            return new Poly(vectors, COG.extend({
                fill: true
            }, options, builderOpts));
        }
    }, builders);

    var VECTORS_PER_CYCLE = 500,
        rowPreParse = options.rowPreParse,
        layerPrefix = options.layerPrefix,
        featureIndex = 0,
        totalFeatures = 0,
        childParser = null,
        childCount = 0,
        layers = {};

    if (! data) {
        return;
    } // if

    if (! isType(data, typeArray)) {
        data = [data];
    } // if

    /* parser functions */

    function addFeature(definition, featureInfo) {
        var processor = definition.processor,
            layerId = layerPrefix + definition.group,
            featureOpts = COG.extend({}, definition, options, {
                properties: featureInfo.properties
            });

        if (processor) {
            return processor(
                getLayer(layerId, definition.layerClass),
                featureInfo.data,
                featureOpts,
                builders);
        } // if

        return 0;
    } // addFeature

    function extractFeatureInfo(featureData, properties) {
        var featureType = featureData && featureData.type ? featureData.type.toLowerCase() : null;

        if (featureType && featureType === FEATURE_TYPE_FEATURE) {
            return extractFeatureInfo(featureData.geometry, featureData.properties);
        }
        else {
            return {
                type: featureType,
                isCollection: (featureType ? featureType === FEATURE_TYPE_COLLECTION : false),
                definition: featureDefinitions[featureType],
                data: featureData,
                properties: properties ? properties : featureData.properties
            };
        } // if..else
    } // extractFeatureInfo

    function featureToPoly(feature, callback) {
    } // featureToPrimitives

    function getLayer(layerId, layerClass) {
        var layer = layers[layerId];

        if (! layer) {
            layer = new layerClass({
                id: layerId
            });

            layers[layerId] = layer;
        } // if

        return layer;
    } // getLayer

    function parseComplete(evt) {
        if (callback) {
            callback(layers);
        } // if
    } // parseComplete

    function processData(tickCount) {
        var cycleCount = 0,
            childOpts = COG.extend({}, options),
            ii = featureIndex;

        tickCount = tickCount ? tickCount : new Date().getTime();

        if (childParser) {
            return;
        }

        for (; ii < totalFeatures; ii++) {
            var featureInfo = extractFeatureInfo(rowPreParse ? rowPreParse(data[ii]) : data[ii]),
                processedCount = null;

            if (featureInfo.isCollection) {
                childOpts.layerPrefix = layerPrefix + (childCount++) + '-';

                childParser = new GeoJSONParser(
                    featureInfo.data.features,
                    function(childLayers) {
                        childParser = null;

                        for (var layerId in childLayers) {
                            layers[layerId] = childLayers[layerId];
                        } // for

                        if (featureIndex >= totalFeatures) {
                            parseComplete();
                        } // if
                    }, childOpts);

                processedCount += 1;
            }
            else if (featureInfo.definition) {
                processedCount = addFeature(featureInfo.definition, featureInfo);
            } // if..else

            cycleCount += processedCount ? processedCount : 1;

            if (cycleCount >= VECTORS_PER_CYCLE) {
                break;
            } // if
        } // for

        featureIndex = ii + 1;

        if (childParser || (featureIndex < totalFeatures)) {
            animFrame(processData);
        }
        else {
            parseComplete();
        }
    } // processData

    /* run the parser */

    totalFeatures = data.length;
    animFrame(processData);
};

var GeoJSON = exports.GeoJSON = {
    parse: function(data, callback, options) {
        return new GeoJSONParser(data, callback, options);
    }
};

/**
# T5.GeoShape
_extends:_ T5.Shape


This is a special type of T5.Poly that will take positions for the first
argument of the constructor rather than vectors.  If the initialization
parameter `autoParse` is set to true (which it is by default), this will
parsed by the T5.Geo.Position.parse function and converted into a GeoXY.

## Constructor
`new T5.GeoShape(positions, params);`

### Initialization Parameters
- autoParse (boolean, default = true) - whether or not the values in the
positions array that is the first constructor argument should be run through
the T5.Geo.Position.parse function or not.  Note that this function is capable of
handling both string and T5.Geo.Position values as position values are
simply passed straight through.

*/
var GeoShape = exports.GeoShape = function(positions, params) {
    params = COG.extend({
        autoParse: true
    }, params);

    var vectors = new Array(positions.length),
        autoParse = params.autoParse,
        parse = T5.Geo.Position.parse;

    for (var ii = positions.length; ii--; ) {
        vectors[ii] = T5.GeoXY.init(
            autoParse ? parse(positions[ii]) : positions[ii]
        );
    } // for

    return new T5.Poly(vectors, params);
};

    exports.Geo = {
        distanceToString: distanceToString,
        dist2rad: dist2rad,
        radsPerPixel: radsPerPixel,

        Position: Position,
        BoundingBox: BoundingBox,
        Radius: Radius,

        Address: Address,
        A: addrTools,

        GeoJSON: GeoJSON
    };
})(T5);
