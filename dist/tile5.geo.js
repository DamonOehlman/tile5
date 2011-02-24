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


/**
# COG.Loopage
This module implements a control loop that can be used to centralize
jobs draw loops, animation calculations, partial calculations for COG.Job
instances, etc.
*/
COG.Loopage = (function() {
    var MIN_SLEEP = 60 * 1000;

    var workerCount = 0,
        workers = [],
        removalQueue = [],
        loopTimeout = 0,
        sleepFrequency = MIN_SLEEP,
        recalcSleepFrequency = true;

    function LoopWorker(params) {
        var self = COG.extend({
            id: workerCount++,
            frequency: 0,
            after: 0,
            single: false,
            lastTick: 0,
            execute: function() {}
        }, params);

        return self;
    } // LoopWorker


    /* internal functions */

    function joinLoop(params) {
        var worker = new LoopWorker(params);
        if (worker.after > 0) {
            worker.lastTick = new Date().getTime() + worker.after;
        } // if

        COG.observable(worker);
        worker.bind('complete', function() {
            leaveLoop(worker.id);
        });

        workers.unshift(worker);
        reschedule();

        return worker;
    } // joinLoop

    function leaveLoop(workerId) {
        removalQueue.push(workerId);
        reschedule();
    } // leaveLoop

    function reschedule() {
        if (loopTimeout) {
            clearTimeout(loopTimeout);
        } // if

        loopTimeout = setTimeout(runLoop, 0);

        recalcSleepFrequency = true;
    } // reschedule

    function runLoop() {
        var ii,
            tickCount = new Date().getTime(),
            workerCount = workers.length;

        while (removalQueue.length > 0) {
            var workerId = removalQueue.shift();

            for (ii = workerCount; ii--; ) {
                if (workers[ii].id === workerId) {
                    workers.splice(ii, 1);
                    break;
                } // if
            } // for

            recalcSleepFrequency = true;
            workerCount = workers.length;
        } // while

        if (recalcSleepFrequency) {
            sleepFrequency = MIN_SLEEP;
            for (ii = workerCount; ii--; ) {
                sleepFrequency = workers[ii].frequency < sleepFrequency ? workers[ii].frequency : sleepFrequency;
            } // for
        } // if

        for (ii = workerCount; ii--; ) {
            var workerDiff = tickCount - workers[ii].lastTick;

            if (workers[ii].lastTick === 0 || workerDiff >= workers[ii].frequency) {
                workers[ii].execute(tickCount, workers[ii]);
                workers[ii].lastTick = tickCount;

                if (workers[ii].single) {
                    workers[ii].trigger('complete');
                } // if
            } // if
        } // for

        loopTimeout = workerCount ? setTimeout(runLoop, sleepFrequency) : 0;
    } // runLoop

    return {
        join: joinLoop,
        leave: leaveLoop
    };
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

            target.trigger = function(eventName) {
                var eventCallbacks = getHandlersForName(target, eventName),
                    evt = {
                        cancel: false,
                        name: eventName,
                        tickCount: new Date().getTime()
                    },
                    eventArgs;

                if (! eventCallbacks) {
                    return null;
                } // if

                eventArgs = Array.prototype.slice.call(arguments, 1);

                if (target.eventInterceptor) {
                    target.eventInterceptor(eventName, evt, eventArgs);
                } // if

                eventArgs.unshift(evt);

                for (var ii = eventCallbacks.length; ii-- && (! evt.cancel); ) {
                    eventCallbacks[ii].fn.apply(self, eventArgs);
                } // for


                return evt;
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

        tweens = [],
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

    /* define the Tween class */

    /**
    # COG.Tween
    */
    var Tween = COG.Tween = function(params) {
        params = COG.extend({
            target: null,
            property: null,
            startValue: 0,
            endValue: null,
            duration: 2000,
            tweenFn: easing('sine.out'),
            complete: null
        }, params);

        var startTicks = new Date().getTime(),
            updateListeners = [],
            complete = false,
            beginningValue = 0.0,
            change = 0;

        function notifyListeners(updatedValue, complete) {
            for (var ii = updateListeners.length; ii--; ) {
                updateListeners[ii](updatedValue, complete);
            } // for
        } // notifyListeners

        var self = {
            isComplete: function() {
                return complete;
            },

            triggerComplete: function(cancelled) {
                if (params.complete) {
                    params.complete(cancelled);
                } // if
            },

            update: function(tickCount) {
                var elapsed = tickCount - startTicks,
                    updatedValue = params.tweenFn(
                                        elapsed,
                                        beginningValue,
                                        change,
                                        params.duration);

                if (params.target) {
                    params.target[params.property] = updatedValue;
                } // if

                notifyListeners(updatedValue);

                complete = startTicks + params.duration <= tickCount;
                if (complete) {
                    if (params.target) {
                        params.target[params.property] = params.tweenFn(params.duration, beginningValue, change, params.duration);
                    } // if

                    notifyListeners(updatedValue, true);
                } // if
            },

            requestUpdates: function(callback) {
                updateListeners.push(callback);
            }
        };

        beginningValue =
            (params.target && params.property && params.target[params.property]) ? params.target[params.property] : params.startValue;

        if (typeof params.endValue !== 'undefined') {
            change = (params.endValue - beginningValue);
        } // if

        if (change == 0) {
            complete = true;
        } // if..else

        wakeTweens();

        return self;
    };

    /* animation internals */

    function simpleTypeName(typeName) {
        return typeName.replace(/[\-\_\s\.]/g, '').toLowerCase();
    } // simpleTypeName

    function updateTweens(tickCount, worker) {
        if (updatingTweens) { return tweens.length; }

        updatingTweens = true;
        try {
            var ii = 0;
            while (ii < tweens.length) {
                if (tweens[ii].isComplete()) {
                    tweens[ii].triggerComplete(false);
                    tweens.splice(ii, 1);
                }
                else {
                    tweens[ii].update(tickCount);
                    ii++;
                } // if..else
            } // while
        }
        finally {
            updatingTweens = false;
        } // try..finally

        if (tweens.length === 0) {
            tweenWorker.trigger('complete');
        } // if

        return tweens.length;
    } // update

    function wakeTweens() {
        if (tweenWorker) { return; }

        tweenWorker = COG.Loopage.join({
            execute: updateTweens,
            frequency: 20
        });

        tweenWorker.bind('complete', function(evt) {
            tweenWorker = null;
        });
    } // wakeTweens

    /* tween exports */

    /**
    # COG.tweenValue
    */
    COG.tweenValue = function(startValue, endValue, fn, callback, duration) {
        var fnresult = new Tween({
            startValue: startValue,
            endValue: endValue,
            tweenFn: fn,
            complete: callback,
            duration: duration
        });

        tweens.push(fnresult);
        return fnresult;
    }; // T5.tweenValue



    /*
    # T5.tween
    */
    COG.tween = function(target, property, targetValue, fn, callback, duration) {
        var fnresult = new Tween({
            target: target,
            property: property,
            endValue: targetValue,
            tweenFn: fn,
            duration: duration,
            complete: callback
        });

        tweens.push(fnresult);
        return fnresult;
    }; // T5.tween

    /**
    # COG.endTweens
    */
    COG.endTweens = function(checkCallback) {
        if (updatingTweens) { return ; }

        updatingTweens = true;
        try {
            var ii = 0;

            while (ii < tweens.length) {
                if ((! checkCallback) || checkCallback(tweens[ii])) {
                    tweens[ii].triggerComplete(true);
                    tweens.splice(ii, 1);
                }
                else {
                    ii++;
                } // if..else
            } // for
        }
        finally {
            updatingTweens = false;
        } // try..finally
    };

    /**
    # COG.getTweens
    */
    COG.getTweens = function() {
        return [].concat(tweens);
    };

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

    var observable = params.observable,
        handlerInstances = [];


    /* internals */

    function handlePanMove(evt, absXY, relXY, deltaXY) {
        observable.trigger('pan', deltaXY.x, deltaXY.y);
    } // handlePanMove

    /* exports */

    function bind() {
        return observable.bind.apply(null, arguments);
    } // bind

    function pannable(opts) {
        opts = COG.extend({
            inertia: true
        }, opts);

        observable.bind('pointerMove', handlePanMove);

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

function matchTarget(evt, targetElement) {
    var targ = evt.target ? evt.target : evt.srcElement;
    while (targ && targ.nodeName && (targ.nodeName.toUpperCase() != 'CANVAS')) {
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
        inertia: false
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

            observable.trigger(
                'tap',
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

            observable.trigger(
                'doubleTap',
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

                observable.trigger(
                    'pointerDown',
                    start,
                    pointerOffset(start, offset)
                );
            } // if
        } // if
    } // mouseDown

    function handleMouseMove(evt) {
        currentX = evt.pageX ? evt.pageX : evt.screenX;
        currentY = evt.pageY ? evt.pageY : evt.screenY;

        if (buttonDown && matchTarget(evt, targetElement)) {
            triggerCurrent('pointerMove');
        } // if
    } // mouseMove

    function handleMouseUp(evt) {
        if (buttonDown && isLeftButton(evt)) {
            buttonDown = false;

            if (matchTarget(evt, targetElement)) {
                targetElement.style.cursor = 'default';
                triggerCurrent('pointerUp');
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

                observable.trigger(
                    'zoom',
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

    function triggerCurrent(eventName, includeTotal) {
        var current = point(currentX, currentY);

        observable.trigger(
            eventName,
            current,
            pointerOffset(current, offset),
            point(currentX - lastX, currentY - lastY)
        );

        lastX = currentX;
        lastY = currentY;
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
    opts.binder('click', handleClick, false);
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

                observable.trigger(
                    'pointerDown',
                    changedTouches,
                    relTouches);
            } // if

            if (detailedEvents) {
                observable.trigger(
                    'pointerDownMulti',
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

                            observable.trigger(
                                'zoom',
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
                    observable.trigger(
                        'pointerMove',
                        touchesCurrent,
                        copyTouches(touchesCurrent, offset.x, offset.y),
                        point(
                            touchesCurrent.x - touchesLast.x,
                            touchesCurrent.y - touchesLast.y)
                    );
                } // if

                if (detailedEvents) {
                    observable.trigger(
                        'pointerMoveMulti',
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
                if (touchMode === TOUCH_MODE_TAP) {
                    observable.trigger(
                        'pointerTap',
                        changedTouches,
                        offsetTouches
                    );
                } // if

                observable.trigger(
                    'pointerUp',
                    changedTouches,
                    offsetTouches
                );

                touchesStart = null;
            } // if

            if (detailedEvents) {
                observable.trigger(
                    'pointerUpMulti',
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

T5 = (function() {
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
        return xy.x + ', ' + xy.y;
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

## XYRect Object Literal Format
An XYRect object literal has the following properties.

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
        return XY.init(rect.x1 + rect.width/2, rect.y1 + rect.height/2);
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
    */
    function diagonalSize(rect) {
        return sqrt(rect.width * rect.width + rect.height * rect.height);
    } // diagonalSize

    /**
    ### fromCenter(centerX, centerY, width, height)
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
    */
    function toString(rect) {
        return '[' + rect.x1 + ', ' + rect.y1 + ', ' + rect.x2 + ', ' + rect.y2 + ']';
    } // toString

    /**
    ### union(rect1, rect2)
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

## Dimension Object Literal Properties
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
    var images = {},
        canvasCounter = 0,
        loadWatchers = {},
        imageCounter = 0,
        queuedImages = [],
        loadingImages = [],
        cachedImages = [],
        imageCacheFullness = 0,
        loadWorker = null,
        clearingCache = false;

    /* internal functions */

    function loadNextImage() {
        if (loadWorker) {
            return;
        }

        var maxImageLoads = getConfig().maxImageLoads;

        loadWorker = COG.Loopage.join({
            execute: function(tickCount, worker) {
                if ((! maxImageLoads) || (loadingImages.length < maxImageLoads)) {
                    var imageData = queuedImages.shift();

                    if (! imageData) {
                        worker.trigger('complete');
                    }
                    else {
                        loadingImages[loadingImages.length] = imageData;

                        imageData.image.onload = handleImageLoad;
                        imageData.image.src = imageData.url;
                        imageData.requested = T5.ticks();
                    } // if..else
                } // if
            },
            frequency: 10
        });

        loadWorker.bind('complete', function(evt) {
            loadWorker = null;
        });
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

        if (loadWorker) {
            COG.Loopage.leave(loadWorker.id);
            loadWorker = null;
        } // if

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

    COG.Loopage.join({
        execute: checkTimeoutsAndCache,
        frequency: 20000
    });

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
# T5.zoomable(view, params)
This mixin is used to make an object support integer zoom levels which are
implemented when the view scales
*/
function zoomable(view, params) {
    params = COG.extend({
        initial: 1,
        minZoom: 1,
        maxZoom: 16
    }, params);

    var zoomLevel = params.initial,
        minZoom = params.minZoom,
        maxZoom = params.maxZoom;

    /* internal functions */

    function handleScale(evt, scaleAmount, zoomXY) {
        var zoomChange = Math.log(scaleAmount) / Math.LN2;

        COG.endTweens(function(tweenInstance) {
            return tweenInstance.cancelOnInteract;
        });

        evt.cancel = ! setZoomLevel(zoomLevel + zoomChange, zoomXY);
        if (! evt.cancel) {
            view.updateOffset(zoomXY.x * scaleAmount, zoomXY.y * scaleAmount);
        } // if
    } // handleScale

    /* exports */

    /**
    ### getZoomLevel()
    Get the current zoom level for the map
    */
    function getZoomLevel() {
        return zoomLevel;
    } // getZoomLevel

    /**
    ### setZoomLevel(value)
    Update the map's zoom level to the specified zoom level
    */
    function setZoomLevel(value, zoomXY) {
        if (value && (zoomLevel !== value)) {
            var zoomOK =
                value >= minZoom &&
                value <= maxZoom &&
                view.triggerAll('zoomLevelChange', value, zoomXY);

            if (zoomOK) {
                zoomLevel = value;
            } // if

            return zoomOK;
        } // if
    } // setZoomLevel

    COG.extend(view, {
        getZoomLevel: getZoomLevel,
        setZoomLevel: setZoomLevel
    });

    view.bind('scale', handleScale);
};

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

        /* define self */

        var self = {
            applyToContext: function(context) {
                for (var ii = mods.length; ii--; ) {
                    mods[ii](context);
                } // for
            },

            update: update
        };

        /* initialize */

        reloadMods();
        return self;
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
`T5.View(params)`

### Initialization Parameters

- `container` (required)

- `id`

- `autoSize`

- `fastDraw`

- `inertia`

- `pannable`

- `scalable`

- `panAnimationEasing`

- `panAnimationDuration`

- `pinchZoomAnimateTrigger`

- `adjustScaleFactor`

- `fps` (int, default = 25) - the frame rate of the view, by default this is set to
25 frames per second but can be increased or decreased to compensate for device
performance.  In reality though on slower devices, the framerate will scale back
automatically, but it can be prudent to set a lower framerate to leave some cpu for
other processes :)


## Events

### scale
This event is fired when the view has been scaled.
<pre>
view.bind('scale', function(evt, scaleFactor, scaleXY) {
});
</pre>

- scaleFactor (Float) - the amount the view has been scaled by.
When the view is being scaled down this will be a value less than
1 and when it is being scaled up it will be greater than 1.
- scaleXY (T5.Vector) - the relative position on the view where
the scaling operation is centered.


### tap
This event is fired when the view has been tapped (or the left
mouse button has been pressed)
<pre>
view.bind('tap', function(evt, absXY, relXY, gridXY) {
});
</pre>

- absXY (T5.Vector) - the absolute position of the tap
- relXY (T5.Vector) - the position of the tap relative to the top left
position of the view.
- gridXY (T5.Vector) - the xy coordinates of the tap relative to the
scrolling grid offset.


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


## Methods
*/
var View = function(params) {
    params = COG.extend({
        id: COG.objId('view'),
        container: "",
        fastDraw: false,
        inertia: true,
        idleDelay: 100,
        minRefresh: 1000,
        pannable: true,
        clipping: false,
        scalable: true,
        interactive: true,
        panAnimationEasing: COG.easing('sine.out'),
        panAnimationDuration: 750,
        pinchZoomAnimateTrigger: 400,
        adjustScaleFactor: null,
        autoSize: true,
        tapExtent: 10,
        mask: true,
        guides: false,
        fps: 25,
        zoomAnimation: COG.easing('quad.out'),
        zoomDuration: 300
    }, params);

    var layers = [],
        aniZoomTimeout,
        layerCount = 0,
        canvas = document.getElementById(params.container),
        mainContext = null,
        isIE = typeof window.attachEvent != 'undefined',
        idleDelay = params.idleDelay,
        minRefresh = params.minRefresh,
        offsetX = 0,
        offsetY = 0,
        offsetMaxX = null,
        offsetMaxY = null,
        offsetWrapX = false,
        offsetWrapY = false,
        clipping = params.clipping,
        cycleRect = null,
        cycleWorker = null,
        drawRect,
        guides = params.guides,
        deviceScaling = 1,
        wakeTriggers = 0,
        halfWidth = 0,
        halfHeight = 0,
        interactOffset = null,
        interactCenter = null,
        idle = false,
        panimating = false,
        paintTimeout = 0,
        idleTimeout = 0,
        panEndTimeout = 0,
        rescaleTimeout = 0,
        layerMinXY = null,
        layerMaxXY = null,
        lastRefresh = 0,
        rotation = 0,
        tickCount = 0,
        stateOverride = null,
        redrawView = false,
        redrawEvery = 40,
        resizeCanvasTimeout = 0,
        scaleTouchesStart = null,
        scaleFactor = 1,
        scaleTween = null,
        lastScaleFactor = 0,
        sizeChanged = false,
        tweenStart = null,
        eventMonitor = null,
        viewHeight,
        viewWidth,
        totalScaleChange = 0,
        isFlash = typeof FlashCanvas !== 'undefined',
        cycleDelay = ~~(1000 / params.fps),
        zoomCenter,
        zoomX, zoomY,

        /* state shortcuts */

        stateActive = viewState('ACTIVE'),
        statePan = viewState('PAN'),
        stateZoom = viewState('ZOOM'),
        stateAnimating = viewState('ANIMATING'),

        state = stateActive;

    var vectorRect = XY.getRect,
        rectDiagonal = XYRect.diagonalSize,
        rectCenter = XYRect.center;

    /* event handlers */

    function handlePan(evt, x, y, inertia) {
        state = statePan;

        invalidate();

        if (inertia && params.inertia) {
            updateOffset(
                offsetX - x,
                offsetY - y,
                params.panAnimationEasing,
                params.panAnimationDuration);
        }
        else if (! inertia) {
            updateOffset(
                offsetX - x,
                offsetY - y);
        } // if..else

        clearTimeout(panEndTimeout);
        panEndTimeout = setTimeout(panEnd, 100);
    } // pan

    /* scaling functions */

    function panEnd() {
        state = stateActive;
        panimating = false;
        invalidate();
    } // panEnd

    function handleZoom(evt, absXY, relXY, scaleChange, source) {
        scale(min(max(scaleFactor + pow(2, scaleChange) - 1, 0.5), 2));
    } // handleWheelZoom

    function scaleView(fullInvalidate) {
        var scaleFactorExp = (log(scaleFactor) / Math.LN2) >> 0;

        if (scaleFactor !== 1) {
            state = stateZoom;
        } // if

        if (scaleFactorExp !== 0) {
            scaleFactor = pow(2, scaleFactorExp);

            var scaledHalfWidth = (halfWidth / scaleFactor) >> 0,
                scaledHalfHeight = (halfHeight / scaleFactor) >> 0,
                scaleEndXY = XY.init(zoomX - scaledHalfWidth, zoomY - scaledHalfHeight);

            /*
            COG.info('zoom x = ' + zoomX + ', y = ' + zoomY);
            COG.info('cycleRect width = ' + cycleRect.width);
            COG.info('drawRect width = ' + drawRect.width);
            COG.info('scaled half width = ' + scaledHalfWidth + ', height = ' + scaledHalfHeight);
            COG.info('scaled end x = ' + scaleEndXY.x + ', y = ' + scaleEndXY.y);
            */

            if (! self.trigger('scale', scaleFactor, scaleEndXY).cancel) {

                for (var ii = layers.length; ii--; ) {
                    layers[ii].trigger('scale', scaleFactor, scaleEndXY);
                } // for

                scaleFactor = 1;
                scaleTouchesStart = null;
                state = stateActive;
                fullInvalidate = true;
            } // if
        } // if

        invalidate(fullInvalidate);
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
        var scaledX, scaledY,
            invScaleFactor = 1 / scaleFactor;

        if (scaleFactor !== 1 && drawRect) {
            scaledX = drawRect.x1 + srcX * invScaleFactor;
            scaledY = drawRect.y1 + srcY * invScaleFactor;
        }
        else {
            scaledX = srcX + offsetX;
            scaledY = srcY + offsetY;
        } // if..else

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
            COG.endTweens(function(tweenInstance) {
                return tweenInstance.cancelOnInteract;
            });

            scale(2, relXY, params.zoomAnimation, null, params.zoomDuration);
        } // if
    } // handleDoubleTap

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
        triggerAll(
            'tap',
            absXY,
            relXY,
            getScaledOffset(relXY.x, relXY.y)
        );
    } // handlePointerTap

    /* exports */

    /**
    ### pan(x, y, tweenFn, tweenDuration, callback)
    */
    function pan(x, y, tweenFn, tweenDuration, callback) {
        updateOffset(offsetX + x, offsetY + y, tweenFn, tweenDuration, callback);
    } // pan

    /**
    ### updateOffset(x, y, tweenFn, tweenDuration, callback)
    */
    function updateOffset(x, y, tweenFn, tweenDuration, callback) {

        var tweensComplete = 0,
            minXYOffset = layerMinXY ? XY.offset(layerMinXY, -halfWidth, -halfHeight) : null,
            maxXYOffset = layerMaxXY ? XY.offset(layerMaxXY, -halfWidth, -halfHeight) : null;

        function updateOffsetAnimationEnd() {
            tweensComplete += 1;

            if (tweensComplete >= 2) {
                panEnd();
                if (callback) {
                    callback();
                } // if
            } // if
        } // updateOffsetAnimationEnd

        if (minXYOffset) {
            x = x < minXYOffset.x ? minXYOffset.x : x;
            y = y < minXYOffset.y ? minXYOffset.y : y;
        } // if

        if (maxXYOffset) {
            x = x > maxXYOffset.x ? maxXYOffset.x : x;
            y = y > maxXYOffset.y ? maxXYOffset.y : y;
        } // if

        if (tweenFn) {
            if (panimating) {
                return;
            } // if

            var tweenX = COG.tweenValue(offsetX, x, tweenFn,
                    updateOffsetAnimationEnd, tweenDuration),

                tweenY = COG.tweenValue(offsetY, y, tweenFn,
                    updateOffsetAnimationEnd, tweenDuration);

            tweenX.cancelOnInteract = true;
            tweenX.requestUpdates(function(updatedVal) {
                offsetX = updatedVal | 0;
                panimating = true;
                invalidate();
            });

            tweenY.cancelOnInteract = true;
            tweenY.requestUpdates(function(updatedVal) {
                offsetY = updatedVal | 0;
                panimating = true;
                invalidate();
            });
        }
        else {
            offsetX = x | 0;
            offsetY = y | 0;
        } // if..else
    } // updateOffset


    /* private functions */

    function attachToCanvas(newWidth, newHeight) {
        var ii;

        if (canvas) {
            if (eventMonitor) {
                eventMonitor.unbind();
            } // if

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

                self.trigger('resize', viewWidth, viewHeight);

                for (ii = layerCount; ii--; ) {
                    layers[ii].trigger('resize', viewWidth, viewHeight);
                } // for
            } // if

            if (params.interactive) {
                eventMonitor = INTERACT.watch(canvas).pannable();
                captureInteractionEvents();
            } // if

            for (ii = layerCount; ii--; ) {
                layerContextChanged(layers[ii]);
            } // for

            invalidate(true);
        } // if
    } // attachToCanvas

    function addLayer(id, value) {
        value.setId(id);
        value.added = ticks();

        value.bind('remove', function() {
            self.removeLayer(id);
        });

        layerContextChanged(value);

        value.setParent(self);

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
        if (! eventMonitor) {
            return;
        }

        if (params.pannable) {
            eventMonitor.bind('pan', handlePan);

            eventMonitor.bind("inertiaCancel", function(evt) {
                panimating = false;
                invalidate();
            });
        } // if

        if (params.scalable) {
            eventMonitor.bind('zoom', handleZoom);
            eventMonitor.bind('doubleTap', handleDoubleTap);
        } // if

        eventMonitor.bind('tap', handlePointerTap);
    } // captureInteractionEvents

    /*
    The constrain offset function is used to keep the view offset within a specified
    offset using wrapping if allowed.  The function is much more 'if / then / elsey'
    than I would like, and might be optimized at some stage, but it does what it needs to
    */
    function constrainOffset() {
        var testX = offsetWrapX ? offsetX + halfWidth : offsetX,
            testY = offsetWrapY ? offsetY + halfHeight : offsetY;

        if (offsetMaxX && offsetMaxX > viewWidth) {
            if (testX + viewWidth > offsetMaxX) {
                if (offsetWrapX) {
                    offsetX = testX - offsetMaxX > 0 ? offsetX - offsetMaxX : offsetX;
                }
                else {
                    offsetX = offsetMaxX - viewWidth;
                } // if..else
            }
            else if (testX < 0) {
                offsetX = offsetWrapX ? offsetX + offsetMaxX : 0;
            } // if..else
        } // if

        if (offsetMaxY && offsetMaxY > viewHeight) {
            if (testY + viewHeight > offsetMaxY) {
                if (offsetWrapY) {
                    offsetY = testY - offsetMaxY > 0 ? offsetY - offsetMaxY : offsetY;
                }
                else {
                    offsetY = offsetMaxY - viewHeight;
                } // if..else
            }
            else if (testY < 0) {
                offsetY = offsetWrapY ? offsetY + offsetMaxY : 0;
            } // if..else
        } // if
    } // constrainOffset

    function getLayerIndex(id) {
        for (var ii = layerCount; ii--; ) {
            if (layers[ii].getId() == id) {
                return ii;
            } // if
        } // for

        return -1;
    } // getLayerIndex

    /* draw code */

    function triggerIdle() {
        refresh();

        idle = true;
        idleTimeout = 0;
    } // idle

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

    function drawView(drawState, rect, redraw, tickCount) {
        var drawLayer,
            rectCenter = XYRect.center(rect),
            ii = 0;

        drawRect = XYRect.copy(rect);

        drawRect.scaleFactor = scaleFactor;

        if (redraw) {
            mainContext.clearRect(0, 0, viewWidth, viewHeight);
        } // if

        mainContext.save();

        try {
            mainContext.globalCompositeOperation = 'source-over';

            if (scaleFactor !== 1) {
                drawRect = calcZoomRect(drawRect);
                mainContext.scale(scaleFactor, scaleFactor);
            } // if

            mainContext.translate(-drawRect.x1, -drawRect.y1);

            layerMinXY = null;
            layerMaxXY = null;

            /* first pass - clip */

            if (clipping) {
                mainContext.beginPath();

                clipped = false;
                for (ii = layerCount; ii--; ) {
                    if (layers[ii].clip) {
                        layers[ii].clip(mainContext, drawRect, drawState, self, redraw, tickCount);
                        clipped = true;
                    } // if
                } // for

                mainContext.closePath();
                if (clipped) {
                    mainContext.clip();
                } // if
            } // if

            /* second pass - draw */

            for (ii = layerCount; ii--; ) {
                drawLayer = layers[ii];

                var layerStyle = drawLayer.style,
                    previousStyle = layerStyle ? Style.apply(mainContext, layerStyle) : null;

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

                drawLayer.draw(
                    mainContext,
                    drawRect,
                    drawState,
                    self,
                    redraw,
                    tickCount);

                if (previousStyle) {
                    Style.apply(mainContext, previousStyle);
                } // if
            } // for

        }
        finally {
            mainContext.restore();
        } // try..finally


        if (guides) {
            mainContext.globalCompositeOperation = 'source-over';
            mainContext.strokeStyle = '#f00';
            mainContext.beginPath();
            mainContext.moveTo(halfWidth, 0);
            mainContext.lineTo(halfWidth, viewHeight);
            mainContext.moveTo(0, halfHeight);
            mainContext.lineTo(viewWidth, halfHeight);
            mainContext.stroke();
        } // if

        triggerAll('drawComplete', rect, tickCount);
        COG.trace("draw complete", tickCount);
    } // drawView

    function cycle(tickCount, worker) {
        var draw = false,
            currentState = stateOverride ? stateOverride : (panimating ? statePan : state),
            interacting = (! panimating) &&
                ((currentState === stateZoom) || (currentState === statePan)),
            requireRedraw = redrawView ||
                        currentState === statePan ||
                        (COG.getTweens().length > 0);

        if (sizeChanged && canvas) {
            if (typeof FlashCanvas != 'undefined') {
                FlashCanvas.initElement(canvas);
            } // if

            canvas.width = viewWidth;
            canvas.height = viewHeight;

            canvas.style.width = viewWidth + 'px';
            canvas.style.height = viewHeight + 'px';

            sizeChanged = false;
        } // if

        if (offsetMaxX || offsetMaxY) {
            constrainOffset();
        } // if

        cycleRect = getViewRect();

        if (interacting) {
            COG.endTweens(function(tweenInstance) {
                return tweenInstance.cancelOnInteract;
            });

            idle = false;
            if (idleTimeout !== 0) {
                clearTimeout(idleTimeout);
                idleTimeout = 0;
            } // if
        }  // if

        for (var ii = layerCount; ii--; ) {
            if (layers[ii].animated) {
                state = state | stateAnimating;
            } // if

            layers[ii].cycle(tickCount, cycleRect, state, requireRedraw);
            draw = layers[ii].shouldDraw(state, cycleRect, requireRedraw) || draw;
        } // for

        requireRedraw = requireRedraw || ((state & stateAnimating) !== 0);

        draw = draw || requireRedraw || ((scaleFactor !== 1) && (scaleFactor !== lastScaleFactor));
        if (draw) {
            drawView(currentState, cycleRect, requireRedraw, tickCount);
            lastScaleFactor = scaleFactor;

            redrawView = false;
        } // if

        if ((! draw) && (wakeTriggers === 0) && (! isFlash)) {
            if ((! idle) && (idleTimeout === 0)) {
                idleTimeout = setTimeout(triggerIdle, idleDelay);
            } // if

            worker.trigger('complete');
        } // if

        if (tickCount - lastRefresh > minRefresh) {
            refresh();
        } // if

        wakeTriggers = 0;
        COG.trace("Completed draw cycle", tickCount);
    } // cycle

    /**
    ### invalidate()
    The `invalidate` method is used to inform the view that a full redraw
    is required
    */
    function invalidate(redraw) {
        redrawView = redraw ? true : false;

        wakeTriggers += 1;
        if (cycleWorker) { return; }

        cycleWorker = COG.Loopage.join({
            execute: cycle,
            frequency: cycleDelay
        });

        cycleWorker.bind('complete', function(evt) {
            cycleWorker = null;
        });
    } // invalidate

    function layerContextChanged(layer) {
        layer.trigger("contextChanged", mainContext);
    } // layerContextChanged

    /* exports */

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
    ### getDimensions()
    Return the Dimensions of the View
    */
    function getDimensions() {
        return Dimensions.init(viewWidth, viewHeight);
    } // getDimensions

    /**
    ### getLayer(id)
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
    ### getOffset()
    Return a T5.XY containing the current view offset
    */
    function getOffset() {
        return XY.init(offsetX, offsetY);
    } // getOffset

    /**
    ### setMaxOffset(maxX, maxY, wrapX, wrapY)
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
    ### getViewRect()
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
        } // if

        invalidate();

        return value;
    } // setLayer

    /**
    ### refresh()
    */
    function refresh() {
        lastRefresh = new Date().getTime();
        triggerAll('refresh', self);

        invalidate();
    } // refresh

    /**
    ### removeLayer(id: String)
    Remove the T5.ViewLayer specified by the id
    */
    function removeLayer(id) {
        var layerIndex = getLayerIndex(id);
        if ((layerIndex >= 0) && (layerIndex < layerCount)) {
            self.trigger('layerRemoved', layers[layerIndex]);

            layers.splice(layerIndex, 1);
            invalidate(true);
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
    ### scale(targetScaling, targetXY, tweenFn, callback)
    */
    function scale(targetScaling, targetXY, tweenFn, callback, duration) {
        if (tweenFn && (! scaleTween)) {
            scaleTween = COG.tweenValue(scaleFactor, targetScaling, tweenFn, null, duration);

            scaleTween.requestUpdates(function(updatedValue, completed) {
                scaleFactor = updatedValue;

                if (completed) {
                    var scaleFactorExp = round(log(scaleFactor) / Math.LN2);

                    scaleFactor = pow(2, scaleFactorExp);

                    if (callback) {
                        callback();
                    } // if

                    scaleTween = null;
                } // if

                setZoomCenter(targetXY);
                scaleView(completed);
            });
        }
        else {
            scaleFactor = targetScaling;

            setZoomCenter(targetXY);
            scaleView();
        }  // if..else

        return self;
    } // scale

    /**
    ### triggerAll(eventName, args*)
    Trigger an event on the view and all layers currently contained in the view
    */
    function triggerAll() {
        var cancel = self.trigger.apply(null, arguments).cancel;
        for (var ii = layers.length; ii--; ) {
            cancel = layers[ii].trigger.apply(null, arguments).cancel || cancel;
        } // for

        return (! cancel);
    } // triggerAll

    function triggerAllUntilCancelled() {
        var cancel = self.trigger.apply(null, arguments).cancel;
        for (var ii = layers.length; ii--; ) {
            cancel = layers[ii].trigger.apply(null, arguments).cancel || cancel;
        } // for

        return (! cancel);
    } // triggerAllUntilCancelled

    /* object definition */

    var self = {
        id: params.id,
        deviceScaling: deviceScaling,
        fastDraw: params.fastDraw || getConfig().requireFastDraw,

        getDimensions: getDimensions,
        getLayer: getLayer,
        setLayer: setLayer,
        eachLayer: eachLayer,
        invalidate: invalidate,
        refresh: refresh,
        resetScale: resetScale,
        resize: resize,
        scale: scale,
        triggerAll: triggerAll,
        removeLayer: removeLayer,

        /**
        ### stateOverride(state)
        This function is used to define an override state for the view
        */
        stateOverride: function(value) {
            stateOverride = value;
        },

        /* offset methods */

        getOffset: getOffset,
        setMaxOffset: setMaxOffset,
        getViewRect: getViewRect,
        updateOffset: updateOffset,
        pan: pan
    };

    deviceScaling = getConfig().getScaling();

    self.markers = addLayer('markers', new MarkerLayer());

    COG.observable(self);

    self.bind('invalidate', function(evt, redraw) {
        invalidate(redraw);
    });

    self.bind('resync', handleResync);

    COG.configurable(
        self,
        ["inertia", "container", 'rotation', 'tapExtent', 'scalable', 'pannable'],
        COG.paramTweaker(params, null, {
            "container": handleContainerUpdate,
            'rotation':  handleRotationUpdate
        }),
        true);

    attachToCanvas();

    if (params.autoSize) {
        if (isIE) {
            window.attachEvent('onresize', handleResize);
        }
        else {
            window.addEventListener('resize', handleResize, false);
        }
    } // if

    return self;
}; // T5.View

/**
# T5.ViewLayer

In and of itself, a View does nothing.  Not without a
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

    var self = COG.extend({
        /**
        ### addToView(view)
        Used to add the layer to a view.  This simply calls T5.View.setLayer
        */
        addToView: function(view) {
            view.setLayer(id, self);
        },

        /**
        ### shouldDraw(displayState)

        Called by a View that contains the layer to determine
        whether or not the layer should be drawn for the current display state.
        The default implementation of this method first checks the fastDraw status,
        and then continues to do a bitmask operation against the validStates property
        to see if the current display state is acceptable.
        */
        shouldDraw: function(displayState, viewRect, redraw) {
            var drawOK = changed ||
                    redraw ||
                    (lastOffsetX !== viewRect.x1) ||
                    (lastOffsetY !== viewRect.y1);

            return drawOK && ((displayState & validStates) !== 0) &&
                (parentFastDraw ? supportFastDraw: true);
        },

        /**
        ### clip(context, offset, dimensions, state)
        */
        clip: null,

        /**
        ### cycle(tickCount, offset, state, redraw)

        Called in the View method of the same name, each layer has an opportunity
        to update itself in the current animation cycle before it is drawn.
        */
        cycle: function(tickCount, offset, state, redraw) {
        },

        /**
        ### draw(context, offset, dimensions, state, view)

        The business end of layer drawing.  This method is called when a layer needs to be
        drawn and the following parameters are passed to the method:

            - context - the canvas context that we are drawing to
            - viewRect - the current view rect
            - state - the current DisplayState of the view
            - view - a reference to the View
            - redraw - whether a redraw is required
            - tickCount - the current tick count
        */
        draw: function(context, viewRect, state, view, redraw, tickCount) {
        },

        /**
        ### remove()

        The remove method enables a view to flag that it is ready or should be removed
        from any views that it is contained in.  This was introduced specifically for
        animation layers that should only exist as long as an animation is active.
        */
        remove: function() {
            self.trigger('remove', self);
        },

        /**
        ### changed(redraw)

        The changed method is used to flag the layer has been modified and will require
        a redraw

        */
        changed: function(redraw) {
            changed = true;
            self.trigger('changed', self);

            if (parent) {
                parent.trigger('invalidate', redraw);
            } // if
        },

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

            self.trigger('parentChange', parent);
        }
    }, params); // self

    COG.observable(self);

    self.bind('drawComplete', function(evt, viewRect, tickCount) {
        changed = false;

        lastOffsetX = viewRect.x1;
        lastOffsetY = viewRect.y1;
    });

    self.bind('resync', function(evt, view) {
       if (view.syncXY) {
           if (self.minXY) {
               view.syncXY(self.minXY);
           } // if

           if (self.maxXY) {
               view.syncXY(self.maxXY);
           } // if
       } // if
    });

    return self;
}; // T5.ViewLayer
/**
# T5.ImageLayer
*/
var ImageLayer = function(genId, params) {
    params = COG.extend({
        imageLoadArgs: {}
    }, params);

    var generator = genId ? Generator.init(genId, params) : null,
        generatedImages = [],
        lastViewRect = XYRect.init(),
        loadArgs = params.imageLoadArgs;

    /* private internal functions */

    function eachImage(viewRect, viewState, callback) {
        for (var ii = generatedImages.length; ii--; ) {
            var imageData = generatedImages[ii],
                xx = imageData.x,
                yy = imageData.y,
                imageRect = XYRect.init(
                    imageData.x,
                    imageData.y,
                    imageData.x + imageData.width,
                    imageData.y + imageData.height);

            if (callback && XYRect.intersect(viewRect, imageRect)) {
                var image = Images.get(imageData.url, function(loadedImage) {
                    self.changed();
                }, loadArgs);

                callback(image, xx, yy, imageData.width, imageData.height);
            } // if
        } // for
    } // eachImage

    /* every library should have a regenerate function - here's mine ;) */
    function regenerate(viewRect) {
        if (generator) {
            generator.run(viewRect, self.getParent(), function(images) {
                generatedImages = [].concat(images);
                self.changed();
            });
        } // if
    } // regenerate

    /* event handlers */

    function handleRefresh(evt, view) {
        regenerate(lastViewRect);
    } // handleViewIdle

    function handleTap(evt, absXY, relXY, offsetXY) {
        var tappedImages = [],
            offsetX = offsetXY.x,
            offsetY = offsetXY.y,
            genImage,
            tapped;

        if (generatedImages) {
            for (var ii = generatedImages.length; ii--; ) {
                genImage = generatedImages[ii];

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
            self.trigger('tapImage', tappedImages, absXY, relXY, offsetXY);
        } // if
    } // handleTap

    /* exports */

    /**
    ### changeGenerator(generatorId, args)
    */
    function changeGenerator(generatorId, args) {
        generator = Generator.init(generatorId, COG.extend({}, params, args));

        generatedImages = null;
        regenerate(lastViewRect);
    } // changeGenerator

    function clip(context, viewRect, state, view) {
        eachImage(viewRect, state, function(image, x, y, width, height) {
            if (image) {
                context.rect(x, y, width, height);
            } // if
        });
    } // clip

    function draw(context, viewRect, state, view) {

        eachImage(viewRect, state, function(image, x, y, width, height) {
            self.drawImage(context, image, x, y, width, height, viewRect, state);
        });

        lastViewRect = XYRect.copy(viewRect);
    } // draw

    function drawImage(context, image, x, y, width, height, viewRect, state) {
        if (image) {
            context.drawImage(
                image,
                x,
                y,
                image.width,
                image.height);
        }
    } // drawImage

    /* definition */

    var self = COG.extend(new ViewLayer(params), {
        changeGenerator: changeGenerator,
        clip: clip,

        cycle: function(tickCount, rect, state, redraw) {
            regenerate(rect);
        },

        draw: draw,
        drawImage: drawImage
    });

    self.bind('refresh', handleRefresh);
    self.bind('tap', handleTap);

    return self;
};

/**
# T5.Marker
This is a generic marker that can be applied via a T5.MarkerLayer
to any T5.View, but is commonly used in a T5.Map.  An marker is able to
be animated and examples of this can be seen in the [Tile5 Sandbox](http://sandbox.tile5.org)

## Constructor
`new T5.Marker(params);`

### Initialization Parameters

- `xy` (T5.Vector) - a vector that specifies the grid position of the marker. When
working with Geo data, the T5.Geo.GeoVector provides a simple way to specify this
position.

- `offset` (boolean, default = true) - whether or not the `xy` vector is relative to the
current grid offset.  In the case where you wish to create a marker that is relative to the
view and not the grid, set this parameter to false.

- `tweenIn` (easing function, default = null) - the easing function that is used to
animate the entry of the annotation.  When not provided, the annotation is simply
displayed statically.

- `animationSpeed` (int, default = 0) - the speed that the annotation should be animated
in at.  Used in combination with the `tweenIn` parameter.


## Methods

*/
var Marker = function(params) {
    params = COG.extend({
        xy: XY.init(),
        offset: true,
        tweenIn: null,
        animationSpeed: null,
        isNew: true
    }, params);

    var MARKER_SIZE = 4,
        animating = false,
        boundsX = 0,
        boundsY = 0,
        boundsWidth = 0,
        boundsHeight = 0,
        isOffset = params.offset;

    function updateBounds(newX, newY, newWidth, newHeight) {
        boundsX = newX;
        boundsY = newY;
        boundsWidth = newWidth;
        boundsHeight = newHeight;

    } // updateBounds

    var self = COG.extend(params, {
        /*
        ### isAnimating()
        Return true if we are currently animating the marker, false otherwise
        */
        isAnimating: function() {
            return animating;
        },

        /**
        ### draw(context, offset, state, overlay, view)
        The draw method is called by the T5.ViewLayer that contains the annotation
        and is used to draw the annotation to the specified context.  When creating
        a custom marker, you should provide a custom implementation of the `drawMarker`
        method rather than this method.
        */
        draw: function(context, viewRect, state, overlay, view) {
            if (self.isNew && (params.tweenIn)) {
                var endValue = self.xy.y;

                self.xy.y = viewRect.y1 - 20;

                animating = true;

                COG.tween(
                    self.xy,
                    'y',
                    endValue,
                    params.tweenIn,
                    function() {
                        self.xy.y = endValue >> 0;
                        animating = false;
                    },
                    params.animationSpeed ?
                        params.animationSpeed :
                        250 + (Math.random() * 500)
                );
            } // if

            self.drawMarker(
                context,
                viewRect,
                self.xy.x,
                self.xy.y,
                state,
                overlay,
                view);

            self.isNew = false;
        },

        /**
        ### drawMarker(context, offset, x, y, state, overlay, view)
        The `drawMarker` method is the place holder implementation for drawing
        markers.  In the case of a T5.Annotation a simple circle is drawn, but
        extensions of T5.Annotation would normally replace this implementation
        with their own modified implementation (such as T5.ImageAnnotation does).
        */
        drawMarker: function(context, viewRect, x, y, state, overlay, view) {
            context.beginPath();
            context.arc(
                x,
                y,
                MARKER_SIZE,
                0,
                Math.PI * 2,
                false);
            context.fill();

            updateBounds(x - MARKER_SIZE, y  - MARKER_SIZE,
                MARKER_SIZE*2, MARKER_SIZE*2);
        },

        /**
        ### hitTest(testX, testY)
        This method is used to determine if the marker is located  at the specified
        x and y position.
        */
        hitTest: function(testX, testY) {
            return (testX >= boundsX) && (testX <= boundsX + boundsWidth) &&
                (testY >= boundsY) && (testY <= boundsY + boundsHeight);
        },

        updateBounds: updateBounds
    }); // self

    COG.observable(self);

    return self;
};
/**
# T5.ImageMarker
_extends:_ T5.Marker


An image annotation is simply a T5.Annotation that has been extended to
display an image rather than a simple circle.  Probably the most common type
of annotation used.  Supports using either the `image` or `imageUrl` parameters
to use preloaded or an imageurl for displaying the annotation.

## TODO

- currently hits on animated markers not working as well as they should, need to
tweak touch handling to get this better...


## Constructor
`new T5.ImageMarker(params);`

### Initialization Parameters

- `image` (HTMLImage, default = null) - one of either this or the `imageUrl` parameter
is required and the specified image is used to display the annotation.

- `imageUrl` (String, default = null) - one of either this of the `image` parameter is
required.  If specified, the image is obtained using T5.Images module and then drawn
to the canvas.

- `animatingImage` (HTMLImage, default = null) - an optional image that can be supplied,
and if so, the specified image will be used when the annotation is animating rather than
the standard `image`.  If no `animatingImage` (or `animatingImageUrl`) is specified then
the standard image is used as a fallback when the marker is animating.

- `animatingImageUrl` (String, default = null) - as per the `animatingImage` but a url
for an image that will be loaded via T5.Images

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
var ImageMarker = function(params) {
    params = COG.extend({
        image: null,
        imageUrl: null,
        animatingImage: null,
        animatingImageUrl: null,
        imageAnchor: null,
        rotation: 0,
        scale: 1,
        opacity: 1
    }, params);

    var imageOffset = params.imageAnchor ?
            T5.XY.invert(params.imageAnchor) :
            null;

    function getImageUrl() {
        if (params.animatingImageUrl && self.isAnimating()) {
            T5.Images.load(params.imageUrl);

            return params.animatingImageUrl;
        }
        else {
            return params.imageUrl;
        } // if..else
    } // getImageUrl

    /* exports */

    function drawMarker(context, viewRect, x, y, state, overlay, view) {
        var image = self.isAnimating() && self.animatingImage ?
                self.animatingImage : self.image;

        if (image && (image.width > 0)) {
            if (! imageOffset) {
                imageOffset = XY.init(
                    -image.width >> 1,
                    -image.height >> 1
                );
            } // if

            var currentScale = self.scale,
                drawX = x + ~~(imageOffset.x * currentScale),
                drawY = y + ~~(imageOffset.y * currentScale),
                drawWidth = ~~(image.width * currentScale),
                drawHeight = ~~(image.height * currentScale);


            self.updateBounds(drawX, drawY, drawWidth, drawWidth);

            if (self.rotation || (self.opacity !== 1)) {
                context.save();
                try {
                    context.globalAlpha = self.opacity;
                    context.translate(x, y);
                    context.rotate(self.rotation);

                    context.drawImage(
                        image,
                        imageOffset.x * currentScale,
                        imageOffset.y * currentScale,
                        drawWidth,
                        drawHeight);
                }
                finally {
                    context.restore();
                } // try..finally
            }
            else {
                context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
            } // if..else
        } // if
    } // drawImage

    var self = COG.extend(new Marker(params), {
        /**
        ### drawMarker(context, offset, xy, state, overlay, view)
        An overriden implementation of the T5.Annotation.drawMarker which
        draws an image to the canvas.
        */
        drawMarker: drawMarker
    });

    if (! self.image) {
        self.image = Images.get(params.imageUrl, function(loadedImage) {
            self.image = loadedImage;
        });
    } // if

    if (! self.animatingImage) {
        self.animatingImage = Images.get(params.animatingImageUrl, function(loadedImage) {
            self.animatingImage = loadedImage;
        });
    } // if

    return self;
};
/**
# T5.MarkerLayer
_extends:_ T5.ViewLayer


The T5.MarkerLayer provides a T5.ViewLayer that can be used to display one
or more T5.Annotation on a T5.View.  Most commonly used with a T5.Map (which
includes a marker layer by default).

## Events

### markerUpdate
This event is triggered when the markers have been updated (new markers added,
markers cleared, etc)

<pre>
layer.bind('markerUpdate', function(markers) {
});
</pre>

- markers (T5.Annotation[]) - the markers in the marker layer after the update has
been completed


### markerTap
The markerTap event is triggered when markers have been tapped in the marker layer.
The T5.MarkerLayer listens for `tap` events on itself and when triggered looks for
any markers within a tapExtent and if found fires the markerTap event.

<pre>
layer.bind('markerTap', function(absXY, relXY, markers) {
});
</pre>

- absXY (T5.Vector) - the absolute tap position (as per T5.ViewLayer)
- relXY (T5.Vector) - the relative tap position (as per T5.ViewLayer)
- markers (T5.Annotation[]) - an array of the markers that have been _hit_ in the last tap


## Methods
*/
var MarkerLayer = function(params) {
    params = COG.extend({
        zindex: 100,
        style: 'basic'
    }, params);

    var markers = [];

    /* event handlers */

    function handleTap(evt, absXY, relXY, gridXY) {
        var tappedMarkers = [],
            testX = gridXY.x,
            testY = gridXY.y;

        for (var ii = markers.length; ii--; ) {
            if (markers[ii].hitTest(testX, testY)) {
                tappedMarkers[tappedMarkers.length] = markers[ii];
            } // if
        } // for


        if (tappedMarkers.length > 0) {
            evt.cancel = self.trigger('markerTap', absXY, relXY, tappedMarkers).cancel;
        } // if
    } // handleTap

    /* internal functions */

    /*
    This function is used to provide updates when the markers have changed. This
    involves informing other waking the parent view and having a redraw occur and
    additionally, firing the markers changed event
    */
    function markerUpdate() {
        self.changed(true);

        self.trigger('markerUpdate', markers);
    } // markerUpdate

    function resyncMarkers() {
        var parent = self.getParent();
        if (parent && parent.syncXY) {
            for (var ii = markers.length; ii--; ) {
                parent.syncXY([markers[ii].xy]);
            } // for
        } // if
    } // resyncMarkers

    /* exports */

    /**
    ### add(items)
    The add method of the marker layer can accept either a single T5.Annotation to
    add to the layer or alternatively an array of annotations to add.

    #### Example Usage
    ~ // adding a single marker
    ~ layer.add(new T5.Annotation({
    ~     xy: T5.GeoXY.init(markerPos) // markerPos is a T5.Geo.Position
    ~ }));
    ~
    ~ // adding multiple markers
    ~ var markers = [];
    ~
    ~ // you would populate the markers array here...
    ~
    ~ // add the markers to the layer
    ~ layer.add(markers);
    */
    function add(newItems) {
        if (newItems && (typeof newItems.length !== 'undefined')) {
            for (var ii = newItems.length; ii--; ) {
                if (newItems[ii]) {
                    markers[markers.length] = newItems[ii];
                } // if
            } // for
        }
        else if (newItems) {
            markers[markers.length] = newItems;
        } // if..else

        markerUpdate();
    } // add

    /**
    ### clear(testCallback)
    The clear method is used to clear markers from the marker layer.  The optional
    `testCallback` argument can be specified to determine whether a marker should be
    removed or not.

    #### Example Usage
    ~ layer.clear(function(marker) {
    ~     // check an arbitrary property of the annotation
    ~     // if Australia, then flag for removal
    ~     return (marker.country === 'Australia');
    ~ });
    */
    function clear(testCallback) {
        if (testCallback) {
            var ii = 0;
            while (ii < markers.length) {
                if (testCallback(markers[ii])) {
                    markers.splice(ii, 1);
                }
                else {
                    ii += 1;
                } // if..else
            } // while
        }
        else {
            markers = [];
        } // if..else

        markerUpdate();
    } // clear

    /**
    ### each(callback)
    Iterate through each of the markers and fire the callback for each one
    */
    function each(callback) {
        if (callback) {
            for (var ii = markers.length; ii--; ) {
                callback(markers[ii]);
            } // for
        } // if
    } // each

    /**
    ### find(testCallback)
    Find markers that match the requirements of the test callback.  For an example
    of test callback usage see the `clear` method.
    */
    function find(testCallback) {
        var results = [];

        for (var ii = markers.length; ii--; ) {
            if ((! testCallback) || testCallback(markers[ii])) {
                results[results.length] = markers[ii];
            } // if
        } // for


        return results;
    } // testCallback

    var self = COG.extend(new ViewLayer(params), {
        draw: function(context, viewRect, state, view) {
            for (var ii = markers.length; ii--; ) {
                markers[ii].draw(
                    context,
                    viewRect,
                    state,
                    self,
                    view);
            } // for
        },

        add: add,
        clear: clear,
        each: each,
        find: find
    });

    self.bind('tap', handleTap);
    self.bind('parentChange', resyncMarkers);
    self.bind('resync', resyncMarkers);
    self.bind('changed', resyncMarkers);

    return self;
};

/**
# T5.PathLayer
_extends:_ T5.ViewLayer


The T5.PathLayer is used to display a single path on a T5.View
*/
var PathLayer = function(params) {
    params = COG.extend({
        style: 'waypoints',
        pixelGeneralization: 8,
        zindex: 50
    }, params);

    var redraw = false,
        coordinates = [],
        markerCoordinates = null,
        rawCoords = [],
        rawMarkers = null,
        pathAnimationCounter = 0,
        spawnedAnimations = [];

    /* private internal functions */

    function resyncPath() {
        var parent = self.getParent();
        if (parent && parent.syncXY) {
            parent.syncXY(rawCoords);
            if (rawMarkers) {
                parent.syncXY(rawMarkers);
            } // if

            self.trigger('tidy');
        } // if
    } // resyncPath

    var self = COG.extend(new ViewLayer(params), {
        getAnimation: function(easingFn, duration, drawCallback, autoCenter) {
            var layerId = 'pathAnimation' + pathAnimationCounter++;
            spawnedAnimations.push(layerId);

            return new AnimatedPathLayer({
                id: layerId,
                path: coordinates,
                zindex: params.zindex + 1,
                easing: easingFn ? easingFn : COG.easing('sine.inout'),
                duration: duration ? duration : 5000,
                drawIndicator: drawCallback,
                autoCenter: autoCenter ? autoCenter : false
            });
        },

        cycle: function(tickCount, viewRect, state, redraw) {
            return redraw;
        },

        draw: function(context, viewRect, state, view) {
            var ii,
                coordLength = coordinates.length;

            context.save();
            try {
                Style.apply(context, params.style);

                if (coordLength > 0) {
                    context.beginPath();
                    context.moveTo(
                        coordinates[coordLength - 1].x,
                        coordinates[coordLength - 1].y);

                    for (ii = coordLength; ii--; ) {
                        context.lineTo(
                            coordinates[ii].x,
                            coordinates[ii].y);
                    } // for

                    context.stroke();

                    if (markerCoordinates) {
                        context.fillStyle = params.waypointFillStyle;

                        for (ii = markerCoordinates.length; ii--; ) {
                            context.beginPath();
                            context.arc(
                                markerCoordinates[ii].x,
                                markerCoordinates[ii].y,
                                2,
                                0,
                                Math.PI * 2,
                                false);

                            context.stroke();
                            context.fill();
                        } // for
                    } // if
                } // if
            }
            finally {
                context.restore();
            }

            redraw = false;
        },

        updateCoordinates: function(coords, markerCoords) {
            rawCoords = coords;
            rawMarkers = markerCoords;

            resyncPath();
        }
    });

    self.bind('tidy', function(evt) {
        coordinates = XY.simplify(rawCoords, params.pixelGeneralization);
        markerCoordinates = XY.simplify(rawMarkers, params.pixelGeneralization);

        redraw = true;
        self.changed();
    });

    self.bind('resync', resyncPath);

    return self;
};
/**
# T5.AnimatedPathLayer
_extends:_ T5.ViewLayer


The AnimatedPathLayer is way cool :)  This layer allows you to supply an array of
screen / grid coordinates and have that animated using the functionality T5.Animation module.
Any type of T5.PathLayer can generate an animation.

## Constructor
`new T5.AnimatedPathLayer(params);`

### Initialization Parameters

- `path` (T5.Vector[], default = []) - An array of screen / grid coordinates that will
be used as anchor points in the animation.

- `id` (String, default = 'pathAni%autoinc') - The id of of the animation layer.  The id will start with
pathAni1 and then automatically increment each time a new AnimatedPathLayer is created unless the id is
manually specified in the constructor parameters.

- `easing` (easing function, default = COG.easing('sine.inout')) - the easing function to use for the animation

- `drawIndicator` (callback, default = defaultDraw) - A callback function that is called every time the indicator for
the animation needs to be drawn.  If the parameter is not specified in the constructor the default callback
is used, which simply draws a small circle at the current position of the animation.

- `duration` (int, default = 2000) - The animation duration.  See T5.Animation module information for more details.


## Draw Indicator Callback Function
`function(context, viewRect, xy, theta)`


The drawIndicator parameter in the constructor allows you to specify a particular callback function that is
used when drawing the indicator.  The function takes the following arguments:


- `context` - the canvas context to draw to when drawing the indicator
- `viewRect` - the current viewRect to take into account when drawing
- `xy` - the xy position where the indicator should be drawn
- `theta` - the current angle (in radians) given the path positioning.
*/
var AnimatedPathLayer = function(params) {
    params = COG.extend({
        path: [],
        id: COG.objId('pathAni'),
        easing: COG.easing('sine.inout'),
        validStates: viewState('ACTIVE', 'PAN', 'ZOOM'),
        drawIndicator: null,
        duration: 2000
    }, params);

    var edgeData = XY.edges(params.path),
        tween,
        theta,
        indicatorXY = null,
        pathOffset = 0;

    function drawDefaultIndicator(context, viewRect, indicatorXY) {
        context.fillStyle = "#FFFFFF";
        context.strokeStyle = "#222222";
        context.beginPath();
        context.arc(
            indicatorXY.x,
            indicatorXY.y,
            4,
            0,
            Math.PI * 2,
            false);
        context.stroke();
        context.fill();
    } // drawDefaultIndicator

    tween = COG.tweenValue(
        0,
        edgeData.total,
        params.easing,
        function() {
            self.remove();
        },
        params.duration);

    tween.requestUpdates(function(updatedValue, complete) {
        pathOffset = updatedValue;

        if (complete) {
            self.remove();
        } // if
    });

    var self =  COG.extend(new ViewLayer(params), {
        cycle: function(tickCount, viewRect, state, redraw) {
            var edgeIndex = 0;

            while ((edgeIndex < edgeData.accrued.length) && (edgeData.accrued[edgeIndex] < pathOffset)) {
                edgeIndex++;
            } // while

            indicatorXY = null;

            if (edgeIndex < params.path.length-1) {
                var extra = pathOffset - (edgeIndex > 0 ? edgeData.accrued[edgeIndex - 1] : 0),
                    v1 = params.path[edgeIndex],
                    v2 = params.path[edgeIndex + 1];

                theta = XY.theta(v1, v2, edgeData.edges[edgeIndex]);
                indicatorXY = XY.extendBy(v1, theta, extra);
            } // if

            return indicatorXY;
        },

        draw: function(context, viewRect, state, view) {
            if (indicatorXY) {
                (params.drawIndicator ? params.drawIndicator : drawDefaultIndicator)(
                    context,
                    viewRect,
                    XY.init(indicatorXY.x, indicatorXY.y),
                    theta
                );
            } // if
        }
    });

    return self;
}; // T5.AnimatedPathLayer

/**
# T5.Shape
The T5.Shape class is simply a template class that provides placeholder methods
that need to be implemented for shapes that can be drawn in a T5.ShapeLayer.

## Constructor
`new T5.Shape(params);`

### Initialization Parameters

-
*/
var Shape = function(params) {
    params = COG.extend({
        style: null,
        properties: {}
    }, params);

    return COG.extend(params, {
        rect: null,

        /**
        ### draw(context, offsetX, offsetY, width, height, state)
        */
        draw: function(context, offsetX, offsetY, width, height, state) {
        },

        /**
        ### resync(view)
        */
        resync: function(view) {
        }
    });
};

var Arc = function(origin, params) {
   params = COG.extend({
       size: 4
   }, params);

   var drawXY = XY.init();

   var self = COG.extend(params, {
       /**
       ### draw(context, offsetX, offsetY, width, height, state)
       */
       draw: function(context, offsetX, offsetY, width, height, state) {
           context.beginPath();
           context.arc(
               drawXY.x,
               drawXY.y,
               self.size,
               0,
               Math.PI * 2,
               false);

           context.fill();
           context.stroke();
       },

       /**
       ### resync(view)
       */
       resync: function(view) {
           var centerXY = view.syncXY([origin]).origin;
           drawXY = XY.floor([origin])[0];
       }
   });

   COG.info('created arc = ', origin);
   return self;
};

/**
# T5.Poly
This class is used to represent individual poly(gon/line)s that are drawn within
a T5.PolyLayer.

## Constructor

`new T5.Poly(points, params)`

The constructor requires an array of vectors that represent the poly and
also accepts optional initialization parameters (see below).


### Initialization Parameters

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.


## Methods
*/
var Poly = function(points, params) {
    params = COG.extend({
        fill: false,
        simplify: false
    }, params);

    var haveData = false,
        fill = params.fill,
        simplify = params.simplify,
        stateZoom = viewState('ZOOM'),
        drawPoints = [];

    /* exported functions */

    /**
    ### draw(context, offsetX, offsetY, state)
    This method is used to draw the poly to the specified `context`.  The
    `offsetX` and `offsetY` arguments specify the panning offset of the T5.View
    which is taken into account when drawing the poly to the display.  The
    `state` argument specifies the current T5.ViewState of the view.
    */
    function draw(context, offsetX, offsetY, width, height, state) {
        if (haveData) {
            var first = true,
                draw = (state & stateZoom) !== 0;

            context.beginPath();

            for (var ii = drawPoints.length; ii--; ) {
                var x = drawPoints[ii].x,
                    y = drawPoints[ii].y;

                if (first) {
                    context.moveTo(x, y);
                    first = false;
                }
                else {
                    context.lineTo(x, y);
                } // if..else

                draw = true; // draw || ((x >= 0 && x <= width) && (y >= 0 && y <= height));
            } // for

            if (draw) {
                if (fill) {
                    context.fill();
                } // if

                context.stroke();
            } // if
        } // if
    } // drawPoly

    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync(view) {
        self.xy = view.syncXY(points);

        drawPoints = XY.floor(simplify ? XY.simplify(points) : points);

    } // resyncToGrid

    /* define self */

    var self = COG.extend(new Shape(params), {
        draw: draw,
        resync: resync
    });

    haveData = points && (points.length >= 2);

    return self;
};

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
        zindex: 80
    }, params);

    var children = [];

    /* private functions */

    function performSync(view) {
        for (var ii = children.length; ii--; ) {
            children[ii].resync(view);
        } // for

        children.sort(function(shapeA, shapeB) {
            var diff = shapeB.xy.y - shapeA.xy.y;
            if (diff === 0) {
                diff = shapeB.xy.x - shapeA.xy.y;
            } // if

            return diff;
        });

        self.changed();
    } // performSync

    /* event handlers */

    function handleResync(evt, parent) {
        if (parent.syncXY) {
            performSync(parent);
        } // if
    } // handleParentChange

    /* exports */

    /* initialise self */

    var self = COG.extend(new ViewLayer(params), {
        /**
        ### add(poly)
        Used to add a T5.Poly to the layer
        */
        add: function(shape) {
            children[children.length] = shape;
        },

        each: function(callback) {
            for (var ii = children.length; ii--; ) {
                callback(children[ii]);
            } // for
        },

        draw: function(context, viewRect, state, view, redraw) {
            var viewX = viewRect.x1,
                viewY = viewRect.y1,
                viewWidth = viewRect.width,
                viewHeight = viewRect.height;

            for (var ii = children.length; ii--; ) {
                var overrideStyle = children[ii].style,
                    previousStyle = overrideStyle ? Style.apply(context, overrideStyle) : null;

                children[ii].draw(context, viewX, viewY, viewWidth, viewHeight, state);

                if (previousStyle) {
                    Style.apply(context, previousStyle);
                } // if
            } // for
        }
    });

    self.bind('parentChange', handleResync);
    self.bind('resync', handleResync);

    return self;
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
/**
# T5.TileGenerator

## Events

### update
*/
var TileGenerator = function(params) {
    params = COG.extend({
        tileWidth: 256,
        tileHeight: 256,
        relative: false,
        padding: 2
    }, params);

    var lastRect = null,
        requestXY = XY.init(),
        tileLoader = null,
        padding = params.padding,
        requestedTileCreator = false,
        tileWidth = params.tileWidth,
        halfTileWidth = tileWidth >> 1,
        tileHeight = params.tileHeight,
        halfTileHeight = tileHeight >> 1,
        tileCreator = null,
        xTiles = 0,
        yTiles = 0,
        imageQueue = [];

    /* internal functions */

    function makeTileCreator(tileWidth, tileHeight, creatorArgs, callback) {

        function innerInit() {
            if (self.initTileCreator) {
                requestedTileCreator = true;

                self.initTileCreator(tileWidth, tileHeight, creatorArgs, callback);
            } // if
        } // if

        if (self.prepTileCreator) {
            self.prepTileCreator(tileWidth, tileHeight, creatorArgs, innerInit);
        }
        else {
            innerInit();
        } // if..else
    } // makeTileCreator

    function runTileCreator(viewRect, callback) {
        var relX = ~~((viewRect.x1 - requestXY.x) / tileWidth),
            relY = ~~((viewRect.y1 - requestXY.y) / tileHeight),
            endX = viewRect.width,
            endY = viewRect.height,
            tiles = [];

        for (var xx = -padding; xx < xTiles; xx++) {
            for (var yy = -padding; yy < yTiles; yy++) {
                var tile = tileCreator(relX + xx, relY + yy);

                if (tile) {
                    tiles[tiles.length] = tile;
                } // if
            } // for
        } // for

        if (callback) {
            callback(tiles);
        } // if

        lastRect = XYRect.copy(viewRect);
    } // runTileCreator

    /* event handlers */

    /* exports */

    /**
    ### requireRefresh(viewRect, view)
    This function is used to determine whether or not a new tile creator is required
    */
    function requireRefresh(viewRect, view) {
        return false;
    } // requireRefresh

    /**
    ### reset()
    */
    function reset() {
        tileCreator = null;
        requestedTileCreator = false;
        lastRect = null;
    } // resetTileCreator

    /**
    ### run(viewRect, view, callback)
    */
    function run(viewRect, view, callback) {
        var recalc = (! lastRect) ||
                (Math.abs(viewRect.x1 - lastRect.x1) > tileWidth) ||
                (Math.abs(viewRect.y1 - lastRect.y1) > tileHeight),
            requireRefresh = recalc ? self.requireRefresh(viewRect, view) : false;

        if (recalc) {
            if (((! tileCreator) && (! requestedTileCreator)) || requireRefresh) {
                requestXY = params.relative ? XY.init(viewRect.x1, viewRect.y1) : XY.init();
                xTiles = Math.ceil(viewRect.width / tileWidth) + padding;
                yTiles = Math.ceil(viewRect.height / tileHeight) + padding;

                makeTileCreator(
                    tileWidth,
                    tileHeight,
                    self.getTileCreatorArgs ? self.getTileCreatorArgs(view) : {},
                    function(creator) {
                        tileCreator = creator;
                        requestedTileCreator = false;

                        runTileCreator(viewRect, callback);
                    });
            } // if

            if (tileCreator) {
                runTileCreator(viewRect, callback);
            } // if
        } //  if
    } // run

    var self = {
        getTileCreatorArgs: null,
        initTileCreator: null,
        prepTileCreator: null,
        requireRefresh: requireRefresh,
        reset: reset,
        run: run
    };

    COG.observable(self);

    self.bind('update', function(evt) {
        COG.info('captured generator update');
        lastRect = null;
    });

    return self;
};

    var exports = {
        ex: COG.extend,
        ticks: ticks,
        getConfig: getConfig,
        userMessage: userMessage,

        zoomable: zoomable,

        XY: XY,
        XYRect: XYRect,
        Dimensions: Dimensions,
        Vector: Vector,

        D: Dimensions,

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

        Marker: Marker,
        ImageMarker: ImageMarker,
        MarkerLayer: MarkerLayer,

        PathLayer: PathLayer,
        AnimatedPathLayer: AnimatedPathLayer,

        Shape: Shape,
        Arc: Arc,
        Poly: Poly,
        ShapeLayer: ShapeLayer,

        Tiling: Tiling,
        TileGenerator: TileGenerator
    };

    COG.observable(exports);

/**
# T5.Geo
The Geo module contains classes and functionality to support geospatial
operations and calculations that are required when drawing maps, routes, etc.

## Functions
*/
var Geo = exports.Geo = (function() {
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
### getEngine(requiredCapability)
Returns the engine that provides the required functionality.  If preferred engines are supplied
as additional arguments, then those are looked for first
*/
function getEngine(requiredCapability) {
    var fnresult = null;

    for (var ii = 1; (! fnresult) && (ii < arguments.length); ii++) {
        fnresult = findEngine(requiredCapability, arguments[ii]);
    } // for

    fnresult = fnresult ? fnresult : findEngine(requiredCapability);

    if (! fnresult) {
        throw new Error("Unable to find GEO engine with " + requiredCapability + " capability");
    }

    return fnresult;
} // getEngine

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


/**
### rankGeocodeResponses(requestAddress, responseAddress, engine)
To be completed
*/
function rankGeocodeResponses(requestAddress, responseAddresses, engine) {
    var matches = [],
        compareFns = module.AddressCompareFns;

    if (engine && engine.compareFns) {
        compareFns = COG.extend({}, compareFns, engine.compareFns);
    } // if

    for (var ii = 0; ii < responseAddresses.length; ii++) {
        matches.push(new module.GeoSearchResult({
            caption: addrTools.toString(responseAddresses[ii]),
            data: responseAddresses[ii],
            pos: responseAddresses[ii].pos,
            matchWeight: plainTextAddressMatch(requestAddress, responseAddresses[ii], compareFns, module.GeocodeFieldWeights)
        }));
    } // for

    matches.sort(function(itemA, itemB) {
        return itemB.matchWeight - itemA.matchWeight;
    });

    return matches;
} // rankGeocodeResponses

/* internal functions */

function findEngine(capability, preference) {
    var matchingEngine = null;

    for (var engineId in engines) {
        if (preference) {
            if ((engineId == preference) && engines[engineId][capability]) {
                matchingEngine = engines[engineId];
                break;
            } // if
        }
        else if (engines[engineId][capability]) {
            matchingEngine = engines[engineId];
            break;
        } // if..else
    } // for

    return matchingEngine;
} // findEngine

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
        return {
            lat: parseFloat(initLat ? initLat : 0),
            lon: parseFloat(initLon ? initLon : 0)
        };
    } // init

    /**
    ### offset(pos, latOffset, lonOffset)
    Return a new T5.Geo.Position which is the original `pos` offset by
    the specified `latOffset` and `lonOffset` (which are specified in
    km distance)
    */
    function offset(pos, latOffset, lonOffset) {
        var radOffsetLat = latOffset / KM_PER_RAD,
            radOffsetLon = lonOffset / KM_PER_RAD,
            radLat = pos.lat * DEGREES_TO_RADIANS,
            radLon = pos.lon * DEGREES_TO_RADIANS,
            newLat = radLat + radOffsetLat,
            deltaLon = asin(sin(radOffsetLon) / cos(radLat)),
            newLon = radLon + deltaLon;

        newLat = ((newLat + HALF_PI) % Math.PI) - HALF_PI;
        newLon = newLon % TWO_PI;

        return init(newLat * RADIANS_TO_DEGREES, newLon * RADIANS_TO_DEGREES);
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
        if (! pos) {
            return init();
        }
        else if (typeof(pos.lat) !== 'undefined') {
            return copy(pos);
        }
        else if (pos.split) {
            var sepChars = [' ', ','];
            for (var ii = 0; ii < sepChars.length; ii++) {
                var coords = pos.split(sepChars[ii]);
                if (coords.length === 2) {
                    return init(coords[0], coords[1]);
                } // if
            } // for
        } // if..else

        return null;
    } // parse

    /**
    ### parseArray(sourceData)
    Just like parse, but with lots of em'
    */
    function parseArray(sourceData) {
        var sourceLen = sourceData.length,
            positions = new Array(sourceLen);

        for (var ii = sourceLen; ii--; ) {
            positions[ii] = parse(sourceData[ii]);
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
        return pos ? pos.lat + " " + pos.lon : "";
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
    ~ var worker = T5.Geo.Position.vectorize(positions);
    ~
    ~ // bind to the complete event for the worker
    ~ worker.bind('complete', function(vectors) {
    ~     // DO SOMETHING WITH YOUR VECTORS HERE
    ~ });

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
            async: true
        }, options);

        if (! options.async) {
            for (var ii = posIndex; ii--; ) {
                vectors[ii] = T5.GeoXY.init(positions[ii]);
            } // for

            return vectors;
        } // if

        return COG.Loopage.join({
            frequency: 10,
            execute: function(tickCount, worker) {
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
                    worker.trigger('complete', vectors);
                } // if
            }
        });
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
than with the actual object itself to ensure that the object remains lightweight.

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
        var size = T5.XY.init(0, max.lat - min.lat);
        if (typeof normalize === 'undefined') {
            normalize = true;
        } // if

        if (normalize && (min.lon > max.lon)) {
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
            Position.init(minLat * RADIANS_TO_DEGREES, minLon * RADIANS_TO_DEGREES),
            Position.init(maxLat * RADIANS_TO_DEGREES, maxLon * RADIANS_TO_DEGREES));
    } // createBoundsFromCenter

    /**
    ### expand(bounds, amount)
    A simple function that is used to expand a Geo.BoundingBox
    by the specified amount (in degrees).
    */
    function expand(bounds, amount) {
        return BoundingBox.init(
            Position.init(bounds.min.lat - amount, bounds.min.lon - amount % 360),
            Position.init(bounds.max.lat + amount, bounds.max.lon + amount % 360));
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

        return Position.init(bounds.min.lat + (size.y >> 1), bounds.min.lon + (size.x >> 1));
    } // getCenter


    /**
    ### getGeohash(bounds)
    To be completed
    */
    function getGeoHash(bounds) {
        var minHash = T5.Geo.GeoHash.encode(bounds.min.lat, bounds.min.lon),
            maxHash = T5.Geo.GeoHash.encode(bounds.max.lat, bounds.max.lon);

        COG.info("min hash = " + minHash + ", max hash = " + maxHash);
    } // getGeoHash

    /**
    ### getZoomLevel(bounds, displaySize)

    This function is used to return the zoom level (seems consistent across
    mapping providers at this stage) that is required to properly display
    the specified T5.Geo.BoundingBox given the screen dimensions (specified as
    a Dimensions object) of the map display. Adapted from
    [this code](http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/43958790eafe037f/66e889029c555bee)
    */
    function getZoomLevel(bounds, displaySize) {
        var boundsCenter = getCenter(bounds),
            maxZoom = 1000,
            variabilityIndex = min(round(abs(boundsCenter.lat) * 0.05), LAT_VARIABILITIES.length),
            variability = LAT_VARIABILITIES[variabilityIndex],
            delta = calcSize(bounds.min, bounds.max),
            bestZoomH = ceil(log(LAT_VARIABILITIES[3] * displaySize.height / delta.y) / log(2)),
            bestZoomW = ceil(log(variability * displaySize.width / delta.x) / log(2));


        return min(isNaN(bestZoomH) ? maxZoom : bestZoomH, isNaN(bestZoomW) ? maxZoom : bestZoomW);
    } // getZoomLevel

    function init(initMin, initMax) {
        return {
            min: Position.parse(initMin),
            max: Position.parse(initMax)
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
        getGeoHash: getGeoHash,
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
        var xy = XY.init();

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

                minX = (typeof minX === 'undefined') || xy.x < minX ? xy.x : minX;
                minY = (typeof minY === 'undefined') || xy.y < minY ? xy.y : minY;

                maxX = (typeof maxX === 'undefined') || xy.x > maxX ? xy.x : maxX;
                maxY = (typeof maxY === 'undefined') || xy.y > maxY ? xy.y : maxY;
            } // for

            return XYRect.init(minX, minY, maxY, maxY);
        }
        else if (xy.mercXY) {
            var mercXY = xy.mercXY;

            xy.x = (mercXY.x + Math.PI) / rpp | 0;
            xy.y = (Math.PI - mercXY.y) / rpp | 0;

            xy.rpp = rpp;
        }
        else {
            COG.warn('Attempted to sync an XY composite, not a GeoXY');
        } // if..else

        return xy;
    } // setRadsPerPixel

    function toPos(xy, rpp) {
        rpp = rpp ? rpp : self.rpp;

        return Position.fromMercatorPixels(xy.x * rpp - Math.PI, Math.PI - xy.y * rpp);
    } // toPos

    function updatePos(xy, pos, rpp) {
        xy.pos = pos;
        xy.mercXY = Position.toMercatorPixels(pos);

        rpp = typeof rpp !== 'undefined' ? rpp : xy.rpp;

        if (rpp) {
            sync(xy, rpp);
        } // if
    } // updatePos

    /* create the module */

    return {
        init: init,
        sync: sync,
        toPos: toPos,
        updatePos: updatePos
    };
})();

var engines = {};

/**
# T5.Geo.Engine
*/
var GeoEngine = function(params) {
    if (! params.id) {
        throw new Error("A GEO.Engine cannot be registered without providing an id.");
    } // if

    var self = COG.extend({
        remove: function() {
            delete engines[self.id];
        }
    }, params);

    engines[self.id] = self;
    return self;
};

/**
# T5.Geo.Search
_module_


Define functions for geo search operations

## Functions
*/
var Search = (function() {
    var DEFAULT_MAXDIFF = 20;

    var module = {
        bestResults: function(searchResults, maxDifference) {
            if (! maxDifference) {
                maxDifference = DEFAULT_MAXDIFF;
            }

            var bestMatch = searchResults.length > 0 ? searchResults[0] : null,
                fnresult = [];

            for (var ii = 0; ii < searchResults.length; ii++) {
                if (bestMatch && searchResults[ii] &&
                    (bestMatch.matchWeight - searchResults[ii].matchWeight <= maxDifference)) {

                    fnresult.push(searchResults[ii]);
                }
                else {
                    break;
                } // if..else
            } // for

            return fnresult;
        }
    };

    return module;
})();
/**
# T5.Geo.GeoSearchResult

TODO
*/
var GeoSearchResult = function(params) {
    params = COG.extend({
        id: null,
        caption: "",
        resultType: "",
        data: null,
        pos: null,
        matchWeight: 0
    }, params);

    return COG.extend(params, {
        toString: function() {
            return params.caption + (params.matchWeight ? " (" + params.matchWeight + ")" : "");
        }
    });
};
var LocationSearch = function(params) {
    params = COG.extend({
        name: "Geolocation Search",
        requiredAccuracy: null,
        searchTimeout: 5000,
        watch: false
    }, params);

    var geoWatchId = 0,
        locationTimeout = 0,
        lastPosition = null;

    /* tracking functions */

    function parsePosition(position) {
        var currentPos = Position.init(
                position.coords.latitude,
                position.coords.longitude);

        return new GeoSearchResult({
            id: 1,
            caption: 'Current Location',
            pos: currentPos,
            accuracy: position.coords.accuracy / 1000,
            matchWeight: 100
        });
    } // trackingUpdate

    function sendPosition(searchResult, callback) {
        navigator.geolocation.clearWatch(geoWatchId);
        geoWatchId = 0;

        if (locationTimeout) {
            clearTimeout(locationTimeout);
            locationTimeout = 0;
        } // if

        if (callback) {
            callback([searchResult], params);
        } // if
    } // sendPosition

    function trackingError(error) {
        COG.info('caught location tracking error:', error);
    } // trackingError

    var self = new T5.Geo.GeoSearchAgent(COG.extend({
        execute: function(searchParams, callback) {
            if (navigator.geolocation && (! geoWatchId)) {
                geoWatchId = navigator.geolocation.watchPosition(
                    function(position) {
                        var newPosition = parsePosition(position);

                        if ((! lastPosition) || (newPosition.accuracy < lastPosition.accuracy)) {
                            lastPosition = newPosition;
                        } // if

                        if ((! params.requiredAccuracy) ||
                            (lastPosition.accuracy < params.requiredAccuracy)) {
                            sendPosition(lastPosition, callback);
                        } // if
                    },
                    trackingError, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 5000
                    });

                if (params.searchTimeout) {
                    locationTimeout = setTimeout(function() {
                        if (lastPosition) {
                            sendPosition(lastPosition, callback);
                        } // if
                    }, params.searchTimeout);
                } // if
            } // if
        }
    }, params));

    return self;
};

/**
# T5.Geo.Routing
_module_


Define functionality to enable routing for mapping

## Module Functions
*/
var Routing = (function() {

    var TurnType = {
        Unknown: "turn-unknown",

        Start: "turn-none-start",
        Continue: "turn-none",
        Arrive: "turn-none-arrive",

        TurnLeft: "turn-left",
        TurnLeftSlight: "turn-left-slight",
        TurnLeftSharp: "turn-left-sharp",

        TurnRight: "turn-right",
        TurnRightSlight: "turn-right-slight",
        TurnRightSharp: "turn-right-sharp",

        Merge: "merge",

        UTurnLeft:  "uturn-left",
        UTurnRight: "uturn-right",

        EnterRoundabout: "roundabout-enter",

        Ramp: "ramp",
        RampExit: "ramp-exit"
    };

var TurnTypeRules = (function() {
    var rules = [];

    rules.push({
        regex: /continue/i,
        turnType: TurnType.Continue
    });

    rules.push({
        regex: /(take|bear|turn)(.*?)left/i,
        customCheck: function(text, matches) {
            var isSlight = (/bear/i).test(matches[1]);

            return isSlight ? TurnType.TurnLeftSlight : TurnType.TurnLeft;
        }
    });

    rules.push({
        regex: /(take|bear|turn)(.*?)right/i,
        customCheck: function(text, matches) {
            var isSlight = (/bear/i).test(matches[1]);

            return isSlight ? TurnType.TurnRightSlight : TurnType.TurnRight;
        }
    });

    rules.push({
        regex: /enter\s(roundabout|rotaty)/i,
        turnType: TurnType.EnterRoundabout
    });

    rules.push({
        regex: /take.*?ramp/i,
        turnType: TurnType.Ramp
    });

    rules.push({
        regex: /take.*?exit/i,
        turnType: TurnType.RampExit
    });

    rules.push({
        regex: /make(.*?)u\-turn/i,
        customCheck: function(text, matches) {
            return (/right/i).test(matches[1]) ? TurnType.UTurnRight : TurnType.UTurnLeft;
        }
    });

    rules.push({
        regex: /proceed/i,
        turnType: TurnType.Start
    });

    rules.push({
        regex: /arrive/i,
        turnType: TurnType.Arrive
    });

    rules.push({
        regex: /fell\sthrough/i,
        turnType: TurnType.Merge
    });

    return rules;
})();


    /* internal functions */

    /*
    This function is used to cleanup a turn instruction that has been passed
    back from a routing engine.  At present it has been optimized to work with
    decarta instructions but will be modified to work with others in time
    */
    function markupInstruction(text) {
        text = text.replace(/(\w)(\/)(\w)/g, '$1 $2 $3');

        return text;
    } // markupInstruction

    /* exports */

    /**
    ### calculate(args)
    To be completed
    */
    function calculate(args) {
        args = COG.extend({
            engineId: "",
            waypoints: [],
            map: null,
            error: null,
            autoFit: true,
            success: null,
            generalize: false
        }, args);

        var engine = getEngine("route");
        if (engine) {
            engine.route(args, function(routeData) {
                if (args.generalize) {
                    routeData.geometry = Position.generalize(routeData.geometry, routeData.getInstructionPositions());
                } // if

                if (args.map) {
                    createMapOverlay(args.map, routeData);

                    if (args.autoFit) {
                        args.map.gotoBounds(routeData.boundingBox);
                    } // if
                } // if

                if (args.success) {
                    args.success(routeData);
                } // if
            });
        } // if
    } // calculate

    /**
    ### createMapOverlay(map, routeData)
    To be completed
    */
    function createMapOverlay(map, routeData) {
        var dimensions = map.getDimensions();


        var overlay = new RouteOverlay({
            data: routeData,
            width: dimensions.width,
            height: dimensions.height
        });

        map.setLayer("route", overlay);
    } // createMapOverlay

    /**
    ### parseTurnType(text)
    To be completed
    */
    function parseTurnType(text) {
        var turnType = TurnType.Unknown,
            rules = TurnTypeRules;

        for (var ii = 0; ii < rules.length; ii++) {
            rules[ii].regex.lastIndex = -1;

            var matches = rules[ii].regex.exec(text);
            if (matches) {
                if (rules[ii].customCheck) {
                    turnType = rules[ii].customCheck(text, matches);
                }
                else {
                    turnType = rules[ii].turnType;
                } // if..else

                break;
            } // if
        } // for

        return turnType;
    } // parseTurnType

    var module = {
        /* module functions */

        calculate: calculate,
        createMapOverlay: createMapOverlay,
        parseTurnType: parseTurnType,

        /**
        # T5.Geo.Routing.TurnType

        */
        TurnType: TurnType,

        /**
        # T5.Geo.Routing.Instruction

        */
        Instruction: function(params) {
            params = COG.extend({
                position: null,
                description: "",
                distance: 0,
                distanceTotal: 0,
                time: 0,
                timeTotal: 0,
                turnType: null
            }, params);

            params.description = markupInstruction(params.description);

            if (! params.turnType) {
                params.turnType = parseTurnType(params.description);
            } // if

            return params;
        },


        /**
        # T5.Geo.Routing.RouteData

        */
        RouteData: function(params) {
            params = COG.extend({
                geometry: [],
                instructions: [],
                boundingBox: null
            }, params);

            if (! params.boundingBox) {
                params.boundingBox = BoundingBox.forPositions(params.geometry);
            } // if

            var self = COG.extend({
                getInstructionPositions: function() {
                    var positions = [];

                    for (var ii = 0; ii < params.instructions.length; ii++) {
                        if (params.instructions[ii].position) {
                            positions.push(params.instructions[ii].position);
                        } // if
                    } // for

                    return positions;
                }
            }, params);

            return self;
        }
    };

    return module;
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
        layerClass: MarkerLayer
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

function createLine(layer, coordinates, options, builders) {
    var vectors = readVectors(coordinates);

    layer.add(builders.line(vectors, options));
    return vectors.length;
} // createLine

function createPoly(layer, coordinates, options, builders) {
    var vectors = readVectors(coordinates);
    layer.add(builders.poly(vectors, options));

    return vectors.length;
} // createPoly

function readVectors(coordinates) {
    var count = coordinates ? coordinates.length : 0,
        positions = new Array(count);

    for (var ii = count; ii--; ) {
        positions[ii] = Geo.Position.init(coordinates[ii][1], coordinates[ii][0]);
    } // for

    return Geo.Position.vectorize(positions, VECTORIZE_OPTIONS);
} // getLineStringVectors

/* feature processor functions */

function processLineString(layer, featureData, options, builders) {
    var vectors = readVectors(featureData && featureData.coordinates ? featureData.coordinates : []);

    return createLine(layer, vectors, options, builders);
} // processLineString

function processMultiLineString(layer, featureData, options, builders) {
    var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
        pointsProcessed = 0;

    for (var ii = coordinates.length; ii--; ) {
        pointsProcessed += createLine(layer, coordinates[ii], options, builders);
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
        return createPoly(layer, coordinates[0], options, builders);
    } // if

    return 0;
} // processPolygon

function processMultiPolygon(layer, featureData, options, builders) {
    var coordinates = featureData && featureData.coordinates ? featureData.coordinates : [],
        pointsProcessed = 0;

    for (var ii = 0; ii < coordinates.length; ii++) {
        pointsProcessed += createPoly(layer, coordinates[ii][0], options, builders);
    } // for

    return pointsProcessed;
} // processMultiPolygon

/* define the GeoJSON parser */

var GeoJSONParser = function(data, callback, options, builders) {
    options = COG.extend({
        vectorsPerCycle: Geo.VECTORIZE_PER_CYCLE,
        rowPreParse: null,
        simplify: false,
        layerPrefix: 'geojson-'
    }, options);

    builders = COG.extend({
        marker: function(xy, options) {
            return new Marker({
                xy: xy
            });
        },

        line: function(vectors, options) {
            return new Poly(vectors, options);
        },

        poly: function(vectors, options) {
            return new Poly(vectors, COG.extend({
                fill: true
            }, options));
        }
    }, builders);

    var vectorsPerCycle = options.vectorsPerCycle,
        rowPreParse = options.rowPreParse,
        layerPrefix = options.layerPrefix,
        featureIndex = 0,
        totalFeatures = 0,
        childParser = null,
        childCount = 0,
        layers = {},
        worker;

    if (! data) {
        return null;
    } // if

    if (typeof data.length === 'undefined') {
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

        globalLayers = layers;
        return layer;
    } // getLayer

    function handleParseComplete(evt) {
        if (callback) {
            callback(layers);
        } // if
    } // handleParseComplete

    function processData(tickCount, worker) {
        var cycleCount = 0,
            ii = featureIndex;

        if (childParser) {
            return;
        }

        for (; ii < totalFeatures; ii++) {
            var featureInfo = extractFeatureInfo(rowPreParse ? rowPreParse(data[ii]) : data[ii]),
                processedCount = null;

            if (featureInfo.isCollection) {
                childCount += 1;

                childParser = parse(
                    featureInfo.data.features,
                    function(childLayers) {
                        childParser = null;

                        for (var layerId in childLayers) {
                            layers[layerId] = childLayers[layerId];
                        } // for
                    }, {
                        layerPrefix: layerPrefix + childCount + '-'
                    });

                processedCount += 1;
            }
            else if (featureInfo.definition) {
                processedCount = addFeature(featureInfo.definition, featureInfo);
            } // if..else

            cycleCount += processedCount ? processedCount : 1;

            if (cycleCount >= vectorsPerCycle) {
                break;
            } // if
        } // for

        featureIndex = ii + 1;

        if ((! childParser) && (featureIndex >= totalFeatures)) {
            worker.trigger('complete');
        } // if
    } // processData

    /* run the parser */

    totalFeatures = data.length;

    worker = COG.Loopage.join({
        frequency: 10,
        execute: processData
    });

    worker.bind('complete', handleParseComplete);

    return worker;
};

/* exports */

function parse(data, callback, options) {
    return new GeoJSONParser(data, callback, options);
} // parse

var GeoJSON = exports.GeoJSON = (function() {
    return {
        parse: parse
    };
})();

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
    container: 'mapCanvas'
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

## Methods
*/
var Map = exports.Map = function(params) {
    params = COG.extend({
        tapExtent: 10, // TODO: remove and use the inherited value
        crosshair: false,
        zoomLevel: 0,
        boundsChangeThreshold: 30
    }, params);

    var LOCATE_MODE = {
        NONE: 0,
        SINGLE: 1,
        WATCH: 2
    };

    var lastBoundsChangeOffset = XY.init(),
        locationWatchId = 0,
        locateMode = LOCATE_MODE.NONE,
        initialized = false,
        tappedPOIs = [],
        annotations = null, // annotations layer
        guideOffset = null,
        locationOverlay = null,
        geoWatchId = 0,
        initialTrackingUpdate = true,
        radsPerPixel = 0,
        tapExtent = params.tapExtent;

    /* internal functions */

    /* tracking functions */

    function trackingUpdate(position) {
        try {
            var currentPos = Geo.Position.init(
                        position.coords.latitude,
                        position.coords.longitude),
                accuracy = position.coords.accuracy / 1000;

            self.trigger('locationUpdate', position, accuracy);

            if (initialTrackingUpdate) {
                if (! locationOverlay) {
                    locationOverlay = new Geo.UI.LocationOverlay({
                        pos: currentPos,
                        accuracy: accuracy
                    });

                    locationOverlay.update(self.getTileLayer());
                    self.setLayer('location', locationOverlay);
                } // if

                var targetBounds = Geo.BoundingBox.createBoundsFromCenter(
                        currentPos,
                        Math.max(accuracy, 1));

                self.gotoBounds(targetBounds);
            }
            else {
                locationOverlay.pos = currentPos;
                locationOverlay.accuracy = accuracy;

                locationOverlay.update(self.getTileLayer());

                panToPosition(
                    currentPos,
                    null,
                    COG.easing('sine.out'));
            } // if..else

            initialTrackingUpdate = false;
        }
        catch (e) {
            COG.exception(e);
        }
    } // trackingUpdate

    function trackingError(error) {
        COG.info('caught location tracking error:', error);
    } // trackingError

    /* event handlers */

    function handleMarkerUpdate(evt, markers) {
        var grid = self.getTileLayer();

        for (var ii = markers.length; ii--; ) {
            syncXY([markers[ii].xy]);
        } // for
    } // handleMarkerUpdate

    function handlePan(evt, x, y) {
        if (locateMode === LOCATE_MODE.SINGLE) {
            self.trackCancel();
        } // if
    } // handlePan

    function handleTap(evt, absXY, relXY, offsetXY) {
        var radsPerPixel = Geo.radsPerPixel(self.getZoomLevel()),
            tapPos = GeoXY.toPos(offsetXY, radsPerPixel),
            minPos = GeoXY.toPos(
                XY.offset(offsetXY, -tapExtent, tapExtent),
                radsPerPixel),
            maxPos = GeoXY.toPos(
                XY.offset(offsetXY, tapExtent, -tapExtent),
                radsPerPixel);

        self.trigger(
            'geotap',
            absXY,
            relXY,
            tapPos,
            BoundingBox.init(minPos, maxPos)
        );


        /*
        var grid = self.getTileLayer();
        var tapBounds = null;

        if (grid) {
            TODO: get the tap working again...
            var gridPos = self.viewPixToGridPix(
                    XY.init(relXY.x, relXY.y)),
                tapPos = grid.pixelsToPos(gridPos),
                minPos = grid.pixelsToPos(
                    XY.offset(
                        gridPos,
                        -params.tapExtent,
                        params.tapExtent)),
                maxPos = grid.pixelsToPos(
                    XY.offset(
                        gridPos,
                         params.tapExtent,
                         -params.tapExtent));

            tapBounds = BoundingBox.init(minPos, maxPos);


            self.trigger('geotap', absXY, relXY, tapPos, tapBounds);
        } // if
        */
    } // handleTap

    function handleRefresh(evt) {
        var changeDelta = XY.absSize(XY.diff(lastBoundsChangeOffset, self.getOffset()));
        if (changeDelta > params.boundsChangeThreshold) {
            lastBoundsChangeOffset = XY.copy(self.getOffset());
            self.trigger("boundsChange", self.getBoundingBox());
        } // if
    } // handleWork

    function handleProviderUpdate(name, value) {
        self.cleanup();
        initialized = false;
    } // handleProviderUpdate

    function handleZoomLevelChange(evt, zoomLevel, zoomXY) {
        var gridSize;

        radsPerPixel = Geo.radsPerPixel(zoomLevel);

        gridSize = TWO_PI / radsPerPixel | 0;
        self.setMaxOffset(gridSize, gridSize, true, false);

        Images.cancelLoad();

        self.resetScale();
        self.triggerAll('resync', self);
    } // handleZoomLevel

    /* internal functions */

    function getLayerScaling(oldZoom, newZoom) {
        return Geo.radsPerPixel(oldZoom) /
                    Geo.radsPerPixel(newZoom);
    } // getLayerScaling

    /* public methods */

    /**
    ### getBoundingBox()

    Return a T5.Geo.BoundingBox for the current map view area
    */
    function getBoundingBox() {
        var rect = self.getViewRect();

        return Geo.BoundingBox.init(
            GeoXY.toPos(XY.init(rect.x1, rect.y2), radsPerPixel),
            GeoXY.toPos(XY.init(rect.x2, rect.y1), radsPerPixel));
    } // getBoundingBox

    /**
    ### getCenterPosition()`
    Return a T5.GeoXY composite for the center position of the map
    */
    function getCenterPosition() {
        var rect = self.getViewRect();
        if (rect) {
            var xy = XY.init(rect.x1 + (rect.width >> 1), rect.y1 + (rect.height >> 1));
            return GeoXY.toPos(xy, radsPerPixel);
        } // if

        return null;
    } // getCenterPosition

    /**
    ### gotoBounds(bounds, callback)
    Calculates the optimal display bounds for the specified T5.Geo.BoundingBox and
    then goes to the center position and zoom level best suited.
    */
    function gotoBounds(bounds, callback) {
        var zoomLevel = Geo.BoundingBox.getZoomLevel(
                            bounds,
                            self.getDimensions());

        gotoPosition(
            Geo.BoundingBox.getCenter(bounds),
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
        self.setZoomLevel(newZoomLevel);

        COG.endTweens();

        panToPosition(position, callback);
    } // gotoPosition

    /**
    ### panToPosition(position, callback, easingFn)
    This method is used to tell the map to pan (not zoom) to the specified
    T5.GeoXY.  An optional callback can be passed as the second
    parameter to the function and this fires a notification once the map is
    at the new specified position.  Additionally, an optional easingFn parameter
    can be supplied if the pan operation should ease to the specified location
    rather than just shift immediately.  An easingDuration can also be supplied.
    */
    function panToPosition(position, callback, easingFn, easingDuration) {
        var centerXY = GeoXY.init(position, Geo.radsPerPixel(self.getZoomLevel())),
            dimensions = self.getDimensions();

        self.updateOffset(
            centerXY.x - (dimensions.width >> 1),
            centerXY.y - (dimensions.height >> 1),
            easingFn,
            easingDuration,
            callback);

        self.trigger('wake');

        self.trigger("boundsChange", self.getBoundingBox());

        if (callback && (typeof easingFn === 'undefined')) {
            callback(self);
        } // if
    } // panToPosition

    /**
    ### syncXY(points)
    This function iterates through the specified vectors and if they are
    of type GeoXY composite they are provided the rads per pixel of the
    grid so they can perform their calculations
    */
    function syncXY(points) {
        return GeoXY.sync(points, radsPerPixel);
    } // syncXY

    /* public object definition */

    params.adjustScaleFactor = function(scaleFactor) {
        var roundFn = scaleFactor < 1 ? Math.floor : Math.ceil;
        return Math.pow(2, roundFn(Math.log(scaleFactor)));
    };

    var self = COG.extend(new View(params), {

        getBoundingBox: getBoundingBox,
        getCenterPosition: getCenterPosition,

        gotoBounds: gotoBounds,
        gotoPosition: gotoPosition,
        panToPosition: panToPosition,

        syncXY: syncXY,

        /**
        - `locate()`

        TODO
        */
        locate: function() {
            self.trackStart(LOCATE_MODE.SINGLE);

            setTimeout(self.trackCancel, 10000);
        },

        /**
        - `trackStart(mode)`

        TODO
        */
        trackStart: function(mode) {
            if (navigator.geolocation && (! geoWatchId)) {
                locateMode = mode ? mode : LOCATE_MODE.WATCH;

                initialTrackingUpdate = true;
                geoWatchId = navigator.geolocation.watchPosition(
                    trackingUpdate,
                    trackingError, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 5000
                    });
            } // if
        },

        /**
        - `trackCancel()`

        TODO
        */
        trackCancel: function() {
            if (geoWatchId && navigator.geolocation) {
                navigator.geolocation.clearWatch(geoWatchId);
            } // if

            self.removeLayer('location');
            locationOverlay = null;

            locateMode = LOCATE_MODE.NONE;

            geoWatchId = 0;
        },

        /**
        - `animateRoute(easing, duration, callback, center)`

        TODO
        */
        animateRoute: function(easing, duration, callback, center) {
            var routeLayer = self.getLayer('route');
            if (routeLayer) {
                var animationLayer = routeLayer.getAnimation(
                                        easing,
                                        duration,
                                        callback,
                                        center);

                if (animationLayer) {
                    animationLayer.addToView(self);
                }
            } // if
        }
    });

    self.bind('pan', handlePan);
    self.bind('tap', handleTap);


    self.bind('refresh', handleRefresh);

    zoomable(self, params);
    self.bind('zoomLevelChange', handleZoomLevelChange);

    return self;
}; // T5.Map
/**
# T5.MapTileGenerator
*/
var MapTileGenerator = exports.MapTileGenerator = function(params) {
    params = COG.extend({
        relative: true
    }, params);

    var zoomLevel = 0,
        initPos = null;

    /* internal functions */

    /* exports */

    function getTileCreatorArgs(view) {
        initPos = view.getCenterPosition();
        zoomLevel = view.getZoomLevel();

        return {
            zoomLevel: zoomLevel,
            position: initPos
        };
    } // getTileCreatorArgs

    function requireRefresh(viewRect, view) {
        return (! initPos) || (zoomLevel !== view.getZoomLevel());
    } // requireRefresh

    /* define self */

    var self = COG.extend(new TileGenerator(params), {
        minLevel: 2,
        maxLevel: 20,

        getTileCreatorArgs: getTileCreatorArgs,
        requireRefresh: requireRefresh
    });

    return self;
};
/**
# T5.GeoPoly
_extends:_ T5.Poly


This is a special type of T5.Poly that will take positions for the first
argument of the constructor rather than vectors.  If the initialization
parameter `autoParse` is set to true (which it is by default), this will
parsed by the T5.Geo.Position.parse function and converted into a GeoXY.

## Constructor
`new T5.GeoPoly(positions, params);`

### Initialization Parameters
- autoParse (boolean, default = true) - whether or not the values in the
positions array that is the first constructor argument should be run through
the T5.Geo.Position.parse function or not.  Note that this function is capable of
handling both string and T5.Geo.Position values as position values are
simply passed straight through.

*/
var GeoPoly = exports.GeoPoly = function(positions, params) {
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
/**
# T5.Geo.UI.RouteOverlay
_extends:_ T5.PathLayer


The RouteOverlay class is used to render the route geometry to the map.

## Constructor
`new T5.Geo.UI.RouteOverlay(params)`

### Initialization Parameters
To be completed
*/
var RouteOverlay = exports.RouteOverlay = function(params) {
    params = COG.extend({
        data: null,
        pixelGeneralization: 8,
        partialDraw: false,
        strokeStyle: 'rgba(0, 51, 119, 0.9)',
        waypointFillStyle: '#FFFFFF',
        lineWidth: 4,
        zindex: 50
    }, params);

    var coordinates = [],
        instructionCoords = [];

    function vectorizeRoute() {
        if (params.data && params.data.instructions) {
            var instructions = params.data.instructions,
                positions = new Array(instructions.length);

            for (var ii = instructions.length; ii--; ) {
                positions[ii] = instructions[ii].position;
            } // for

            Position.vectorize(positions).bind(
                'complete',
                function(evt, coords) {
                    instructionCoords = coords;
                });
        } // if

        if (params.data && params.data.geometry) {
            Position.vectorize(params.data.geometry).bind(
                'complete',
                function(evt, coords) {
                    coordinates = coords;

                    self.updateCoordinates(coordinates, instructionCoords, true);
                });
        } // if
    } // vectorizeRoute

    var self = new T5.PathLayer(params);

    vectorizeRoute();
    return self;
};
var LOCATOR_IMAGE =
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA' +
'BHNCSVQICAgIfAhkiAAAAAlwSFlzAAACIQAAAiEBPhEQkwAAABl0RVh0U29mdHdhcmUAd3' +
'd3Lmlua3NjYXBlLm9yZ5vuPBoAAAG+SURBVCiRlZHNahNRAIW/O7mTTJPahLZBA1YUyriI' +
'NRAE3bQIKm40m8K8gLj0CRQkO32ELHUlKbgoIu4EqeJPgtCaoBuNtjXt5LeTMZk0mbmuWi' +
'uuPLsD3+HAOUIpxf9IHjWmaUbEyWv5ROrsVULhcHP761rUfnN3Y2Otc8CIg4YT85lzuVsP' +
'P+Qupw1vpPjRCvhS9ymvV0e77x7nNj+uvADQAIQQ+uLyvdfLV9JGZi7EdEwQlqBpEJ019f' +
'0z1mo2u5Q8DMydv25lshemmj1FueZTawbs7inarqLbV7Qjab1upB9YlhWSAHLavLHZCvg1' +
'VEhN0PMU9W7At4bPVidg7CtkLLXkut+lBPD6/Ub155jJiADAHSpaLmx3ApyBQoYEUd0PBo' +
'OBkAC6+3llvda/YxgGgYL+UNHf/zN3KiExGlsvTdP0NYDkhPdWrz35ZDsBzV5wCMuQwEyF' +
'mXFeeadjzfuFQmGkAZRKpdGC/n7x+M6jqvA9Zo6FWDhlcHE+wqT93J1tP7vpOE7rrx8ALM' +
'uasPf8S12St4WmJ6bYWTUC52k8Hm8Vi0X/nwBAPp/XKpWKdF1X2LYdlMvlsToC/QYTls7D' +
'LFr/PAAAAABJRU5ErkJggg%3D%3D';

/**
# T5.Geo.LocationOverlay

*/
var LocationOverlay = exports.LocationOverlay = function(params) {
    params = COG.extend({
        pos: null,
        accuracy: null,
        zindex: 90
    }, params);

    var iconImage = new Image(),
        iconOffset = T5.XY.init(),
        centerXY = T5.XY.init(),
        indicatorRadius = null;

    iconImage.src = LOCATOR_IMAGE;
    iconImage.onload = function() {
        iconOffset = T5.XY.init(
            iconImage.width >> 1,
            iconImage.height >> 1);
    };

    var self = COG.extend(new T5.ViewLayer(params), {
        pos: params.pos,
        accuracy: params.accuracy,
        drawAccuracyIndicator: false,

        draw: function(context, offset, dimensions, state, view) {
            var centerX = centerXY.x - offset.x,
                centerY = centerXY.y - offset.y;

            if (indicatorRadius) {
                context.fillStyle = 'rgba(30, 30, 30, 0.2)';

                context.beginPath();
                context.arc(
                    centerX,
                    centerY,
                    indicatorRadius,
                    0,
                    Math.PI * 2,
                    false);
                context.fill();
            } // if

            if (iconImage.complete && iconImage.width > 0) {
                context.drawImage(
                    iconImage,
                    centerX - iconOffset.x,
                    centerY - iconOffset.y,
                    iconImage.width,
                    iconImage.height);
            } // if

            self.changed();
        },

        update: function(grid) {
            if (grid) {
                indicatorRadius = grid.getPixelDistance(self.accuracy) >> 1;
                centerXY = grid.getGridXYForPosition(self.pos);

                self.changed();
            } // if
        }
    });

    self.bind('gridUpdate', function(evt, grid) {
        self.update(grid);
    });

    return self;
};

    return {
        distanceToString: distanceToString,
        dist2rad: dist2rad,
        getEngine: getEngine,

        lat2pix: lat2pix,
        lon2pix: lon2pix,
        pix2lat: pix2lat,
        pix2lon: pix2lon,

        radsPerPixel: radsPerPixel,

        Position: Position,
        BoundingBox: BoundingBox,
        Radius: Radius,

        Address: Address,
        A: addrTools,


        GeocodeFieldWeights: {
            streetDetails: 50,
            location: 50
        },

        AddressCompareFns: {
        },

        Engine: GeoEngine,

        Search: Search,
        GeoSearchResult: GeoSearchResult,
        LocationSearch: LocationSearch,

        Routing: Routing
    };
})();

    return exports;
})();
