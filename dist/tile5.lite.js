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
        return target.obsHandlers;
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

        var attached = target.bind || target.trigger || target.unbind;
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
            change = endValue - startValue,
            tween = {};

        function runTween(tickCount) {
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
        testContext = testCanvas.getContext('2d');

    /* define test functions */

    function checkPointInPath() {
        var transformed;

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

    results.pipTransformed = checkPointInPath();

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
        pannableOpts = null,
        handlerInstances = [],
        pans = [],
        totalDeltaX,
        totalDeltaY;


    /* internals */

    function checkInertia(events) {
        var evtCount = events.length,
            includedCount,
            vectorX = 0,
            vectorY = 0,
            diffX,
            diffY,
            distance,
            theta,
            extraDistance,
            totalTicks = 0, // evtCount > 0 ? (new Date().getTime() - events[evtCount-1].ticks) : 0,
            xyRatio = 1,
            ii;

        ii = events.length;
        while (--ii > 1 && totalTicks < INERTIA_TIMEOUT) {
            totalTicks += (events[ii].ticks - events[ii - 1].ticks);
        } // while

        includedCount = evtCount - ii;

        if (includedCount > 1) {
            diffX = events[evtCount - 1].x - events[ii].x;
            diffY = events[evtCount - 1].y - events[ii].y;
            distance = Math.sqrt(diffX * diffX + diffY * diffY) | 0;

            if (distance > INERTIA_IDLE_DISTANCE) {
                diffX = events[evtCount - 1].x - events[0].x;
                diffY = events[evtCount - 1].y - events[0].y;
                distance = Math.sqrt(diffX * diffX + diffY * diffY) | 0;
                theta = Math.asin(diffY / distance);

                extraDistance = distance * INERTIA_DURATION / totalTicks | 0;
                extraDistance = extraDistance > INERTIA_MAXDIST ? INERTIA_MAXDIST : extraDistance;

                inertiaPan(
                    Math.cos(diffX > 0 ? theta : Math.PI - theta) * extraDistance,
                    Math.sin(theta) * extraDistance,
                    COG.easing('sine.out'),
                    INERTIA_DURATION);
            } // if
        } // if
    } // checkInertia

    function deltaGreaterThan(value) {
        return Math.abs(totalDeltaX) > value || Math.abs(totalDeltaY) > value;
    } // deltaGreaterThan

    function handlePointerMove(evt, absXY, relXY, deltaXY) {
        if (pannableOpts) {
            pans[pans.length] = {
                ticks: new Date().getTime(),
                x: deltaXY.x,
                y: deltaXY.y
            };

            observable.trigger('pan', deltaXY.x, deltaXY.y);
        } // if

        totalDeltaX += deltaXY.x ? deltaXY.x : 0;
        totalDeltaY += deltaXY.y ? deltaXY.y : 0;
    } // handlePanMove

    function handlePointerDown(evt, absXY, relXY) {
        pans = [];

        totalDeltaX = 0;
        totalDeltaY = 0;
    } // handlePointerDown

    function handlePointerUp(evt, absXY, relXY) {
        if (! deltaGreaterThan(MAXMOVE_TAP)) {
            observable.trigger('tap', absXY, relXY);
        }
        else if (pannableOpts) {
            checkInertia(pans);
        }
    } // handlePointerUP

    function inertiaPan(changeX, changeY, easing, duration) {
        var currentX = 0,
            currentY = 0,
            lastX = 0;


        COG.tweenValue(0, changeX, easing, duration, function(val, complete) {
            lastX = currentX;
            currentX = val;
        });

        COG.tweenValue(0, changeY, easing, duration, function(val, complete) {
            observable.trigger('pan', currentX - lastX, val - currentY);
            currentY = val;
        });
    } // inertia pan

    /* exports */

    function bind() {
        return observable.bind.apply(null, arguments);
    } // bind

    function pannable(opts) {
        pannableOpts = COG.extend({
            inertia: true
        }, opts);

        return self;
    } // pannable

    function unbind() {
        observable.unbind();

        for (var ii = 0; ii < handlerInstances.length; ii++) {
            handlerInstances[ii].unbind();
        } // for

        return self;
    } // unbind

    /* define the object */

    var self = {
        bind: bind,
        pannable: pannable,
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

    function genBinder(useBody) {
        return function(evtName, callback, customTarget) {
            var target = customTarget ? customTarget : (useBody ? document.body : document);

            target.addEventListener(evtName, callback, false);
        };
    } // bindDoc

    function genUnbinder(useBody) {
        return function(evtName, callback, customTarget) {
            var target = customTarget ? customTarget : (useBody ? document.body : document);

            target.removeEventListener(evtName, callback, false);
        };
    } // unbindDoc

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

    function ieBind(evtName, callback, customTarget) {
        (customTarget ? customTarget : document).attachEvent('on' + evtName, callback);
    } // ieBind

    function ieUnbind(evtName, callback, customTarget) {
        (customTarget ? customTarget : document).detachEvent('on' + evtName, callback);
    } // ieUnbind

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
            bindToBody: false,
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

        opts.binder = opts.isIE ? ieBind : genBinder(opts.bindToBody);
        opts.unbinder = opts.isIE ? ieUnbind : genUnbinder(opts.bindToBody);

        return new EventMonitor(target, getHandlers(opts.types, capabilities), opts);
    } // watch

var InertiaMonitor = function(upX, upY, params) {
    params = COG.extend({
        inertiaTrigger: 20
    }, params);

    var INERTIA_TIMEOUT = 300,
        INERTIA_DURATION = 300,
        INERTIA_MAXDIST = 500;

    var startTicks = new Date().getTime(),
        worker;

    /* internals */

    function calcDistance(x1, y1, x2, y2) {
        var distX = x1 - x2,
            distY = y1 - y2;

        return Math.sqrt(distX * distX + distY * distY);
    } // calcDistance

    function calculateInertia(currentX, currentY, distance, tickDiff) {
        var theta = Math.asin((upY - currentY) / distance),
            extraDistance = distance * (INERTIA_DURATION / tickDiff) >> 0;

        extraDistance = extraDistance > INERTIA_MAXDIST ? INERTIA_MAXDIST : extraDistance;

        theta = currentX > upX ? theta : Math.PI - theta;

        self.trigger(
            'inertia',
            upX,
            upY,
            Math.cos(theta) * extraDistance | 0,
            Math.sin(theta) * -extraDistance | 0);
    } // calculateInertia

    /* exports */

    function check(currentX, currentY) {
        var distance = calcDistance(upX, upY, currentX, currentY),
            tickDiff = new Date().getTime() - startTicks;

        if ((tickDiff < INERTIA_TIMEOUT) && (distance > params.inertiaTrigger)) {
            calculateInertia(currentX, currentY, distance, tickDiff);
        }
        else if (tickDiff > INERTIA_TIMEOUT) {
            self.trigger('timeout');
        } // if..else
    } // check

    var self = {
        check: check
    };

    COG.observable(self);

    return self;
};

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
        x: calcLeft,
        y: calcTop
    };
} // getOffset

function genEventProps(source, evt) {
    return {
        source: source,
        target: evt.target ? evt.target : evt.srcElement
    };
} // genEventProps

function matchTarget(evt, targetElement) {
    var targ = evt.target ? evt.target : evt.srcElement;
    while (targ && (targ !== targetElement) && targ.nodeName && (targ.nodeName.toUpperCase() != 'CANVAS')) {
        targ = targ.parentNode;
    } // while

    return targ && (targ === targetElement);
} // matchTarget

function pointerOffset(absPoint, offset) {
    return {
        x: absPoint.x - (offset ? offset.x : 0),
        y: absPoint.y - (offset ? offset.y : 0)
    };
} // triggerPositionEvent

function preventDefault(evt) {
    if (evt.preventDefault) {
        evt.preventDefault();
        evt.stopPropagation();
    }
    else if (evt.cancelBubble) {
        evt.cancelBubble();
    } // if..else
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
        offset,
        currentX,
        currentY,
        lastX,
        lastY;

    /* internal functions */

    function handleClick(evt) {
        if (matchTarget(evt, targetElement)) {
            var clickXY = point(
                evt.pageX ? evt.pageX : evt.screenX,
                evt.pageY ? evt.pageY : evt.screenY);

            observable.triggerCustom(
                'tap',
                genEventProps('mouse', evt),
                clickXY,
                pointerOffset(clickXY, getOffset(targetElement))
            );
        } // if
    } // handleClick

    function handleDoubleClick(evt) {
        COG.info('captured double click');

        if (matchTarget(evt, targetElement)) {
            var clickXY = point(
                evt.pageX ? evt.pageX : evt.screenX,
                evt.pageY ? evt.pageY : evt.screenY);

            COG.info('captured double click + target matched');

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
                targetElement.style.cursor = 'move';
                preventDefault(evt);

                lastX = evt.pageX ? evt.pageX : evt.screenX;
                lastY = evt.pageY ? evt.pageY : evt.screenY;
                start = point(lastX, lastY);
                offset = getOffset(targetElement);

                observable.triggerCustom(
                    'pointerDown',
                    genEventProps('mouse', evt),
                    start,
                    pointerOffset(start, offset)
                );
            }
        } // if
    } // mouseDown

    function handleMouseMove(evt) {
        currentX = evt.pageX ? evt.pageX : evt.screenX;
        currentY = evt.pageY ? evt.pageY : evt.screenY;

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

        if (! offset) {
            offset = getOffset(targetElement);
        } // if

        observable.triggerCustom(
            eventName,
            genEventProps('mouse', evt),
            current,
            pointerOffset(current, offset),
            point(deltaX, deltaY)
        );

        if (typeof updateLast == 'undefined' || updateLast) {
            lastX = evtX;
            lastY = evtY;
        } // if
    } // triggerCurrent

    /* exports */

    function unbind() {
        opts.unbinder('mousedown', handleMouseDown, false);
        opts.unbinder('mousemove', handleMouseMove, false);
        opts.unbinder('mouseup', handleMouseUp, false);

        opts.unbinder("mousewheel", handleWheel, document);
        opts.unbinder("DOMMouseScroll", handleWheel, document);
    } // unbind

    opts.binder('mousedown', handleMouseDown, false);
    opts.binder('mousemove', handleMouseMove, false);
    opts.binder('mouseup', handleMouseUp, false);
    opts.binder('dblclick', handleDoubleClick, false);

    opts.binder('mousewheel', handleWheel, document);
    opts.binder('DOMMouseScroll', handleWheel, document);

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
                relTouches = copyTouches(changedTouches, offset.x, offset.y);

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
            evt.preventDefault();

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
                        copyTouches(touchesCurrent, offset.x, offset.y),
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
                        copyTouches(touchesCurrent, offset.x, offset.y)
                    );
                } // if
            } // if

            touchesLast = copyTouches(touchesCurrent);
        } // if
    } // handleTouchMove

    function handleTouchEnd(evt) {
        if (matchTarget(evt, targetElement)) {
            var changedTouches = getTouchData(evt, 'changedTouches'),
                offsetTouches = copyTouches(changedTouches, offset.x, offset.y);

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
        opts.unbinder('touchstart', handleTouchStart, false);
        opts.unbinder('touchmove', handleTouchMove, false);
        opts.unbinder('touchend', handleTouchEnd, false);
    } // unbind

    opts.binder('touchstart', handleTouchStart, false);
    opts.binder('touchmove', handleTouchMove, false);
    opts.binder('touchend', handleTouchEnd, false);

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

var TWO_PI = Math.PI * 2,
    HALF_PI = Math.PI / 2;

var abs = Math.abs,
    ceil = Math.ceil,
    floor = Math.floor,
    min = Math.min,
    max = Math.max,
    pow = Math.pow,
    sqrt = Math.sqrt,
    log = Math.log,
    round = Math.round,
    sin = Math.sin,
    asin = Math.asin,
    cos = Math.cos,
    acos = Math.acos,
    tan = Math.tan,
    atan = Math.atan,
    atan2 = Math.atan2;
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


/**
# T5.XY
This module contains simple functions for creating and manipulating an object literal that
contains an `x` and `y` value.  Previously this functionaliy lived in the T5.V module but has
been moved to communicate it's more generic implementation.  The T5.V module still exists, however,
and also exposes the functions of this module for the sake of backward compatibility.
*/
var XY = (function() {
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
        if (! count) {
            count = points.length;
        } // if

        if (count <= 1) {
            throw new Error("Cannot determine edge " +
                "distances for a vector array of only one vector");
        } // if

        var fnresult = {
            edges: new Array(count - 1),
            accrued: new Array(count - 1),
            total: 0
        };

        for (var ii = 0; ii < count - 1; ii++) {
            var diff = difference(points[ii], points[ii + 1]);

            fnresult.edges[ii] =
                sqrt((diff.x * diff.x) + (diff.y * diff.y));
            fnresult.accrued[ii] =
                fnresult.total + fnresult.edges[ii];

            fnresult.total += fnresult.edges[ii];
        } // for

        return fnresult;
    } // edges

    /**
    ### equals(pt1, pt2)
    Return true if the two points are equal, false otherwise.  __NOTE:__ This function
    does not automatically floor the values so if the point values are floating point
    then floating point precision errors will likely occur.
    */
    function equals(pt1, pt2) {
        return pt1.x === pt2.x && pt1.y === pt2.y;
    } // equals

    /**
    ### extendBy(xy, theta, delta)
    */
    function extendBy(xy, theta, delta) {
        var xDelta = cos(theta) * delta,
            yDelta = sin(theta) * delta;

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
            results[ii] = init(~~points[ii].x, ~~points[ii].y);
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

            minX = (typeof minX === 'undefined') || xy.x < minX ? xy.x : minX;
            minY = (typeof minY === 'undefined') || xy.y < minY ? xy.y : minY;

            maxX = (typeof maxX === 'undefined') || xy.x > maxX ? xy.x : maxX;
            maxY = (typeof maxY === 'undefined') || xy.y > maxY ? xy.y : maxY;
        } // for

        return XYRect.init(minX, minY, maxX, maxY);
    } // getRect

    /**
    ### init(x, y)
    Initialize a new point that can be used in Tile5.  A point is simply an
    object literal with the attributes `x` and `y`.  If initial values are passed
    through when creating the point these will be used, otherwise 0 values will
    be used.
    */
    function init(initX, initY) {
        return {
            x: initX ? initX : 0,
            y: initY ? initY : 0
        };
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
        return init(xy.x + offsetX, xy.y + (offsetY ? offsetY : offsetX));
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

        generalization = generalization ? generalization : XY.VECTOR_SIMPLIFICATION;

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

        epsilon = epsilon ? epsilon : XY.VECTOR_SIMPLIFICATION;

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

        return XY.init(absX, absY);
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
    ### center(rect)
    Return a xy composite for the center of the rect
    */
    function center(rect) {
        return XY.init(rect.x1 + (rect.width >> 1), rect.y1 + (rect.height >> 1));
    } // center

    /**
    ### copy(rect)
    Return a duplicate of the XYRect
    */
    function copy(rect) {
        return init(rect.x1, rect.y1, rect.x2, rect.y2);
    } // copy

    /**
    ### diagonalSize(rect)
    Return the distance from corner to corner of the rect
    */
    function diagonalSize(rect) {
        return sqrt(rect.width * rect.width + rect.height * rect.height);
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
        x1 = x1 ? x1 : 0;
        y1 = y1 ? y1 : 0;
        x2 = typeof x2 !== 'undefined' ? x2 : x1;
        y2 = typeof y2 !== 'undefined '? y2 : y2;

        return {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,

            width: x2 - x1,
            height: y2 - y1
        };
    } // init

    /**
    ### intersect(rect1, rect2)
    Returns the intersecting rect between the two specified XYRect composites
    */
    function intersect(rect1, rect2) {
        var x1 = max(rect1.x1, rect2.x1),
            y1 = max(rect1.y1, rect2.y1),
            x2 = min(rect1.x2, rect2.x2),
            y2 = min(rect1.y2, rect2.y2),
            r = init(x1, y1, x2, y2);

        return ((r.width > 0) && (r.height > 0)) ? r : null;
    } // intersect

    /**
    ### toString(rect)
    Return the string representation of the rect
    */
    function toString(rect) {
        return rect ? ('[' + rect.x1 + ', ' + rect.y1 + ', ' + rect.x2 + ', ' + rect.y2 + ']') : '';
    } // toString

    /**
    ### union(rect1, rect2)
    Return the minimum rect required to contain both of the supplied rects
    */
    function union(rect1, rect2) {
        if (rect1.width === 0 || rect1.height === 0) {
            return copy(rect2);
        }
        else if (rect2.width === 0 || rect2.height === 0) {
            return copy(rect1);
        }
        else {
            var x1 = min(rect1.x1, rect2.x1),
                y1 = min(rect1.y1, rect2.y1),
                x2 = max(rect1.x2, rect2.x2),
                y2 = max(rect1.y2, rect2.y2),
                r = init(x1, y1, x2, y2);

            return ((r.width > 0) && (r.height > 0)) ? r : null;
        } // if..else
    } // union

    /* module definition */

    return {
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
# T5.Dimensions
A module of utility functions for working with dimensions composites

## Dimension Attributes

Dimensions created using the init function will have the following attributes:
- `width`
- `height`


## Functions
*/
var Dimensions = (function() {

    /* exports */

    /**
    ### getAspectRatio(dimensions)
    Return the aspect ratio for the `dimensions` (width / height)
    */
    function getAspectRatio(dimensions) {
        return dimensions.height !== 0 ?
            dimensions.width / dimensions.height : 1;
    } // getAspectRatio

    /**
    ### getCenter(dimensions)
    Get the a XY composite for the center of the `dimensions` (width / 2, height  / 2)
    */
    function getCenter(dimensions) {
        return XY.init(dimensions.width >> 1, dimensions.height >> 1);
    } // getCenter

    /**
    ### getSize(dimensions)
    Get the size for the diagonal for the `dimensions`
    */
    function getSize(dimensions) {
        return sqrt(pow(dimensions.width, 2) + pow(dimensions.height, 2));
    } // getSize

    /**
    ### init(width, height)
    Create a new dimensions composite (width, height)
    */
    function init(width, height) {
        width = width ? width : 0;

        return {
            width: width,
            height: height ? height : width
        };
    } // init

    /* module definition */

    return {
        getAspectRatio: getAspectRatio,
        getCenter: getCenter,
        getSize: getSize,
        init: init
    };
})(); // dimensionTools
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
    function initHit(type, target, opts) {
        opts = COG.extend({
            type: type,
            target: target,
            drag: false
        }, opts);

        return opts;
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
            XY.init(hitData.x, hitData.y)
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
var deviceConfigs = null,
    deviceCheckOrder = [],
    detectedConfig = null,
    urlBridgeTimeout = 0,
    queuedBridgeUrls = [],
    bridgeIgnoreMessages = ['view.wake', 'tile.loaded'];

function processUrlBridgeNotifications() {
    while (queuedBridgeUrls.length > 0) {
        var notificationUrl = queuedBridgeUrls.shift();
        document.location = notificationUrl;
    } // while

    urlBridgeTimeout = 0;
} // processUrlBridgeNotifications

function shouldBridgeMessage(message) {
    var shouldBridge = true;
    for (var ii = bridgeIgnoreMessages.length; ii--; ) {
        shouldBridge = shouldBridge && (message != bridgeIgnoreMessages[ii]);
    } // for

    return shouldBridge;
} // shouldBridgeMessage

function messageToUrl(message, args) {
    var params = [];

    for (var key in args) {
        if (key) {
            params.push(key + "=" + escape(args[key]));
        }
    } // for

    return "tile5://" + message + "/" + (params.length > 0 ? "?" + params.join("&") : "");
} // messageToUrl

function bridgeNotifyLog(message, args) {
    if (shouldBridgeMessage(message)) {
        COG.info("would push url: " + messageToUrl(message, args));
    } // if
} // bridgeCommandEmpty

function bridgeNotifyUrl(message, args) {
    if (shouldBridgeMessage(message)) {
        queuedBridgeUrls.push(messageToUrl(message, args));

        if (! urlBridgeTimeout) {
            urlBridgeTimeout = setTimeout(processUrlBridgeNotifications, 100);
        } // if
    } // if
} // bridgeNotifyUrlScheme

/* event binding functions */

function genBindDoc(useBody) {
    return function(evtName, callback, customTarget) {
        var target = customTarget ? customTarget : (useBody ? document.body : document);

        target.addEventListener(evtName, callback, false);
    };
} // bindDoc

function genUnbindDoc(useBody) {
    return function(evtName, callback, customTarget) {
        var target = customTarget ? customTarget : (useBody ? document.body : document);

        target.removeEventListener(evtName, callback, false);
    };
} // unbindDoc

function bindIE(evtName, callback, customTarget) {
    (customTarget ? customTarget : document).attachEvent('on' + evtName, callback);
} // bindIE

function unbindIE(evtName, callback, customTarget) {
    (customTarget ? customTarget : document).detachEvent('on' + evtName, callback);
} // unbindIE

/* load the device config */

function loadDeviceConfigs() {
    deviceConfigs = {
        base: {
            name: "Unknown",

            /* default event binding implementation */
            bindEvent: genBindDoc(),
            unbindEvent: genUnbindDoc(),

            supportsTouch: 'ontouchstart' in window,
            imageCacheMaxSize: null,
            getScaling: function() {
                return 1;
            },
            maxImageLoads: null,
            requireFastDraw: false,
            bridgeNotify: bridgeNotifyLog,
            targetFps: null
        },

        ie: {
            name: "MSIE",
            regex: /msie/i,

            bindEvent: bindIE,
            unbindEvent: unbindIE,

            requireFastDraw: false,
            targetFps: 25
        },

        ipod: {
            name: "iPod Touch",
            regex: /ipod/i,
            imageCacheMaxSize: 6 * 1024,
            maxImageLoads: 4,
            requireFastDraw: false,
            bridgeNotify: bridgeNotifyUrl,
            targetFps: 25
        },

        iphone: {
            name: "iPhone",
            regex: /iphone/i,
            imageCacheMaxSize: 6 * 1024,
            maxImageLoads: 4,
            bridgeNotify: bridgeNotifyUrl
        },

        ipad: {
            name: "iPad",
            regex: /ipad/i,
            imageCacheMaxSize: 6 * 1024,
            bridgeNotify: bridgeNotifyUrl
        },

        android: {
            name: "Android OS <= 2.1",
            regex: /android/i,

            /* document event binding (use body) */
            bindEvent: genBindDoc(true),
            unbindEvent: genUnbindDoc(true),

            supportsTouch: true,
            getScaling: function() {
                return 1 / window.devicePixelRatio;
            },
            bridgeNotify: bridgeNotifyUrl
        },

        froyo: {
            name: "Android OS >= 2.2",
            regex: /froyo/i,
            eventTarget: document.body,
            supportsTouch: true,
            bridgeNotify: bridgeNotifyUrl
        }
    };

    deviceCheckOrder = [
        deviceConfigs.froyo,
        deviceConfigs.android,
        deviceConfigs.ipod,
        deviceConfigs.iphone,
        deviceConfigs.ipad,
        deviceConfigs.ie
    ];
} // loadDeviceConfigs

function getConfig() {
    if (! deviceConfigs) {
        loadDeviceConfigs();
    } // if

    if (! detectedConfig) {
        COG.info("ATTEMPTING TO DETECT PLATFORM: UserAgent = " + navigator.userAgent);

        for (var ii = 0; ii < deviceCheckOrder.length; ii++) {
            var testPlatform = deviceCheckOrder[ii];

            if (testPlatform.regex && testPlatform.regex.test(navigator.userAgent)) {
                detectedConfig = COG.extend({}, deviceConfigs.base, testPlatform);
                COG.info("PLATFORM DETECTED AS: " + detectedConfig.name);
                break;
            } // if
        } // for

        if (! detectedConfig) {
            COG.warn("UNABLE TO DETECT PLATFORM, REVERTING TO BASE CONFIGURATION");
            detectedConfig = deviceConfigs.base;
        }

        COG.info("CURRENT DEVICE PIXEL RATIO = " + window.devicePixelRatio);
    } // if

    return detectedConfig;
} // getConfig
/**
# T5.Images
_module_


The T5.Images module provides image loading support for the rest of the
Tile5 library.


## Module Functions
*/
var Images = (function() {
    var TIMEOUT_CHECK_INTERVAL = 10000;

    var images = {},
        canvasCounter = 0,
        loadWatchers = {},
        imageCounter = 0,
        queuedImages = [],
        loadingImages = [],
        cachedImages = [],
        imageCacheFullness = 0,
        lastTimeoutCheck = 0,
        clearingCache = false;

    /* internal functions */

    function loadNextImage() {
        var maxImageLoads = getConfig().maxImageLoads;

        if ((! maxImageLoads) || (loadingImages.length < maxImageLoads)) {
            var imageData = queuedImages.shift(),
                tickCount = T5.ticks();

            if (imageData) {
                loadingImages[loadingImages.length] = imageData;

                imageData.image.onload = handleImageLoad;
                imageData.image.src = imageData.url;
                imageData.requested = tickCount;
            } // if..else

            if (tickCount - lastTimeoutCheck > TIMEOUT_CHECK_INTERVAL) {
                checkTimeoutsAndCache(tickCount);
            } // if
        } // if

    } // loadNextImage

    function cleanupImageCache() {
        clearingCache = true;
        try {
            var halfLen = cachedImages.length >> 1;
            if (halfLen > 0) {
                cachedImages.sort(function(itemA, itemB) {
                    return itemA.created - itemB.created;
                });

                for (var ii = halfLen; ii--; ) {
                    delete images[cachedImages[ii].url];
                } // for

                cachedImages.splice(0, halfLen);
            } // if
        }
        finally {
            clearingCache = false;
        } // try..finally

        module.trigger('cacheCleared');
    } // cleanupImageCache

    function checkTimeoutsAndCache(currentTickCount) {
        var timedOutLoad = false, ii = 0,
            config = getConfig();

        while (ii < loadingImages.length) {
            var loadingTime = currentTickCount - loadingImages[ii].requested;
            if (loadingTime > (module.loadTimeout * 1000)) {
                loadingImages.splice(ii, 1);
                timedOutLoad = true;
            }
            else {
                ii++;
            } // if..else
        } // while

        if (timedOutLoad) {
            loadNextImage();
        } // if

        if (config && config.imageCacheMaxSize) {
            imageCacheFullness = (cachedImages.length * module.avgImageSize) / config.imageCacheMaxSize;
            if (imageCacheFullness >= 1) {
                cleanupImageCache();
            } // if
        } // if

        lastTimeoutCheck = currentTickCount;
    } // checkTimeoutsAndCache

    function postProcess(imageData) {
        if (! imageData.image) { return; }

        globalImageData = imageData;

        var width = imageData.realSize ? imageData.realSize.width : imageData.image.width,
            height = imageData.realSize ? imageData.realSize.height : imageData.image.height,
            canvas = newCanvas(width, height),
            context = canvas.getContext('2d'),
            offset = imageData.offset ? imageData.offset : T5.XY.init();

        if (imageData.background) {
            context.drawImage(imageData.background, 0, 0);
        } // if

        if (imageData.drawBackground) {
            imageData.drawBackground(context);
        } // if

        if (imageData.customDraw) {
            imageData.customDraw(context, imageData);
        }
        else {
            context.drawImage(imageData.image, offset.x, offset.y);
        } // if..else

        if (imageData.postProcess) {
            imageData.postProcess(context, imageData);
        }
        imageData.image = canvas;
    } // applyBackground

    /* event handlers */

    function handleImageLoad() {
        var imageData = loadWatchers[this.id],
            ii;

        if (imageData && isLoaded(imageData.image)) {
            imageData.loaded = true;
            imageData.hitCount = 1;

            for (ii = loadingImages.length; ii--; ) {
                if (loadingImages[ii].image.src == this.src) {
                    loadingImages.splice(ii, 1);
                    break;
                } // if
            } // for

            if (imageData.background || imageData.postProcess || imageData.drawBackground || imageData.customDraw) {
                postProcess(imageData);
            } // if

            for (ii = imageData.callbacks.length; ii--; ) {
                if (imageData.callbacks[ii]) {
                    imageData.callbacks[ii](this, false);
                } // if
            } // for

            imageData.callbacks = [];

            cachedImages[cachedImages.length] = {
                url: this.src,
                created: imageData.requested
            };

            delete loadWatchers[this.id];

            loadNextImage();
        } // if
    } // handleImageLoad

    function isLoaded(image) {
        return image.complete && image.width > 0;
    } // isLoaded

    /* exports */

    /**
    ### cancelLoad()
    */
    function cancelLoad() {
        var ii;

        for (ii = loadingImages.length; ii--; ) {
            delete images[loadingImages[ii].url];
        } // for

        loadingImages = [];

        for (ii = queuedImages.length; ii--; ) {
            delete images[queuedImages[ii].url];
        } // for

        queuedImages = [];
    } // cancelLoad

    /**
    ### get(url)
    This function is used to retrieve the image specified by the url.  If the image
    has already been loaded, then the image is automatically returned from the
    function but if not, then a null value is returned.

    If an optional `callback` argument is provided, then this indicates to the function
    that if the image is not already loaded, it should be loaded and this the is passed
    through to the load method function.

    #### Example Code
    ~ var image = T5.Images.get('testimage.jpg', function(image) {
    ~
    ~ });
    */
    function get(url, callback, loadArgs) {
        var imageData = null,
            image = null;

        if (! clearingCache) {
            imageData = images[url];
        } // if

        image = imageData ? imageData.image : null;

        if (image && (image.getContext || isLoaded(image))) {
            return image;
        }
        else if (callback) {
            load(url, callback, loadArgs);
        } // if..else

        return null;
    } // get

    /**
    ### load(url, callback, loadArgs)
    */
    function load(url, callback, loadArgs) {
        var imageData = images[url];

        if (! imageData) {
            imageData = COG.extend({
                url: url,
                image: new Image(),
                loaded: false,
                created: T5.ticks(),
                requested: null,
                hitCount: 0,
                callbacks: [callback]
            }, loadArgs);


            imageData.image.id = "resourceLoaderImage" + (imageCounter++);

            images[url] = imageData;
            loadWatchers[imageData.image.id] = imageData;

            queuedImages[queuedImages.length] = imageData;

            loadNextImage();
        }
        else {
            imageData.hitCount++;
            if (isLoaded(imageData.image) && callback) {
                callback(imageData.image, true);
            }
            else {
                imageData.callbacks.push(callback);
            } // if..else
        }

        return imageData;
    } // load

    /**
    ### newCanvas(width, height)
    */
    function newCanvas(width, height) {
        var tmpCanvas = document.createElement('canvas');
        COG.info('creating new canvas');

        tmpCanvas.width = width ? width : 0;
        tmpCanvas.height = height ? height : 0;

        if (typeof FlashCanvas != 'undefined') {
            document.body.appendChild(tmpCanvas);
            FlashCanvas.initElement(tmpCanvas);
        } // if

        return tmpCanvas;
    } // newCanvas

    var module = {
        avgImageSize: 25,
        loadTimeout: 10,

        cancelLoad: cancelLoad,
        get: get,
        load: load,
        newCanvas: newCanvas,

        reset: function() {
            images = {};
        },

        stats: function() {
            return {
                imageLoadingCount: loadingImages.length,
                queuedImageCount: queuedImages.length,
                imageCacheFullness: imageCacheFullness
            };
        }
    }; //

    COG.observable(module);
    return module;
})();
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

    /* generator template definition */

    var Template = function(params) {

    }; // Template

    /* module definition */

    return {
        init: init,
        register: register,

        Template: Template
    };
})();

/**
# T5.Style
The T5.Style module is used to define and apply styles.

## Functions
*/
var Style = (function() {

    var previousStyles = {},
        styles = {};

    /* internal functions */

    /* exports */

    /**
    ### apply(context, styleId)
    */
    function apply(context, styleId) {
        var style = styles[styleId] ? styles[styleId] : styles.basic,
            previousStyle;

        if (context && context.canvas) {
            previousStyle = previousStyles[context.canvas.id];
            previousStyles[context.canvas.id] = styleId;
        } // if

        style.applyToContext(context);

        return previousStyle;
    } // apply

    /**
    ### define(styleId, data)
    */
    function define(styleId, data) {
        styles[styleId] = init(data);

        return styleId;
    } // define

    /**
    ### defineMany(data)
    */
    function defineMany(data) {
        for (var styleId in data) {
            define(styleId, data[styleId]);
        } // for
    } // defineMany

    function get(styleId) {
        return styles[styleId];
    } // get

    /**
    ### init(params)
    */
    function init(params) {
        params = COG.extend({
            lineWidth: undefined,
            lineCap: undefined,
            lineJoin: undefined,
            miterLimit: undefined,
            lineStyle: undefined,

            fillStyle: undefined,

            globalAlpha: undefined,
            globalCompositeOperation: undefined
        }, params);

        var mods = [];

        /* internal functions */

        function fillMods(keyName) {
            var paramVal = params[keyName];

            if (typeof paramVal !== 'undefined') {
                mods.push(function(context) {
                    context[keyName] = paramVal;
                });
            } // if
        } // fillMods

        function reloadMods() {
            mods = [];

            for (var keyName in params) {
                fillMods(keyName);
            } // for
        } // reloadMods

        /* exports */

        function update(keyName, keyVal) {
            params[keyName] = keyVal;
            reloadMods();
        } // update

        /* define _self */

        var _self = {
            applyToContext: function(context) {
                for (var ii = mods.length; ii--; ) {
                    mods[ii](context);
                } // for
            },

            update: update
        };

        /* initialize */

        reloadMods();
        return _self;
    } // init

    /**
    ### load(path, callback)
    */
    function load(path, callback) {
        COG.jsonp(path, function(data) {
            defineMany(data);
        });
    } // load

    /* module definition */

    var module = {
        apply: apply,
        define: define,
        defineMany: defineMany,
        get: get,
        init: init,
        load: load
    };

    defineMany({
        basic: {
            lineWidth: 1,
            strokeStyle: '#000',
            fillStyle: '#fff'
        },

        waypoints: {
            lineWidth: 4,
            strokeStyle: 'rgba(0, 51, 119, 0.9)',
            fillStyle: '#FFF'
        },

        waypointsHover: {
            lineWidth: 4,
            strokeStyle: '#f00',
            fillStyle: '#FFF'
        }
    });

    return module;
})();
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

- `autoSize`

- `id`

- `captureHover` - whether or not hover events should be intercepted by the View.
If you are building an application for mobile devices then you may want to set this to
false, but it's overheads are minimals given no events will be generated.

- `inertia`

- `pannable`

- `scalable`

- `panAnimationEasing`

- `panAnimationDuration`

- `fps` - (int, default = 25) - the frame rate of the view, by default this is set to
25 frames per second but can be increased or decreased to compensate for device
performance.  In reality though on slower devices, the framerate will scale back
automatically, but it can be prudent to set a lower framerate to leave some cpu for
other processes :)

- `turbo` - (bool, default = false) - whether or not all possible performance optimizations
should be implemented.  In this mode certain features such as transparent images in T5.ImageLayer
will not have these effects applied.  Additionally, clipping is disabled and clearing the background
rectangle never happens.  This is serious stuff folks.

- `zoomEasing` - (easing, default = `quad.out`) - The easing effect that should be used when
the user double taps the display to zoom in on the view.

- `zoomDuration` - (int, default = 300) - If the `zoomEasing` parameter is specified then
this is the duration for the tween.


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

### resize
This event is fired when the view has been resized (either manually or
automatically).
<pre>
view.bind('resize', function(evt, width, height) {

});
</pre>

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
view.bind('drawComplete', function(evt, viewRect, tickCount) {
});
</pre>

- offset (T5.Vector) - the view offset that was used for the draw operation
- tickCount - the tick count at the start of the draw operation.


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
        captureDrag: false,
        fastDraw: false,
        inertia: true,
        minRefresh: 1000,
        pannable: false,
        clipping: true,
        scalable: false,
        panAnimationEasing: COG.easing('sine.out'),
        panAnimationDuration: 750,
        pinchZoomAnimateTrigger: 400,
        autoSize: true,
        tapExtent: 10,
        guides: false,
        turbo: false,
        fps: 25,

        minZoom: 1,
        maxZoom: 1,
        zoomEasing: COG.easing('quad.out'),
        zoomDuration: 300,
        zoomLevel: 1
    }, params);

    var TURBO_CLEAR_INTERVAL = 500;

    var layers = [],
        layerCount = 0,
        canvas = document.getElementById(params.container),
        dragObject = null,
        mainContext = null,
        isIE = typeof window.attachEvent != 'undefined',
        flashPolyfill,
        hitFlagged = false,
        minRefresh = params.minRefresh,
        offsetX = 0,
        offsetY = 0,
        lastOffsetX = 0,
        lastOffsetY = 0,
        offsetMaxX = null,
        offsetMaxY = null,
        offsetWrapX = false,
        offsetWrapY = false,
        clipping = params.clipping,
        cycleRect = null,
        cycling = false,
        drawRect,
        guides = params.guides,
        deviceScaling = 1,
        wakeTriggers = 0,
        halfWidth = 0,
        halfHeight = 0,
        hitData = null,
        interactOffset = null,
        interactCenter = null,
        interacting = false,
        layerMinXY = null,
        layerMaxXY = null,
        lastRefresh = 0,
        lastClear = 0,
        lastHitData = null,
        rotation = 0,
        resizeCanvasTimeout = 0,
        scaleFactor = 1,
        scaleTween = null,
        lastScaleFactor = 0,
        lastCycleTicks = 0,
        sizeChanged = false,
        eventMonitor = null,
        turbo = params.turbo,
        tweeningOffset = false,
        viewHeight,
        viewWidth,
        cycleDelay = 1000 / params.fps | 0,
        viewChanges = 0,
        zoomX, zoomY,
        zoomLevel = params.zoomLevel,

        /* state shortcuts */

        stateActive = viewState('ACTIVE'),
        statePan = viewState('PAN'),
        stateZoom = viewState('ZOOM'),
        stateAnimating = viewState('ANIMATING'),

        state = stateActive;

    /* event handlers */

    function handlePan(evt, x, y) {
        if (! dragObject) {
            updateOffset(offsetX - x, offsetY - y);
        } // if
    } // pan

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

        invalidate();
    } // scaleView

    function setZoomCenter(xy) {
        if (! xy) {
            xy = XY.init(halfWidth, halfHeight);
        } // if

        interactOffset = XY.init(offsetX, offsetY);
        interactCenter = XY.offset(xy, offsetX, offsetY);

        zoomX = interactCenter.x;
        zoomY = interactCenter.y;

    } // setZoomCenter

    function getScaledOffset(srcX, srcY) {
        var invScaleFactor = 1 / scaleFactor,
            scaledX = drawRect.x1 + srcX * invScaleFactor,
            scaledY = drawRect.y1 + srcY * invScaleFactor;

        return XY.init(scaledX, scaledY);
    } // getScaledOffset

    function handleContainerUpdate(name, value) {
        canvas = document.getElementById(value);

        attachToCanvas();
    } // handleContainerUpdate

    function handleDoubleTap(evt, absXY, relXY) {
        triggerAll(
            'doubleTap',
            absXY,
            relXY,
            getScaledOffset(relXY.x, relXY.y));

        if (params.scalable) {
            scale(2, relXY, params.zoomEasing, null, params.zoomDuration);
        } // if
    } // handleDoubleTap

    function handlePointerDown(evt, absXY, relXY) {
        dragObject = null;

        initHitData('down', absXY, relXY);

        /*
        elements = hitTest(absXY, relXY, downX, downY);

        for (var ii = elements.length; ii--; ) {
            if (dragStart(elements[ii], downX, downY)) {
                break;
            } // if
        } // for

        COG.info('pointer down on ' + elements.length + ' elements');
        */
    } // handlePointerDown

    function handlePointerHover(evt, absXY, relXY) {
        initHitData('hover', absXY, relXY);

        /*

        var scaledOffset = getScaledOffset(relXY.x, relXY.y);

        hitData = initHitData('hover', scaledOffset.x, )
        hitTest(absXY, relXY, hoverOffset.x, hoverOffset.y, 'hover');
        */
    } // handlePointerHover

    function handlePointerMove(evt, absXY, relXY) {
        dragSelected(absXY, relXY, false);
    } // handlePointerMove

    function handlePointerUp(evt, absXY, relXY) {
        dragSelected(absXY, relXY, true);
    } // handlePointerUp

    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(attachToCanvas, 250);
    } // handleResize

    function handleResync(evt, view) {
        layerMinXY = null;
        layerMaxXY = null;
    } // handleResync

    function handleRotationUpdate(name, value) {
        rotation = value;
    } // handlePrepCanvasCallback

    function handlePointerTap(evt, absXY, relXY) {
        initHitData('tap', absXY, relXY);

        triggerAll('tap', absXY, relXY, getScaledOffset(relXY.x, relXY.y, true));
    } // handlePointerTap

    /* private functions */

    function attachToCanvas(newWidth, newHeight) {
        var ii;

        flashPolyfill = typeof FlashCanvas !== 'undefined';
        COG.info('is flash = ' + flashPolyfill);

        if (canvas) {
            if (params.autoSize && canvas.parentNode) {
                newWidth = canvas.parentNode.offsetWidth;
                newHeight = canvas.parentNode.offsetHeight;
            } // if

            try {
                if (! canvas.id) {
                    canvas.id = params.id + '_canvas';
                } // if

                mainContext = canvas.getContext('2d');
            }
            catch (e) {
                COG.exception(e);
                throw new Error("Could not initialise canvas on specified view element");
            }

            if ((newWidth && newHeight) && (viewHeight !== newHeight || viewWidth !== newWidth)) {
                sizeChanged = true;

                viewWidth = newWidth;
                viewHeight = newHeight;
                halfWidth = viewWidth >> 1;
                halfHeight = viewHeight >> 1;

                _self.trigger('resize', viewWidth, viewHeight);

                for (ii = layerCount; ii--; ) {
                    layers[ii].trigger('resize', viewWidth, viewHeight);
                } // for
            } // if

            for (ii = layerCount; ii--; ) {
                layerContextChanged(layers[ii]);
            } // for

            invalidate();

            captureInteractionEvents();
        } // if
    } // attachToCanvas

    function addLayer(id, value) {
        value.setId(id);
        value.added = ticks();

        value.bind('remove', function() {
            _self.removeLayer(id);
        });

        layerContextChanged(value);

        value.setParent(_self);

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

        eventMonitor = INTERACT.watch(canvas);

        if (params.pannable) {
            eventMonitor.pannable().bind('pan', handlePan);
        } // if

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
    } // captureInteractionEvents

    /*
    The constrain offset function is used to keep the view offset within a specified
    offset using wrapping if allowed.  The function is much more 'if / then / elsey'
    than I would like, and might be optimized at some stage, but it does what it needs to
    */
    function constrainOffset(allowWrap) {
        var testX = offsetWrapX ? offsetX + halfWidth : offsetX,
            testY = offsetWrapY ? offsetY + halfHeight : offsetY;

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
            var scaledOffset = getScaledOffset(relXY.x, relXY.y),
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
            if (layers[ii].getId() == id) {
                return ii;
            } // if
        } // for

        return -1;
    } // getLayerIndex

    /* draw code */

    function calcZoomRect(drawRect) {
        var invScaleFactor = 1 / scaleFactor,
            invScaleFactorNorm = (invScaleFactor - 0.5) * 2;

        zoomX = interactCenter.x + (offsetX - interactOffset.x);
        zoomY = interactCenter.y + (offsetY - interactOffset.y);

        /*
        COG.info(
            'scale factor = ' + scaleFactor +
            ', inv scale factor = ' + invScaleFactor +
            ', inv scale factor norm = ' + invScaleFactorNorm);

        COG.info('zoom x = ' + zoomX + ', y = ' + zoomY);
        COG.info('offset x = ' + offsetX + ', y = ' + offsetY);
        COG.info('interact offset x = ' + interactOffset.x + ', y = ' + interactOffset.y);
        */

        if (drawRect) {
            return XYRect.fromCenter(
                zoomX >> 0,
                zoomY >> 0,
                (drawRect.width * invScaleFactor) >> 0,
                (drawRect.height * invScaleFactor) >> 0);
        } // if
    } // calcZoomRect

    function drawView(drawState, rect, canClip, tickCount) {
        var drawLayer,
            rectCenter = XYRect.center(rect),
            rotation = Math.PI,
            ii = 0;

        if (scaleFactor !== 1) {
            drawRect = calcZoomRect(rect);
        }
        else {
            drawRect = XYRect.copy(rect);
        } // if..else

        if (! canClip) {
            mainContext.clearRect(0, 0, viewWidth, viewHeight);
        } // if

        drawRect.scaleFactor = scaleFactor;

        mainContext.save();

        try {
            if (scaleFactor !== 1) {
                mainContext.scale(scaleFactor, scaleFactor);
            } // if

            layerMinXY = null;
            layerMaxXY = null;

            if (canClip) {
                mainContext.beginPath();

                for (ii = layerCount; ii--; ) {
                    if (layers[ii].clip) {
                        layers[ii].clip(mainContext, drawRect, drawState, _self, tickCount);
                    } // if
                } // for

                mainContext.closePath();
                mainContext.clip();
            } // if

            /* second pass - draw */

            mainContext.globalCompositeOperation = 'source-over';

            for (ii = layerCount; ii--; ) {
                drawLayer = layers[ii];

                if (drawLayer.shouldDraw(state, cycleRect)) {
                    var layerStyle = drawLayer.style,
                        previousStyle = layerStyle ? Style.apply(mainContext, layerStyle) : null;

                    /*
                    TODO: fix the constraining (more appropriate within the constrain offset I would think now)
                    if (drawLayer.minXY) {
                        layerMinXY = layerMinXY ?
                            XY.min(layerMinXY, drawLayer.minXY) :
                            XY.copy(drawLayer.minXY);
                    } // if

                    if (drawLayer.maxXY) {
                        layerMaxXY = layerMaxXY ?
                            XY.max(layerMaxXY, drawLayer.maxXY) :
                            XY.copy(drawLayer.maxXY);
                    } // if
                    */

                    drawLayer.draw(
                        mainContext,
                        drawRect,
                        drawState,
                        _self,
                        tickCount,
                        hitData);

                    if (previousStyle) {
                        Style.apply(mainContext, previousStyle);
                    } // if

                } // if
            } // for

        }
        finally {
            mainContext.restore();
        } // try..finally

        viewChanges = 0;

        triggerAll('drawComplete', rect, tickCount);
    } // drawView

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
            clippable = false;

        if (! (viewChanges | flashPolyfill)) {
            cycling = false;
            return;
        }

        if (true || tickCount - lastCycleTicks > cycleDelay) {
            panning = offsetX !== lastOffsetX || offsetY !== lastOffsetY;

            state = stateActive |
                        (scaleFactor !== 1 ? stateZoom : 0) |
                        (panning ? statePan : 0) |
                        (tweeningOffset ? stateAnimating : 0);

            redrawBG = (state & (stateZoom | statePan)) !== 0;
            interacting = redrawBG && (state & stateAnimating) === 0;

            if (sizeChanged && canvas) {
                if (flashPolyfill) {
                    FlashCanvas.initElement(canvas);
                } // if

                canvas.width = viewWidth;
                canvas.height = viewHeight;

                canvas.style.width = viewWidth + 'px';
                canvas.style.height = viewHeight + 'px';

                sizeChanged = false;
            } // if

            /*
            if (offsetMaxX || offsetMaxY) {
                constrainOffset();
            } // if
            */

            cycleRect = getViewRect();


            for (var ii = layerCount; ii--; ) {
                state = state | (layers[ii].animated ? stateAnimating : 0);

                layers[ii].cycle(tickCount, cycleRect, state);

                clippable = layers[ii].clip || clippable;
            } // for

            drawView(
                state,
                cycleRect,
                clipping && clippable && (! redrawBG),
                tickCount);

            if (hitData) {
                checkHits();
                hitData = null;
            } // if

            if (tickCount - lastRefresh > minRefresh) {
                refresh();
            } // if

            lastCycleTicks = tickCount;
            lastOffsetX = offsetX;
            lastOffsetY = offsetY;
        } // if

        animFrame(cycle);
    } // cycle

    function initHitData(hitType, absXY, relXY) {
        hitData = Hits.init(hitType, absXY, relXY, getScaledOffset(relXY.x, relXY.y, true));

        for (var ii = layerCount; ii--; ) {
            hitFlagged = hitFlagged || (layers[ii].hitGuess ?
                layers[ii].hitGuess(hitData.x, hitData.y, state, _self) :
                false);
        } // for

        if (hitFlagged) {
            invalidate();
        } // if
    } // initHitData

    function layerContextChanged(layer) {
        layer.trigger("contextChanged", mainContext);
    } // layerContextChanged

    /* exports */

    /**
    ### detach
    If you plan on reusing a single canvas element to display different views then you
    will definitely want to call the detach method between usages.
    */
    function detach() {
        if (eventMonitor) {
            eventMonitor.unbind();
        } // if
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

    function invalidate() {
        viewChanges += 1;

        if (! cycling) {
            cycling = true;
            animFrame(cycle);
        } // if
    } // invalidate

    /**
    ### getDimensions(): T5.Dimensions
    Return the Dimensions of the View
    */
    function getDimensions() {
        return Dimensions.init(viewWidth, viewHeight);
    } // getDimensions

    /**
    ### getLayer(id: String): T5.ViewLayer
    Get the ViewLayer with the specified id, return null if not found
    */
    function getLayer(id) {
        for (var ii = 0; ii < layerCount; ii++) {
            if (layers[ii].getId() == id) {
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
        return XY.init(offsetX, offsetY);
    } // getOffset

    /**
    ### getZoomLevel(): int
    Return the current zoom level of the view, for views that do not support
    zooming, this will always return a value of 1
    */
    function getZoomLevel() {
        return zoomLevel;
    }

    /**
    ### setMaxOffset(maxX: int, maxY: int, wrapX: bool, wrapY: bool)
    Set the bounds of the display to the specified area, if wrapX or wrapY parameters
    are set, then the bounds will be wrapped automatically.
    */
    function setMaxOffset(maxX, maxY, wrapX, wrapY) {
        offsetMaxX = maxX;
        offsetMaxY = maxY;

        offsetWrapX = typeof wrapX != 'undefined' ? wrapX : false;
        offsetWrapY = typeof wrapY != 'undefined' ? wrapY : false;
    } // setMaxOffset

    /**
    ### getViewRect(): T5.XYRect
    Return a T5.XYRect for the last drawn view rect
    */
    function getViewRect() {
        return XYRect.init(
            offsetX,
            offsetY,
            offsetX + viewWidth,
            offsetY + viewHeight);
    } // getViewRect

    /**
    ### pan(x: int, y: int, tweenFn: EasingFn, tweenDuration: int, callback: fn)

    Used to pan the view by the specified x and y.  This is simply a wrapper to the
    updateOffset function that adds the specified x and y to the current view offset.
    Tweening effects can be applied by specifying values for the optional `tweenFn` and
    `tweenDuration` arguments, and if a notification is required once the pan has completed
    then a callback can be supplied as the final argument.
    */
    function pan(x, y, tweenFn, tweenDuration, callback) {
        updateOffset(offsetX + x, offsetY + y, tweenFn, tweenDuration, callback);
    } // pan

    /**
    ### setLayer(id: String, value: T5.ViewLayer)
    Either add or update the specified view layer
    */
    function setLayer(id, value) {
        for (var ii = 0; ii < layerCount; ii++) {
            if (layers[ii].getId() === id) {
                layers.splice(ii, 1);
                break;
            } // if
        } // for

        if (value) {
            addLayer(id, value);
            value.trigger('refresh', _self, getViewRect());
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
        if (offsetMaxX || offsetMaxY) {
            constrainOffset(true);
        } // if

        lastRefresh = new Date().getTime();
        triggerAll('refresh', _self, getViewRect());

        invalidate();
    } // refresh

    /**
    ### removeLayer(id: String)
    Remove the T5.ViewLayer specified by the id
    */
    function removeLayer(id) {
        var layerIndex = getLayerIndex(id);
        if ((layerIndex >= 0) && (layerIndex < layerCount)) {
            _self.trigger('layerRemoved', layers[layerIndex]);

            layers.splice(layerIndex, 1);
            invalidate();
        } // if

        layerCount = layers.length;
    } // removeLayer

    function resetScale() {
        scaleFactor = 1;
    } // resetScale

    /**
    ### resize(width: Int, height: Int)
    Perform a manual resize of the canvas associated with the view.  If the
    view was originally marked as `autosize` this will override that instruction.
    */
    function resize(width, height) {
        if (canvas) {
            params.autoSize = false;

            if (viewWidth !== width || viewHeight !== height) {
                attachToCanvas(width, height);
            } // if
        } // if
    } // resize

    /**
    ### scale(targetScaling: float, targetXY: T5.XY, tweenFn: EasingFn, callback: fn)
    Scale the view to the specified `targetScaling` (1 = normal, 2 = double-size and 0.5 = half-size).
    */
    function scale(targetScaling, targetXY, tweenFn, callback, duration) {
        if (tweenFn) {
            COG.tweenValue(scaleFactor, targetScaling, tweenFn, duration, function(val, completed) {
                scaleFactor = val;

                if (completed) {
                    var scaleFactorExp = round(log(scaleFactor) / Math.LN2);

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

            updateOffset(
                ((zoomX ? zoomX : offsetX + halfWidth) - scaledHalfWidth) * scaling,
                ((zoomY ? zoomY : offsetY + halfHeight) - scaledHalfHeight) * scaling
            );

            lastOffsetX = offsetX;
            lastOffsetY = offsetY;

            triggerAll('zoomLevelChange', value);

            scaleFactor = 1;

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

    This function allows you to specified the absolute x and y offset that should
    become the top-left corner of the view.  As per the `pan` function documentation, tween and
    callback arguments can be supplied to animate the transition.
    */
    function updateOffset(x, y, tweenFn, tweenDuration, callback) {

        var tweensComplete = 0,
            minXYOffset = layerMinXY ? XY.offset(layerMinXY, -halfWidth, -halfHeight) : null,
            maxXYOffset = layerMaxXY ? XY.offset(layerMaxXY, -halfWidth, -halfHeight) : null;

        function endTween() {
            tweensComplete += 1;

            if (tweensComplete >= 2) {
                tweeningOffset = false;

                if (callback) {
                    callback();
                } // if
            } // if
        } // endOffsetUpdate

        if (minXYOffset) {
            x = x < minXYOffset.x ? minXYOffset.x : x;
            y = y < minXYOffset.y ? minXYOffset.y : y;
        } // if

        if (maxXYOffset) {
            x = x > maxXYOffset.x ? maxXYOffset.x : x;
            y = y > maxXYOffset.y ? maxXYOffset.y : y;
        } // if

        if (tweenFn) {
            if ((state & statePan) !== 0) {
                return;
            } // if

            COG.tweenValue(offsetX, x, tweenFn, tweenDuration, function(val, complete){
                offsetX = val | 0;

                (complete ? endTween : invalidate)();
                return !interacting;
            });

            COG.tweenValue(offsetY, y, tweenFn, tweenDuration, function(val, complete) {
                offsetY = val | 0;

                (complete ? endTween : invalidate)();
                return !interacting;
            });

            tweeningOffset = true;
        }
        else {
            offsetX = x | 0;
            offsetY = y | 0;

            invalidate();

            if (callback) {
                callback();
            } // if
        } // if..else
    } // updateOffset

    function triggerAllUntilCancelled() {
        var cancel = _self.trigger.apply(null, arguments).cancel;
        for (var ii = layers.length; ii--; ) {
            cancel = layers[ii].trigger.apply(null, arguments).cancel || cancel;
        } // for

        return (! cancel);
    } // triggerAllUntilCancelled

    /* object definition */

    var _self = {
        id: params.id,
        deviceScaling: deviceScaling,
        fastDraw: params.fastDraw || getConfig().requireFastDraw,

        detach: detach,
        eachLayer: eachLayer,
        getDimensions: getDimensions,
        getLayer: getLayer,
        getZoomLevel: getZoomLevel,
        setLayer: setLayer,
        invalidate: invalidate,
        refresh: refresh,
        resetScale: resetScale,
        resize: resize,
        scale: scale,
        setZoomLevel: setZoomLevel,
        syncXY: syncXY,
        triggerAll: triggerAll,
        removeLayer: removeLayer,

        /* offset methods */

        getOffset: getOffset,
        setMaxOffset: setMaxOffset,
        getViewRect: getViewRect,
        updateOffset: updateOffset,
        pan: pan
    };

    deviceScaling = getConfig().getScaling();

    COG.observable(_self);

    _self.bind('invalidate', function(evt) {
        invalidate();
    });

    _self.bind('resync', handleResync);

    COG.configurable(
        _self, [
            'container',
            'captureHover',
            'captureDrag',
            'scalable',
            'pannable',
            'inertia',
            'minZoom',
            'maxZoom',
            'zoom'
        ],
        COG.paramTweaker(params, null, {
            'container': handleContainerUpdate,
            'inertia': captureInteractionEvents,
            'captureHover': captureInteractionEvents,
            'scalable': captureInteractionEvents,
            'pannable': captureInteractionEvents
        }),
        true);

    CANI.init(function(testResults) {
        _self.markers = addLayer('markers', new ShapeLayer({
            zindex: 20
        }));

        canvasCaps = testResults.canvas;

        attachToCanvas();

        if (params.autoSize) {
            if (isIE) {
                window.attachEvent('onresize', handleResize);
            }
            else {
                window.addEventListener('resize', handleResize, false);
            }
        } // if
    });

    return _self;
}; // T5.View

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

- `supportsFastDraw` (default: false) - The supportsFastDraw parameter specifies
whether a layer will be drawn on in particular graphic states on devices that
require fastDraw mode to perform at an optimal level.  For instance, if a layer does
not support fastDraw and the View is panning or scaling, the layer will not be drawn
so it's important when defining new layer classes to set this parameter to true if you
want the layer visible during these operations.  Be aware though that layers that require
some time to render will impact performance on slower devices.

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
var ViewLayer = function(params) {
    params = COG.extend({
        id: "",
        zindex: 0,
        supportFastDraw: false,
        animated: false,
        validStates: viewState('ACTIVE', 'ANIMATING', 'PAN', 'ZOOM'),
        style: null,
        minXY: null,
        maxXY: null
    }, params);

    var parent = null,
        parentFastDraw = false,
        changed = false,
        supportFastDraw = params.supportFastDraw,
        id = params.id,
        activeState = viewState("ACTIVE"),
        validStates = params.validStates,
        lastOffsetX = 0,
        lastOffsetY = 0;

    var _self = COG.extend({
        /**
        ### addToView(view)
        Used to add the layer to a view.  This simply calls T5.View.setLayer
        */
        addToView: function(view) {
            view.setLayer(id, _self);
        },

        /**
        ### shouldDraw(displayState)

        Called by a View that contains the layer to determine
        whether or not the layer should be drawn for the current display state.
        The default implementation of this method first checks the fastDraw status,
        and then continues to do a bitmask operation against the validStates property
        to see if the current display state is acceptable.
        */
        shouldDraw: function(displayState, viewRect) {
            return ((displayState & validStates) !== 0);
        },

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

            - context - the canvas context that we are drawing to
            - viewRect - the current view rect
            - state - the current DisplayState of the view
            - view - a reference to the View
            - tickCount - the current tick count
            - hitData - an object that contains information regarding the current hit data
        */
        draw: function(context, viewRect, state, view, tickCount, hitData) {
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
        hitGuess: null,

        /**
        ### remove()

        The remove method enables a view to flag that it is ready or should be removed
        from any views that it is contained in.  This was introduced specifically for
        animation layers that should only exist as long as an animation is active.
        */
        remove: function() {
            _self.trigger('remove', _self);
        },

        /**
        ### changed()

        The changed method is used to flag the layer has been modified and will require
        a redraw

        */
        changed: function() {
            changed = true;

            if (parent) {
                parent.invalidate();
            } // if
        },

        /**
        ### hitTest(offsetX, offsetY, state, view)
        */
        hitTest: null,

        /**
        ### getId()

        */
        getId: function() {
            return id;
        },

        /**
        ### setId(string)

        */
        setId: function(value) {
            id = value;
        },

        /**
        ### getParent()

        */
        getParent: function() {
            return parent;
        },

        /**
        ### setParent(view: View)

        */
        setParent: function(view) {
            parent = view;

            parentFastDraw = parent ? (parent.fastDraw && (displayState !== activeState)) : false;

            _self.trigger('parentChange', parent);
        }
    }, params); // _self

    COG.observable(_self);

    _self.bind('drawComplete', function(evt, viewRect, tickCount) {
        changed = false;

        lastOffsetX = viewRect.x1;
        lastOffsetY = viewRect.y1;
    });

    _self.bind('resync', function(evt, view) {
       if (_self.minXY) {
           view.syncXY(_self.minXY);
       } // if

       if (_self.maxXY) {
           view.syncXY(_self.maxXY);
       } // if
    });

    return _self;
}; // T5.ViewLayer
/**
# T5.ImageLayer
*/
var ImageLayer = function(genId, params) {
    params = COG.extend({
        imageLoadArgs: {}
    }, params);

    var generator = genId ? Generator.init(genId, params) : null,
        generateCount = 0,
        images = [],
        loadArgs = params.imageLoadArgs;

    /* private internal functions */

    function eachImage(viewRect, viewState, callback) {
        for (var ii = images.length; ii--; ) {
            var imageData = images[ii],
                xx = imageData.x,
                yy = imageData.y,
                imageRect = XYRect.init(
                    imageData.x,
                    imageData.y,
                    imageData.x + imageData.width,
                    imageData.y + imageData.height);

            if (callback && XYRect.intersect(viewRect, imageRect)) {
                var image = Images.get(imageData.url, function(loadedImage) {
                    _self.changed();
                }, loadArgs);

                if (image) {
                    callback(image, xx, yy, imageData.width, imageData.height);
                } // if
            } // if
        } // for
    } // eachImage

    /* every library should have a regenerate function - here's mine ;) */
    function regenerate(viewRect) {
        var sequenceId = ++generateCount,
            view = _self.getParent();

        if (generator) {

            generator.run(view, viewRect, function(newImages) {
                if (sequenceId == generateCount) {
                    images = [].concat(newImages);
                    view.invalidate();
                } // if
            });
        } // if
    } // regenerate

    /* event handlers */

    function handleRefresh(evt, view, viewRect) {
        regenerate(viewRect);
    } // handleViewIdle

    function handleTap(evt, absXY, relXY, offsetXY) {
        var tappedImages = [],
            offsetX = offsetXY.x,
            offsetY = offsetXY.y,
            genImage,
            tapped;

        if (images) {
            for (var ii = images.length; ii--; ) {
                genImage = images[ii];

                tapped = offsetX >= genImage.x &&
                    offsetX <= genImage.x + genImage.width &&
                    offsetY >= genImage.y &&
                    offsetY <= genImage.y + genImage.height;

                if (tapped) {
                    tappedImages[tappedImages.length] = genImage;
                } // if
            } // for
        } // if

        if (tappedImages.length > 0) {
            _self.trigger('tapImage', tappedImages, absXY, relXY, offsetXY);
        } // if
    } // handleTap

    /* exports */

    /**
    ### changeGenerator(generatorId, args)
    */
    function changeGenerator(generatorId, args) {
        generator = Generator.init(generatorId, COG.extend({}, params, args));

        images = null;
        regenerate(_self.getParent().getViewRect());
    } // changeGenerator

    function clip(context, viewRect, state, view) {
        var offsetX = viewRect.x1,
            offsetY = viewRect.y1;

        eachImage(viewRect, state, function(image, x, y, width, height) {
            context.rect(x - offsetX, y - offsetY, width, height);
        });
    } // clip

    function draw(context, viewRect, state, view) {
        var offsetX = viewRect.x1,
            offsetY = viewRect.y1;

        eachImage(viewRect, state, function(image, x, y, width, height) {
            context.drawImage(
                image,
                x - offsetX,
                y - offsetY,
                image.width,
                image.height);
        });
    } // draw

    function mask(context, viewRect, state, view) {
        eachImage(viewRect, state, function(image, x, y, width, height) {
            COG.info('clearing rect @ x = ' + x + ', y = ' + y + ', width = ' + width + ', height = ' + height);
            context.clearRect(x, y, width, height);
        });
    } // mask

    /* definition */

    var _self = COG.extend(new ViewLayer(params), {
        changeGenerator: changeGenerator,
        clip: clip,
        draw: draw,
        mask: mask
    });

    _self.bind('refresh', handleRefresh);
    _self.bind('tap', handleTap);

    return _self;
};
/**
# T5.ImageGenerator

## Events

### update
*/
var ImageGenerator = function(params) {
    params = COG.extend({
        relative: false,
        padding: 2
    }, params);

    /**
    ### run(viewRect, view, callback)
    */
    function run(view, viewRect, callback) {
        COG.warn('running base generator - this should be overriden');
    } // run

    var _self = {
        run: run
    };

    COG.observable(_self);
    return _self;
};

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
        fill: false,
        draggable: false,
        observable: true, // TODO: should this be true or false by default
        properties: {},
        type: 'shape',
        transformable: false
    }, params);

    COG.extend(this, params);

    this.id = COG.objId(this.type);
    this.bounds = null;

    if (this.observable) {
        COG.observable(this);
    } // if

    if (this.transformable) {
        transformable(this);
    } // if
};

Drawable.prototype = {
    constructor: Drawable,

    /**
    ### drag(dragData, dragX, dragY, drop)
    */
    drag: null,

    /**
    ### draw(context, x, y, width, height, state)
    */
    draw: function(context, x, y, width, height, state) {
        if (this.fill) {
            context.fill();
        } // if

        context.stroke();
    },

    invalidate: function() {
        var view = this.layer ? this.layer.getParent() : null;
        if (view) {
            view.invalidate();
        } // if
    },

    /**
    ### prepPath(context, x, y, width, height, state)
    Prepping the path for a shape is the main
    */
    prepPath: function(context, x, y, width, height, state) {
    },

    /**
    ### resync(view)
    */
    resync: function(view) {
        if (this.xy) {
            view.syncXY([this.xy]);
        } // if
    },

    /**
    ### updateBounds(bounds: XYRect, updateXY: boolean)
    */
    updateBounds: function(bounds, updateXY) {
        this.bounds = bounds;

        if (updateXY) {
            this.xy = XYRect.center(this.bounds);
        } // if
    }
};
function checkOffsetAndBounds(drawable, image) {
    var x, y;

    if (image && image.width > 0) {
        if (! drawable.imageOffset) {
            drawable.imageOffset = XY.init(
                -image.width >> 1,
                -image.height >> 1
            );
        } // if

        if (! drawable.bounds) {
            x = drawable.xy.x + drawable.imageOffset.x;
            y = drawable.xy.y + drawable.imageOffset.y;

            drawable.bounds = XYRect.init(x, y, x + image.width, y + image.height);
        } // if
    } // if
} // checkOffsetAndBounds

function transformable(target) {

    /* internals */
    var DEFAULT_DURATION = 1000,
        rotation = 0,
        scale = 1,
        transX = 0,
        transY = 0;

    /* exports */

    function animate(fn, argsStart, argsEnd, easing, duration, callback) {
        var startTicks = new Date().getTime(),
            targetFn = target[fn],
            argsComplete = 0,
            animateValid = argsStart.length && argsEnd.length &&
                argsStart.length == argsEnd.length,
            argsCount = animateValid ? argsStart.length : 0,
            argsChange = new Array(argsCount),
            argsCurrent = new Array(argsCount),
            easingFn = COG.easing(easing ? easing : 'sine.out'),
            ii,

            runTween = function(tickCount) {
                var elapsed = tickCount - startTicks,
                    complete = startTicks + duration <= tickCount;

                for (var ii = argsCount; ii--; ) {
                    argsCurrent[ii] = easingFn(
                        elapsed,
                        argsStart[ii],
                        argsChange[ii],
                        duration);
                } // for

                targetFn.apply(target, argsCurrent);
                target.invalidate.call(target);

                if (! complete) {
                    animFrame(runTween);
                }
                else if (callback) {
                    targetFn.apply(target, argsEnd);
                    callback();
                } // if..else
            };

        if (targetFn && argsCount > 0) {
            duration = duration ? duration : DEFAULT_DURATION;

            for (ii = argsCount; ii--; ) {
                argsChange[ii] = argsEnd[ii] - argsStart[ii];
            } // for

            animFrame(runTween);
        } // if
    } // animate

    function transform(context, offsetX, offsetY) {
        context.save();
        context.translate(target.xy.x - offsetX + transX, target.xy.y - offsetY + transY);

        if (rotation !== 0) {
            context.rotate(rotation);
        } // if

        if (scale !== 1) {
            context.scale(scale, scale);
        } // if
    } // transform

    COG.extend(target, {
        animate: animate,

        rotate: function(value) {
            rotation = value;
        },

        scale: function(value) {
            scale = value;
        },

        translate: function(x, y) {
            transX = x;
            transY = y;
        },

        transform: transform
    });
}
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
var Poly = function(points, params) {
    params = COG.extend({
        simplify: false
    }, params);

    var haveData = false,
        simplify = params.simplify,
        stateZoom = viewState('ZOOM'),
        drawPoints = [];

    params.type = params.fill ? 'polygon' : 'line';

    /* exported functions */

    /**
    ### prepPath(context, offsetX, offsetY, width, height, state, hitData)
    Prepare the path that will draw the polygon to the canvas
    */
    function prepPath(context, offsetX, offsetY, width, height, state) {
        if (haveData) {
            var first = true;

            context.beginPath();

            for (var ii = drawPoints.length; ii--; ) {
                var x = drawPoints[ii].x - offsetX,
                    y = drawPoints[ii].y - offsetY;

                if (first) {
                    context.moveTo(x, y);
                    first = false;
                }
                else {
                    context.lineTo(x, y);
                } // if..else
            } // for
        } // if

        return haveData;
    } // prepPath

    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync(view) {
        var x, y, maxX, maxY, minX, minY;

        view.syncXY(points);

        drawPoints = XY.floor(simplify ? XY.simplify(points) : points);

        for (var ii = drawPoints.length; ii--; ) {
            x = drawPoints[ii].x;
            y = drawPoints[ii].y;

            minX = typeof minX == 'undefined' || x < minX ? x : minX;
            minY = typeof minY == 'undefined' || y < minY ? y : minY;
            maxX = typeof maxX == 'undefined' || x > maxX ? x : maxX;
            maxY = typeof maxY == 'undefined' || y > maxY ? y : maxY;
        } // for

        this.updateBounds(XYRect.init(minX, minY, maxX, maxY), true);
    } // resync

    Drawable.call(this, params);

    COG.extend(this, {
        prepPath: prepPath,
        resync: resync
    });

    haveData = points && (points.length >= 2);
};

Poly.prototype = new Drawable();
Poly.prototype.constructor = Poly;
var Line = function(points, params) {
    params.fill = false;

    Poly.call(this, points, params);
};

Line.prototype = new Poly();
/**
# T5.ImageDrawable
_extends:_ T5.Drawable


An image annotation is simply a T5.Annotation that has been extended to
display an image rather than a simple circle.  Probably the most common type
of annotation used.  Supports using either the `image` or `imageUrl` parameters
to use preloaded or an imageurl for displaying the annotation.

## TODO

- currently hits on animated markers not working as well as they should, need to
tweak touch handling to get this better...


## Constructor
`new T5.Image(params);`

### Initialization Parameters

- `image` (HTMLImage, default = null) - one of either this or the `imageUrl` parameter
is required and the specified image is used to display the annotation.

- `imageUrl` (String, default = null) - one of either this of the `image` parameter is
required.  If specified, the image is obtained using T5.Images module and then drawn
to the canvas.

- `imageAnchor` (T5.Vector, default = null) - a T5.Vector that optionally specifies the
anchor position for an annotation.  Consider that your annotation is "pin-like" then you
would want to provide an anchor vector that specified the pixel position in the image
around the center and base of the image.  If not `imageAnchor` parameter is provided, then
the center of the image is assumed for the anchor position.

- `rotation` (float, default = 0) - the value of the rotation for the image marker
(in radians).  Be aware that applying rotation to a marker does add an extra processing
overhead as the canvas context needs to be saved and restored as part of the operation.

- `scale` (float, default = 1)

- `opacity` (float, default = 1)


## Methods
*/
var ImageDrawable = function(params) {
    params = COG.extend({
        image: null,
        imageUrl: null,
        imageOffset: null
    }, params);

    var dragOffset = null,
        drawableUpdateBounds = Drawable.prototype.updateBounds,
        drawX,
        drawY,
        image = params.image;

    /* exports */

    function changeImage(imageUrl) {
        this.imageUrl = imageUrl;

        if (this.imageUrl) {
            image = Images.get(this.imageUrl, function(loadedImage) {
                var view = _self.layer ? _self.layer.getParent() : null;

                image = loadedImage;

                if (view) {
                    view.invalidate();
                } // if
            });
        } // if
    } // changeImage

    /**
    ### drag(dragData, dragX, dragY, drop)
    */
    function drag(dragData, dragX, dragY, drop) {
        if (! dragOffset) {
            dragOffset = XY.init(
                dragData.startX - this.xy.x,
                dragData.startY - this.xy.y
            );

        }

        this.xy.x = dragX - dragOffset.x;
        this.xy.y = dragY - dragOffset.y;

        if (drop) {
            dragOffset = null;


            if (this.layer) {
                var view = this.layer.getParent();
                if (view) {
                    view.syncXY([this.xy], true);
                } // if
            } // if

            this.trigger('dragDrop');
        } // if

        return true;
    } // drag

    /**
    ### draw(context, x, y, width, height, state)
    */
    function draw(context, offsetX, offsetY, width, height, state) {
        context.drawImage(image, drawX, drawY);
    } // draw

    /**
    ### prepPath(context, offsetX, offsetY, width, height, state, hitData)
    Prepare the path that will draw the polygon to the canvas
    */
    function prepPath(context, offsetX, offsetY, width, height, state) {
        var draw = image && image.width > 0;

        if (draw) {
            checkOffsetAndBounds(this, image);

            drawX = this.xy.x + this.imageOffset.x - offsetX;
            drawY = this.xy.y + this.imageOffset.y - offsetY;

            context.beginPath();
            context.rect(drawX, drawY, image.width, image.height);
        } // if

        return draw;
    } // prepPath

    /**
    ### updateBounds(bounds: XYRect, updateXY: boolean)
    */
    function updateBounds(bounds, updateXY) {
        drawableUpdateBounds.call(this, bounds, updateXY);

        checkOffsetAndBounds(this, image);
    } // setOrigin

    Drawable.call(this, params);

    var _self = COG.extend(this, {
        changeImage: changeImage,
        drag: drag,
        draw: draw,
        prepPath: prepPath,
        updateBounds: updateBounds
    });

    if (! image) {
        changeImage(this.imageUrl);
    } // if
};

ImageDrawable.prototype = new Drawable();
ImageDrawable.prototype.constructor = ImageDrawable;
var ImageMarker = function(params) {
    params = COG.extend({
        imageAnchor: null
    }, params);

    if (params.imageAnchor) {
        params.imageOffset = XY.invert(params.imageAnchor);
    } // if

    ImageDrawable.call(this, params);
};

ImageMarker.prototype = new ImageDrawable();
ImageMarker.prototype.constructor = ImageMarker;
/**
# T5.ShapeLayer
_extends:_ T5.ViewLayer


The ShapeLayer is designed to facilitate the storage and display of multiple
geometric shapes.  This is particularly useful for displaying [GeoJSON](http://geojson.org)
data and the like.

## Methods
*/
var ShapeLayer = function(params) {
    params = COG.extend({
        zindex: 10
    }, params);

    var shapes = [],
        pipTransformed = CANI.canvas.pipTransformed;

    /* private functions */

    function performSync(view) {
        for (var ii = shapes.length; ii--; ) {
            shapes[ii].resync(view);
        } // for

        shapes.sort(function(shapeA, shapeB) {
            var diff = shapeB.xy.y - shapeA.xy.y;
            return diff != 0 ? diff : shapeB.xy.x - shapeA.xy.y;
        });

        _self.changed();
    } // performSync

    /* event handlers */

    function handleResync(evt, parent) {
        performSync(parent);
    } // handleParentChange

    /* exports */

    function draw(context, viewRect, state, view, tickCount, hitData) {
        var viewX = viewRect.x1,
            viewY = viewRect.y1,
            hitX = hitData ? (pipTransformed ? hitData.x - viewX : hitData.relXY.x) : 0,
            hitY = hitData ? (pipTransformed ? hitData.y - viewY : hitData.relXY.y) : 0,
            viewWidth = viewRect.width,
            viewHeight = viewRect.height;

        for (var ii = shapes.length; ii--; ) {
            var shape = shapes[ii],
                overrideStyle = shape.style,
                styleType,
                previousStyle,
                prepped;

            if (shape.transform) {
                shape.transform(context, viewX, viewY);

                if (pipTransformed) {
                    hitX -= shape.xy.x;
                    hitY -= shape.xy.y;
                } // if
            } // if

            prepped = shape.prepPath(
                context,
                shape.transform ? shape.xy.x : viewX,
                shape.transform ? shape.xy.y : viewY,
                viewWidth,
                viewHeight,
                state);

            if (prepped) {
                if (hitData && context.isPointInPath(hitX, hitY)) {
                    hitData.elements.push(Hits.initHit(shape.type, shape, {
                        drag: shape.draggable ? shape.drag : null
                    }));

                    styleType = hitData.type + 'Style';

                    overrideStyle = shape[styleType] || _self[styleType] || overrideStyle;
                } // if

                previousStyle = overrideStyle ? Style.apply(context, overrideStyle) : null;

                shape.draw(context, viewX, viewY, viewWidth, viewHeight, state);

                if (previousStyle) {
                    Style.apply(context, previousStyle);
                } // if
            } // if

            if (shape.transform) {
                context.restore();
            } // if
        } // for
    } // draw

    /**
    ### hitGuess(hitX, hitY, state, view)
    Return true if any of the markers are hit, additionally, store the hit elements
    so we don't have to do the work again when drawing
    */
    function hitGuess(hitX, hitY, state, view) {
        var hit = false;

        for (var ii = shapes.length; (! hit) && ii--; ) {
            var shape = shapes[ii],
                bounds = shape.bounds;

            hit = hit || (bounds &&
                hitX >= bounds.x1 && hitX <= bounds.x2 &&
                hitY >= bounds.y1 && hitY <= bounds.y2);
        } // for

        return hit;
    } // hitGuess

    /* initialise _self */

    var _self = COG.extend(new ViewLayer(params), {
        /**
        ### add(poly)
        Used to add a T5.Poly to the layer
        */
        add: function(shape) {
            if (shape) {
                shape.layer = _self;

                var view = _self.getParent();
                if (view) {
                    shape.resync(_self.getParent());

                    view.invalidate();
                } // if

                shapes[shapes.length] = shape;
            } // if
        },

        clear: function() {
            shapes = [];
        },

        draw: draw,
        hitGuess: hitGuess
    });

    _self.bind('parentChange', handleResync);
    _self.bind('resync', handleResync);

    return _self;
};

/**
# T5.Tiling
*/
var Tiling = (function() {

    /* internal functions */

    /* exports */

    function init(x, y, width, height, data) {
        return COG.extend({
            x: x,
            y: y,
            width: width,
            height: height
        }, data);
    } // init

    /* module definition */

    return {
        tileSize: 256,
        init: init
    };
})();

    COG.extend(exports, {
        ex: COG.extend,
        ticks: ticks,
        getConfig: getConfig,
        userMessage: userMessage,

        XY: XY,
        XYRect: XYRect,
        Dimensions: Dimensions,
        Vector: Vector,
        Hits: Hits,

        Images: Images,

        Generator: Generator,

        tween: COG.tween,
        tweenValue: COG.tweenValue,
        easing: COG.easing,
        Tween: COG.Tween,

        Style: Style,
        viewState: viewState,
        View: View,
        ViewLayer: ViewLayer,
        ImageLayer: ImageLayer,
        ImageGenerator: ImageGenerator,

        Drawable: Drawable,
        Poly: Poly,
        Line: Line,
        ImageDrawable: ImageDrawable,
        ImageMarker: ImageMarker,
        ShapeLayer: ShapeLayer,

        transformable: transformable,

        Tiling: Tiling
    });

    COG.observable(exports);

})(T5);
