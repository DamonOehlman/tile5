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

(function(exports) {
/*jslint white: true, safe: true, onevar: true, undef: true, nomen: true, eqeqeq: true, newcap: true, immed: true, strict: true */

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
        console[level || 'debug'](msg);
    } // if
} // _log
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

var _indexOf = Array.prototype.indexOf || function(target) {
    for (var ii = 0; ii < this.length; ii++) {
        if (this[ii] === target) {
            return ii;
        } // if
    } // for

    return -1;
};
var _is = (function() {
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

    return function(url, callback, callbackParam) {
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
                _log('checking ' + checkKey + ' capability. require: ' + check + ', capability = ' + capabilities[checkKey]);

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
            _log('creating observable');
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
        _log('captured double click');

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

    _log('initialized touch handler');

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

var Registry = (function() {
    /* internals */

    var types = {};

    /* exports */

    function create(type, name) {
        if (types[type][name]) {
            return types[type][name].apply(null, Array.prototype.slice.call(arguments, 2));
        } // if
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

/**
### userMessage(msgType, msgKey, msgHtml)
*/
function userMessage(msgType, msgKey, msgHtml) {
    T5.trigger('userMessage', msgType, msgKey, msgHtml);
} // userMessage

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
                matchStrength = compareFn ? compareFn(request, fieldVal) : (_wordExists(request, fieldVal) ? 1 : 0);

            matchWeight += (matchStrength * fieldWeights[fieldId]);
        } // if
    } // for

    return matchWeight;
} // plainTextAddressMatch

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

    EVT_REMOVELAYER = 'layerRemove';
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

    typeDrawable = 'drawable',
    typeLayer = 'layer',

    reg = Registry.register,
    regCreate = Registry.create,
    regGet = Registry.get,

    drawableCounter = 0,
    layerCounter = 0,

    reDelimitedSplit = /[\,\s]+/;
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
        useAnimFrame = (function() {
            for (var ii = 0; ii < TEST_PROPS.length; ii++) {
                window.animFrame = window.animFrame || window[TEST_PROPS[ii] + 'equestAnimationFrame'];
            } // for

            if (window.animFrame) {
                _log('Using request animation frame');
            } // if

            return animFrame;
        })();

    function frame(tickCount) {
        frameIndex++;

        tickCount = tickCount || new Date().getTime();

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

    function attach(callback, every) {
        callbacks[callbacks.length] = {
            cb: callback,
            every: every ? round(every / FRAME_RATE) : 1
        };
    } // attach

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
var DOM = (function() {
    /* internals */

    var CORE_STYLES = {
            '-webkit-user-select': 'none',
            position: 'absolute'
        },
        css3dTransformProps = ['WebkitPerspective', 'MozPerspective'],
        testTransformProps = ['-webkit-transform', 'MozTransform'],
        transformProp,
        css3dTransformProp;

    function checkCaps(testProps) {
        for (var ii = 0; ii < testProps.length; ii++) {
            var propName = testProps[ii];
            if (typeof document.body.style[propName] != 'undefined') {
                return propName;
            } // if
        } // for

        return undefined;
    } // checkCaps

    /* exports */

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

    function move(element, x, y, extraTransforms) {
        if (css3dTransformProp || transformProp) {
            var translate = css3dTransformProp ?
                    'translate3d(' + x +'px, ' + y + 'px, 0)' :
                    'translate(' + x + 'px, ' + y + 'px)';

            element.style[transformProp] = translate + ' ' + (extraTransforms || []).join(' ');
        }
        else {
            element.style.left = x + 'px';
            element.style.top = y + 'px';
        } // if..else
    } // move

    function styles(extraStyles) {
        return _extend({}, CORE_STYLES, extraStyles);
    } // extraStyles

    /* initialization */

    transformProp = checkCaps(testTransformProps);
    css3DTransformProp = checkCaps(css3dTransformProps);

    return {
        transforms: _is(transformProp, typeString),

        create: create,
        move: move,
        styles: styles
    };
})();
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
    ### process(items, sliceCallback, completeCallback)
    */
    function process(items, sliceCallback, completeCallback) {
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
                    _log('calculated that we can process ' + itemsPerCycle + ' items per cycle');
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

        if (processes.push(processSlice) === 1) {
            Animator.attach(runLoop);
        } // if
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

    return new Pos(newPhi * RADIANS_TO_DEGREES, (x % 360) * RADIANS_TO_DEGREES);
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
# T5.GeoXY

## Methods
*/
function GeoXY(p1, p2, mercX, mercY) {
    this.mercX = mercX;
    this.mercY = mercY;

    if (_is(p1, typeString)) {
        _extend(this, Parser.parseXY(p1));
    } // if
    else if (p1 && p1.toPixels) {
        _extend(this, p1.toPixels());
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
### simplify(xy*, generalization)
This function is used to simplify a xy array by removing what would be considered
'redundant' xy positions by elimitating at a similar position.
*/
function simplify(points, generalization) {
    if (! points) {
        return null;
    } // if

    generalization = generalization || VECTOR_SIMPLIFICATION;

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

reg('fn', 'simplify', simplify);
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
            new GeoXY(hitData.x, hitData.y)
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
        ### prepare(layers, tickCount, hitData)
        */
        prepare: function(layers, tickCount, hitData) {
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

            canvas = DOM.create('canvas', null, {
                position: 'absolute',
                'z-index': 1
            });

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

    function initDrawData(viewport, hitData, drawFn) {
        var isHit = false;

        if (hitData) {
            var hitX = pipTransformed ? hitData.x - drawOffsetX : hitData.relXY.x,
                hitY = pipTransformed ? hitData.y - drawOffsetY : hitData.relXY.y;

            isHit = context.isPointInPath(hitX, hitY);
        } // if

        return {
            draw: drawFn || defaultDrawFn,
            viewport: viewport,
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

        Style.bind('defined', handleStyleDefined);
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

    function drawTiles(viewport, tiles, okToLoad) {
        var tile,
            minX = drawOffsetX - 256,
            minY = drawOffsetY - 256,
            maxX = viewport.x2,
            maxY = viewport.y2;

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

    function prepare(layers, viewport, tickCount, hitData) {
        var ii,
            canClip = false,
            targetVP = viewport.scaled || viewport;

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
        } // if

        context.globalCompositeOperation = 'source-over';

        return context;
    } // prepare

    /**
    ### prepArc(drawable, viewport, hitData, opts)
    */
    function prepArc(drawable, viewport, hitData, opts) {
        context.beginPath();
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

        return initDrawData(viewport, hitData, drawOverride);
    } // prepMarker

    /**
    ### prepPoly(drawable, viewport, hitData, opts)
    */
    function prepPoly(drawable, viewport, hitData, opts) {
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

        return initDrawData(viewport, hitData);
    } // prepPoly

    /* initialization */

    createCanvas();

    var _this = _extend(baseRenderer, {
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
    });

    loadStyles();

    _this.bind('detach', handleDetach);

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
        imageDiv = DOM.create('div', '', DOM.styles({
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

    function handlePredraw(evt, viewport) {
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
    _this.bind('reset', handleReset);

    return _this;
});

/**
# T5.Style
*/
var Style = (function() {

    /* internals */

    var styles = {};

    function define(p1, p2) {
        if (_is(p1, typeString)) {
            _self.trigger('defined', p1, styles[p1] = p2);

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

    function get(id) {
        return styles[id];
    } // get

    var _self = _observable({
        get: get,
        define: define
    });

    define({
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

    return _self;
})();
/**
# VIEW: simple
*/
reg('view', 'view', function(params) {
    params = _extend({
        container: "",
        captureHover: true,
        controls: [],
        drawOnScale: true,
        fastpan: true,
        padding: 0,
        inertia: true,
        refreshDistance: 256,
        pannable: true,
        scalable: true,

        renderer: 'canvas'
    }, params);

    var PANSPEED_THRESHOLD_REFRESH = 2,
        PANSPEED_THRESHOLD_FASTPAN = 5,

        caps = {},
        controls = [],
        layers = [],
        layerCount = 0,
        viewpane = null,
        panContainer = null,
        outer,
        dragObject = null,
        mainContext = null,
        isIE = !_is(window.attachEvent, typeUndefined),
        hitFlagged = false,
        fastpan,
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
        offsetTween = null,
        padding = params.padding,
        panFrames = [],
        hitData = null,
        lastHitData = null,
        resizeCanvasTimeout = 0,
        rotation = 0,
        rotateTween = null,
        scaleFactor = 1,
        scaleTween = null,
        lastScaleFactor = 1,
        lastCycleTicks = 0,
        eventMonitor = null,
        frameData = {
            index: 0,
            draw: false
        },
        partialScaling = true,
        tweeningOffset = false, // TODO: find a better way to determine this than with a flag
        cycleDelay = 1000 / params.fps | 0,
        viewChanges = 0,
        width, height,
        halfWidth, halfHeight,
        halfOuterWidth, halfOuterHeight;

    /* event handlers */

    /* scaling functions */

    function handleZoom(evt, absXY, relXY, scaleChange, source) {
        scale(max(scaleFactor + pow(2, scaleChange) - 1, 0.125), false, true);
    } // handleWheelZoom

    function getProjectedXY(srcX, srcY) {
        var projectedXY = renderer && renderer.projectXY ? renderer.projectXY(srcX, srcY) : null;

        if (! projectedXY) {
            var viewport = _self.getViewport(),
                invScaleFactor = 1 / scaleFactor,
                scaledX = viewport ? (viewport.x + srcX * invScaleFactor) : srcX,
                scaledY = viewport ? (viewport.y + srcY * invScaleFactor) : srcY;

            projectedXY = new _self.XY(scaledX, scaledY);
        } // if

        return projectedXY.sync(_self, true);
    } // getProjectedXY

    function handleDoubleTap(evt, absXY, relXY) {
        triggerAll(
            'doubleTap',
            absXY,
            relXY,
            getProjectedXY(relXY.x, relXY.y));

        if (params.scalable) {
            scale(2, {
                easing: 'quad.out',
                duration: 300
            }, true);
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

    function handleRemoveLayer(evt, layer) {
        var layerIndex = _indexOf(layers, layer.id);
        if ((layerIndex >= 0) && (layerIndex < layerCount)) {
            layers.splice(layerIndex, 1);
            invalidate();
        } // if

        layerCount = layers.length;
    } // handleRemoveLayer

    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(function() {
            renderer.checkSize();
        }, 250);
    } // handleResize

    function handlePointerTap(evt, absXY, relXY) {
        initHitData('tap', absXY, relXY);

        _self.trigger('tap', absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));
    } // handlePointerTap

    /* private functions */

    function createRenderer(typeName) {
        renderer = _self.renderer = attachRenderer(typeName || params.renderer, _self, viewpane, outer, params);

        fastpan = params.fastpan && renderer.fastpan && DOM.transforms;

        captureInteractionEvents();
    } // createRenderer

    function captureInteractionEvents() {
        if (eventMonitor) {
            eventMonitor.unbind();
        } // if

        if (renderer) {
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

    function createControls(controlTypes) {
        controls = [];

        for (var ii = 0; ii < controlTypes.length; ii++) {
            controls[controls.length] = regCreate(
                'control',
                controlTypes[ii],
                _self,
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

        return layerCount;
    } // getLayerIndex

    function initContainer() {
        outer.appendChild(panContainer = DOM.create('div', '', DOM.styles({
            overflow: 'hidden',
            width: outer.offsetWidth + 'px',
            height: outer.offsetHeight + 'px'
        })));

        width = panContainer.offsetWidth + padding * 2;
        height = panContainer.offsetHeight + padding * 2;
        halfWidth = width / 2;
        halfHeight = height / 2;
        halfOuterWidth = outer.offsetWidth / 2;
        halfOuterHeight = outer.offsetHeight / 2;

        panContainer.appendChild(viewpane = DOM.create('div', '', DOM.styles({
            width: width + 'px',
            height: height + 'px',
            'z-index': 2,
            margin: (-padding) + 'px 0 0 ' + (-padding) + 'px'
        })));
    } // initContainer

    function updateContainer(value) {
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

        lastHitData = elements.length > 0 ? _extend({}, hitData) : null;
    } // checkHits

    function cycle(tickCount) {
        var extraTransforms = [],
            panning,
            scaleChanged,
            rerender,
            viewpaneX,
            viewpaneY,
            viewport;

        self.panSpeed = panSpeed = abs(dx) + abs(dy);

        scaleChanged = scaleFactor !== lastScaleFactor;

        if (panSpeed > 0 || scaleChanged || offsetTween || scaleTween || rotateTween) {
            viewChanges++;

            if (offsetTween && panSpeed > 0) {
                offsetTween(true);
                offsetTween = null;
            } // if
        } // if

        if (panSpeed < PANSPEED_THRESHOLD_REFRESH &&
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
                _self.trigger('pan');
            } // if

            if (DOM.transforms) {
                if (scaleFactor !== 1) {
                    extraTransforms[extraTransforms.length] = 'scale(' + scaleFactor + ')';
                } // if

                if (rotation !== 0) {
                    extraTransforms[extraTransforms.length] = 'rotate(' + rotation + 'deg)';
                } // if
            } // if

            rerender = (! fastpan) || (
                (params.drawOnScale || scaleFactor === 1) &&
                panSpeed < PANSPEED_THRESHOLD_FASTPAN
            );

            if (rerender) {
                if (offsetTween) {
                    var values = offsetTween();

                    offsetX = values[0] | 0;
                    offsetY = values[1] | 0;
                }
                else {
                    offsetX = (offsetX - panX / scaleFactor) | 0;
                    offsetY = (offsetY - panY / scaleFactor) | 0;
                } // if..else

                viewport = getViewport();

                /*
                if (offsetMaxX || offsetMaxY) {
                    constrainOffset();
                } // if
                */


                renderer.trigger('predraw', viewport);

                if (renderer.prepare(layers, viewport, tickCount, hitData)) {
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
                                viewport,
                                _self,
                                tickCount,
                                hitData);

                            if (previousStyle) {
                                renderer.applyStyle(previousStyle);
                            } // if
                        } // if
                    } // for

                    renderer.trigger('render', viewport);

                    _self.trigger('drawComplete', viewport, tickCount);

                    DOM.move(viewpane, viewpaneX, viewpaneY, extraTransforms);
                } // if
            }
            else {
                DOM.move(viewpane, panX, panY, extraTransforms);
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

            if (lastScaleFactor !== scaleFactor) {
                _self.trigger('scaleChanged', scaleFactor);
                lastScaleFactor = scaleFactor;
            };
        } // if
    } // cycle

    function initHitData(hitType, absXY, relXY) {
        hitData = Hits.init(hitType, absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));

        for (var ii = layerCount; ii--; ) {
            hitFlagged = hitFlagged || (layers[ii].hitGuess ?
                layers[ii].hitGuess(hitData.x, hitData.y, _self) :
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

    function center(p1, p2, tween) {
        if (_is(p1, typeString) || _is(p1, typeObject)) {
            var centerXY = new _self.XY(p1);

            centerXY.sync(_self);

            p1 = centerXY.x;
            p2 = centerXY.y;
        } // if

        if (_is(p1, typeNumber)) {
            offset(p1 - halfOuterWidth - padding, p2 - halfOuterHeight - padding, tween);

            return _self;
        }
        else {
            return offset().offset(
                halfOuterWidth + padding | 0,
                halfOuterHeight + padding | 0
            ).sync(_self, true);
        } // if..else
    } // center

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
            outer.removeChild(panContainer);

            panContainer = null;
            viewpane = null;
        } // if

        panFrames = [];
    } // detach

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
        if (_is(id, typeString) && _is(layerType, typeUndefined)) {
            for (var ii = 0; ii < layerCount; ii++) {
                if (layers[ii].id === id) {
                    return layers[ii];
                } // if
            } // for

            return undefined;
        }
        else if (_is(id, typeString)) {
            var layer = regCreate('layer', layerType, _self, settings);

            layer.added = ticks();
            layer.id = id;
            layers[getLayerIndex(id)] = layer;

            layers.sort(function(itemA, itemB) {
                return itemB.zindex - itemA.zindex || itemB.added - itemA.added;
            });

            layerCount = layers.length;

            _self.trigger('resync');
            refresh();

            _self.trigger('layerChange', _self, layer);

            invalidate();

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
        offset(offsetX + x, offsetY + y, tween);
    } // pan

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

            _self.trigger('refresh', _self, viewport);

            viewChanges++;
        } // if
    } // refresh

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

            return _self;
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

            if (! partialScaling) {
                tween = null;

                scaleFactorExp = round(log(targetVal) / Math.LN2);

                targetVal = pow(2, scaleFactorExp);
            } // if

            if (tween) {
                scaleTween = Tweener.tween([scaleFactor], [targetVal], tween, function() {
                    scaleFactor = targetVal;
                    scaleTween = null;
                    viewChanges++;
                });
            }
            else {
                scaleFactor = targetVal;
                viewChanges++;
            }

            return _self;
        } // if
        else {
            return scaleFactor;
        }
    } // scale

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
                        offsetTween = null;
                    }
                );
            }
            else {
                offsetX = x | 0;
                offsetY = y | 0;
            } // if..else

            return _self;
        }
        else {
            return new _self.XY(offsetX, offsetY).sync(_self, true);
        } // if..else
    } // offset

    /* object definition */

    var _self = {
        XY: XY,

        id: params.id,
        padding: padding,
        panSpeed: 0,

        attachFrame: attachFrame,
        center: center,
        detach: detach,
        layer: layer,
        invalidate: invalidate,
        pan: pan,
        refresh: refresh,
        rotate: rotate,
        scale: scale,
        triggerAll: triggerAll,

        /* offset methods */

        setMaxOffset: setMaxOffset,
        getViewport: getViewport,
        offset: offset
    };

    _observable(_self);

    _self.bind('resize', function() {
        renderer.checkSize();
    });

    _self.bind(EVT_REMOVELAYER, handleRemoveLayer);

    _configurable(_self, params, {
        container: updateContainer,
        captureHover: captureInteractionEvents,
        scalable: captureInteractionEvents,
        pannable: captureInteractionEvents,
        renderer: changeRenderer
    });

    CANI.init(function(testResults) {
        layer('markers', 'draw', { zindex: 20 });

        caps = testResults;
        updateContainer(params.container);

        if (isIE) {
            window.attachEvent('onresize', handleResize);
        }
        else {
            window.addEventListener('resize', handleResize, false);
        }
    });

    Animator.attach(cycle);

    createControls(params.controls);

    return _self;
});
/**
# VIEW: simple
*/
reg('view', 'map', function(params) {
    params = _extend({
        container: "",
        captureHover: true,
        controls: ['zoombar'],
        drawOnScale: true,
        padding: 50,
        inertia: true,
        refreshDistance: 256,
        pannable: true,
        scalable: true,

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
        zoomTimeout = 0;

    function checkScaling(evt, scaleFactor) {
        var scaleFactorExp = log(scaleFactor) / Math.LN2 | 0;

        if (scaleFactorExp !== 0) {
            scaleFactor = pow(2, scaleFactorExp);

            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(function() {
                zoom(zoomLevel + scaleFactorExp);
            }, 500);
        } // ifg
    } // checkScaling

    function handleRefresh(evt) {
        var viewport = _self.getViewport();

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
        var viewport = _self.getViewport();

        if (newBounds) {
            var zoomLevel = max(newBounds.bestZoomLevel(viewport), maxZoomLevel || 0);

            return zoom(zoomLevel).center(newBounds.center());
        }
        else {
            return new BBox(
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
                var viewport = _self.getViewport(),
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

                refreshX = 0;
                refreshY = 0;

                _self.trigger('zoom', value);

                var gridSize;

                rpp = _self.rpp = radsPerPixel(zoomLevel);

                _self.setMaxOffset(TWO_PI / rpp | 0, TWO_PI / rpp | 0, true, false);

                _self.scale(1, false, true);

                _self.trigger('resync');

                _self.renderer.trigger('reset');

                _self.refresh();
            } // if

            return _self;
        }
        else {
            return zoomLevel;
        } // if..else
    } // zoom

    var _self = _extend(regCreate('view', 'view', params), {
        XY: GeoXY,

        bounds: bounds,
        zoom: zoom
    });

    _self.bind('refresh', handleRefresh);
    _self.bind('scaleChanged', checkScaling);

    return _self;
});
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

                if (viewToInvalidate) {
                    viewToInvalidate.invalidate();
                } // if
            } // for

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
        observable: true, // TODO: should this be true or false by default
        properties: {},
        typeName: 'Shape'
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

    if (this.observable) {
        _observable(this);
    } // if
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


- `markerStyle` - (default = simple)

    The style of marker that will be displayed for the marker.  This is interpreted
    by each renderer individually.

*/
reg(typeDrawable, 'marker', function(view, layer, params) {
    params = _extend({
        fill: true,
        stroke: false,
        markerStyle: 'simple',
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


## Methods
*/
reg(typeDrawable, 'poly', function(view, layer, params) {
    params = _extend({
        simplify: false,
        fill: true,
        points: [],
        typeName: 'Poly'
    }, params);

    /* internals */

    var points = [],
        pointsToParse;

    function updateDrawPoints() {
        var ii, x, y, maxX, maxY, minX, minY, drawPoints;

        drawPoints = _self.points = params.simplify ? simplify(points) : points;

        for (ii = drawPoints.length; ii--; ) {
            x = drawPoints[ii].x;
            y = drawPoints[ii].y;

            minX = _is(minX, typeUndefined) || x < minX ? x : minX;
            minY = _is(minY, typeUndefined) || y < minY ? y : minY;
            maxX = _is(maxX, typeUndefined) || x > maxX ? x : maxX;
            maxY = _is(maxY, typeUndefined) || y > maxY ? y : maxY;
        } // for

        _self.updateBounds(new Rect(minX, minY, maxX - minX, maxY - minY), true);
    } // updateDrawPoints

    function updatePoints(input) {
        if (_is(input, typeArray)) {
            points = [];

            Runner.process(input, function(slice, sliceLen) {
                for (var ii = 0; ii < sliceLen; ii++) {
                    points[points.length] = new view.XY(slice[ii]);
                } // for
            }, resync);
        } // if
    } // updatePoints

    /* exported functions */

    /**
    ### resync(view)
    Used to synchronize the points of the poly to the grid.
    */
    function resync() {
        if (points.length) {
            Runner.process(points, function(slice, sliceLen) {
                for (var ii = sliceLen; ii--; ) {
                    slice[ii].sync(view);
                } // for
            }, updateDrawPoints);
        } // if
    } // resync

    var _self = _extend(new Drawable(view, layer, params), {
        points: [],

        getPoints: function() {
            return [].concat(points);
        },

        resync: resync
    });

    _configurable(_self, params, {
        points: updatePoints
    });

    updatePoints(params.points);

    return _self;
});
/**
# DRAWABLE: line
*/
reg(typeDrawable, 'line', function(view, layer, params) {
    params.fill = false;
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
function ViewLayer(view, params) {
    params = _extend({
        id: 'layer_' + layerCounter++,
        zindex: 0,
        animated: false,
        style: null,
        minXY: null,
        maxXY: null
    }, params);

    this.visible = true;
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
    hitGuess: null,

    /**
    ### remove()
    */
    remove: function() {
        this.view.trigger(EVT_REMOVELAYER, this);
    }
}; // ViewLayer.prototype
/**
# LAYER: tile
*/
reg('layer', 'tile', function(view, params) {
    params = _extend({
        generator: 'osm',
        imageLoadArgs: {}
    }, params);

    var TILELOAD_MAX_PANSPEED = 2,
        genFn = regCreate('generator', params.generator, params).run,
        generating = false,
        storage = null,
        zoomTrees = [],
        loadArgs = params.imageLoadArgs;

    /* event handlers */

    function handleRefresh(evt, view, viewport) {
        if (storage) {
            genFn(view, viewport, storage, function() {
                view.invalidate();
            });
        } // if
    } // handleViewIdle

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

    var _self = _extend(new ViewLayer(view, params), {
        draw: draw
    });

    view.bind('resync', handleResync);
    view.bind('refresh', handleRefresh);

    return _self;
});
/**
# LAYER: Draw
*/
reg('layer', 'draw', function(view, params) {
    params = _extend({
        zindex: 10
    }, params);

    var drawables = [],
        storage,
        sortTimeout = 0;

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

    function handleResync(evt) {
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
        storage = new SpatialStore();

        drawables = [];
        _self.trigger('cleared');
        _self.itemCount = 0;

        view.invalidate();
    } // clear

    /**
    ### create(type, settings, prepend)
    */
    function create(type, settings, prepend) {
        var drawable = regCreate(typeDrawable, type, view, _self, settings);
        if (! drawable) {
            throw NO_DRAWABLE(type);
        } // if

        if (prepend) {
            drawables.unshift(drawable);
        }
        else {
            drawables[drawables.length] = drawable;
        } // if..else

        drawable.resync();
        if (storage && drawable.bounds) {
            storage.insert(drawable.bounds, drawable);
        } // if

        triggerSort(view);

        drawable.bind('move', handleItemMove);

        _self.itemCount = drawables.length;
        _self.trigger(type + 'Added', drawable);

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
                overrideStyle = drawable.style || _self.style,
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
            drawData = prepFn ? prepFn.call(renderer,
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
    ### hitGuess(hitX, hitY, view)
    Return true if any of the markers are hit, additionally, store the hit elements
    so we don't have to do the work again when drawing
    */
    function hitGuess(hitX, hitY, view) {
        return storage && storage.search({
            x: hitX - 10,
            y: hitY - 10,
            w: 20,
            h: 20
        }).length > 0;
    } // hitGuess

    /* initialise _self */

    var _self = _extend(new ViewLayer(view, params), {
        itemCount: 0,

        clear: clear,
        create: create,
        draw: draw,
        find: find,
        hitGuess: hitGuess
    });

    view.bind('resync', handleResync);

    return _self;
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

/**
# T5.Pos

## Methods
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
    ### distanceTo(targetPos)
    */
    distanceTo: function(pos) {
        if ((! targetPos) || this.empty() || targetPos.empty()) {
            return 0;
        } // if

        var halfdelta_lat = toRad(targetPos.lat - this.lat) >> 1;
        var halfdelta_lon = toRad(targetPos.lon - this.lon) >> 1;

        var a = sin(halfdelta_lat) * sin(halfdelta_lat) +
                (cos(toRad(this.lat)) * cos(toRad(targetPos.lat))) *
                (sin(halfdelta_lon) * sin(halfdelta_lon)),
            c = 2 * atan2(sqrt(a), sqrt(1 - a));

        return KM_PER_RAD * c;
    },

    /**
    ### equalTo(testPos)
    */
    equalTo: function(testPos) {
        return pos && (this.lat === testPos.lat) && (this.lon === testPos.lon);
    },

    /**
    ### empty()
    */
    empty: function() {
        return this.lat === 0 && this.lon === 0;
    },

    /**
    ### inArray(testArray)
    */
    inArray: function(testArray) {
        for (var ii = testArray.length; ii--; ) {
            if (this.equal(testArray[ii])) {
                return true;
            } // if
        } // for

        return false;
    },

    /**
    ### offset(latOffset, lonOffset)
    Return a new position which is the original `pos` offset by
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

    /**
    ### toPixels()
    Return an xy of the mercator pixel value for the position
    */
    toPixels: function() {
        return _project(this.lon, this.lat);
    },

    /**
    ### toBounds(size)
    This function is very useful for creating a Geo.BoundingBox given a
    center position and a radial distance (specified in KM) from the center
    position.  Basically, imagine a circle is drawn around the center
    position with a radius of distance from the center position, and then
    a box is drawn to surround that circle.  Adapted from the [functions written
    in Java by Jan Philip Matuschek](http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates)
    */
    toBounds: function(size) {
        var radDist = size / KM_PER_RAD,
            radLat = this.lat * DEGREES_TO_RADIANS,
            radLon = this.lon * DEGREES_TO_RADIANS,
            minLat = radLat - radDist,
            maxLat = radLat + radDist,
            minLon, maxLon;


        if ((minLat > MIN_LAT_RAD) && (maxLat < MAX_LAT_RAD)) {
            var deltaLon = asin(sin(radDist) / cos(radLat));

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
            minLat = max(minLat, MIN_LAT_RAD);
            maxLat = min(maxLat, MAX_LAT_RAD);
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
    }
};
(function() {
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


    reg('fn', 'generalize', generalize);
})();
/**
# T5.BBox
*/
function BBox(p1, p2) {
    if (_is(p1, typeArray)) {
        var padding = p2,
            minPos = new Pos(MAX_LAT, MAX_LON),
            maxPos = new Pos(MIN_LAT, MIN_LON);

        for (var ii = p1.length; ii--; ) {
            var testPos = p1[ii];

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
        } // for

        this.min = minPos;
        this.max = maxPos;

        if (_is(padding, typeUndefined)) {
            var size = this.size();

            padding = max(size.x, size.y) * 0.3;
        } // if

        this.expand(padding);
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
    bestZoomLevel: function(viewport) {
        var boundsCenter = this.center(),
            maxZoom = 1000,
            variabilityIndex = min(round(abs(boundsCenter.lat) * 0.05), LAT_VARIABILITIES.length),
            variability = LAT_VARIABILITIES[variabilityIndex],
            delta = this.size(),
            bestZoomH = ceil(log(LAT_VARIABILITIES[3] * viewport.h / delta.y) / log(2)),
            bestZoomW = ceil(log(variability * viewport.w / delta.x) / log(2));


        return min(isNaN(bestZoomH) ? maxZoom : bestZoomH, isNaN(bestZoomW) ? maxZoom : bestZoomW);
    },

    /**
    ### center()
    */
    center: function() {
        var size = this.size();

        return new Pos(this.min.lat + (size.y >> 1), this.min.lon + (size.x >> 1));
    },

    /**
    ### expand(amount)
    */
    expand: function(amount) {
        this.min.lat -= amount;
        this.max.lat += amount;
        this.min.lon -= amount % 360;
        this.max.lon += amount % 360;
    },

    /**
    ### size(normalize)
    */
    size: function(normalize) {
        var size = new XY(0, this.max.lat - this.min.lat);

        if ((normalize || _is(normalize, typeUndefined)) && (this.min.lon > this.max.lon)) {
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
    }
};

/**
# T5

## Methods
*/
var T5 = {
    ex: _extend,
    log: _log,
    observable: _observable,
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

    userMessage: userMessage,

    Registry: Registry,
    Style: Style,
    DOM: DOM,
    Rect: Rect,
    XY: XY,
    Hits: Hits,

    Control: Control,
    Tile: Tile,
    Tweener: Tweener,
    getImage: getImage,

    Pos: Pos,
    BBox: BBox
};

_observable(T5);

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
# T5.RouteTools
__PLUGIN__: `plugins/geo.routetools.js`


## Events

## Module Methods
*/
T5.RouteTools = (function() {

    /* internals */

    var customTurnTypeRules = undefined,
        generalize = T5.fn('generalize'),

        REGEX_BEAR = /bear/i,
        REGEX_DIR_RIGHT = /right/i,

        TurnTypeSprites = {
            'unknown': '0:0',

            'start': '1:0',
            'continue': '1:1',
            'arrive': '1:2',

            'left': '2:0',
            'left-slight': '2:1',
            'left-sharp': '2:2',

            'right': '3:0',
            'right-slight': '3:1',
            'right-sharp': '3:2',

            'uturn-left': '4:0',
            'uturn-right': '4:1',
            'merge': '4:2',

            'roundabout-enter': '5:0',

            'ramp': '6:0',
            'ramp-exit': '6:1'
        };

    var DefaultTurnTypeRules = (function() {
        var rules = [];

        rules.push({
            regex: /continue/i,
            turnType: 'continue'
        });

        rules.push({
            regex: /(take|bear|turn)(.*?)left/i,
            customCheck: function(text, matches) {
                return 'turn-left' + getTurnAngle(matches[1]);
            }
        });

        rules.push({
            regex: /(take|bear|turn)(.*?)right/i,
            customCheck: function(text, matches) {
                return 'turn-right' + getTurnAngle(matches[1]);
            }
        });

        rules.push({
            regex: /enter\s(roundabout|rotary)/i,
            turnType: 'roundabout'
        });

        rules.push({
            regex: /take.*?ramp/i,
            turnType: 'ramp'
        });

        rules.push({
            regex: /take.*?exit/i,
            turnType: 'ramp-exit'
        });

        rules.push({
            regex: /make(.*?)u\-turn/i,
            customCheck: function(text, matches) {
                return 'uturn' + getTurnDirection(matches[1]);
            }
        });

        rules.push({
            regex: /proceed/i,
            turnType: 'start'
        });

        rules.push({
            regex: /arrive/i,
            turnType: 'arrive'
        });

        rules.push({
            regex: /fell\sthrough/i,
            turnType: 'merge'
        });

        return rules;
    })();

    var RouteData = function(params) {
        params = _extend({
            geometry: [],
            instructions: [],
            boundingBox: null
        }, params);

        if (! params.boundingBox) {
            params.boundingBox = new T5.BBox(params.geometry);
        } // if

        var _self = _extend({
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

        return _self;
    }; // RouteData

    var Instruction = function(params) {
        params = _extend({
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
    }; // instruction


    /* internal functions */

    function getTurnDirection(turnDir) {
        return REGEX_DIR_RIGHT.test(turnDir) ? '-right' : '-left';
    } // getTurnDirection

    function getTurnAngle(turnText) {
        if (REGEX_BEAR.test(turnText)) {
            return '-slight';
        } // if

        return '';
    } // getTurnAngle

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
        args = _extend({
            engineId: "",
            waypoints: [],
            map: null,
            error: null,
            autoFit: true,
            success: null,
            generalize: false
        }, args);

        var service = T5.Registry.create('service', 'routing');
        if (service) {
            service.calculate(args, function(routeData) {
                if (args.generalize) {
                    routeData.geometry = generalize(routeData.geometry, routeData.getInstructionPositions());
                } // if

                if (args.map) {
                    createMapOverlay(args.map, routeData);

                    if (args.autoFit) {
                        args.map.bounds(routeData.boundingBox);
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
        if (routeData.geometry) {
            map.layer('route', 'draw').create('line', {
                points: routeData.geometry,
                style: 'waypoints',
                simplify: true
            });
        } // if
    } // createMapOverlay

    /**
    ### parseTurnType(text)
    To be completed
    */
    function parseTurnType(text) {
        var turnType = 'unknown',
            rules = customTurnTypeRules || DefaultTurnTypeRules;

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
        calculate: calculate,
        createMapOverlay: createMapOverlay,
        parseTurnType: parseTurnType,

        Instruction: Instruction,
        RouteData: RouteData
    };

    T5.observable(module);

    return module;
})();
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

T5.Decarta = (function() {
    var currentConfig = {
        sessionID: new Date().getTime(),
        server: "",
        clientName: "",
        clientPassword: "",
        configuration: "",
        maxResponses: 25,
        release: "4.4.2sp03",
        tileFormat: "PNG",
        fixedGrid: true,
        useCache: true,
        tileHosts: [],

        requestTimeout: 30000,

        geocoding: {
            countryCode: "US",
            language: "EN"
        }
    };

var ZOOM_MAX = 18,
    ZOOM_MIN = 3;

var placeFormatters = {
    DEFAULT: function(params) {
        var keys = ["landmark", "municipalitySubdivision", "municipality", "countrySubdivision"];
        var place = "";

        for (var ii = 0; ii < keys.length; ii++) {
            if (params[keys[ii]]) {
                place += params[keys[ii]] + " ";
            } // if
        } // for

        return place;
    } // DEFAULT formatter
};

var lastZoom = null,
    requestCounter = 1,
    header = _formatter(
        "<xls:XLS version='1' xls:lang='en' xmlns:xls='http://www.opengis.net/xls' rel='{4}' xmlns:gml='http://www.opengis.net/gml'>" +
            "<xls:RequestHeader clientName='{0}' clientPassword='{1}' sessionID='{2}' configuration='{3}' />" +
            "{5}" +
        "</xls:XLS>"),
    requestFormatter = _formatter("<xls:Request maximumResponses='{0}' version='{1}' requestID='{2}' methodName='{3}Request'>{4}</xls:Request>"),
    urlFormatter = _formatter('{0}/JSON?reqID={1}&chunkNo=1&numChunks=1&data={2}&responseFormat=JSON');

/* internal decarta functions */

/*
This function is used to convert from the deCarta distance JSON data
to an integer value representing the distance in meters
*/
function distanceToMeters(distance) {
    var uom = distance.uom ? distance.uom.toUpperCase() : 'M',
        conversionFactors = {
            'M': 1,
            'KM': 1000
        },
        factor = conversionFactors[uom];

    return distance.value && factor ? distance.value * factor : 0;
} // uomToMeters

var Address = function(params) {
        params = T5.ex({
            countryCode: currentConfig.geocoding.countryCode,
            language: currentConfig.geocoding.language,
            freeform: null,
            streetAddress: {
                building: null
            }
        }, params);

        var addressHeader = _formatter('<xls:Address countryCode="{0}" language="{1}">');

        var _self = {
            getXML: function() {
                var addressXml = addressHeader(params.countryCode, params.language);

                if (params.freeform) {
                    var addressText = String(params.freeform).replace(/(\'|\")/, "\\$1");
                    addressXml += "<xls:freeFormAddress>" + addressText + "</xls:freeFormAddress>";
                }
                else {

                } // if..else

                return addressXml + "</xls:Address>";
            } //getXML
        };

        return _self;
    },

    Place = function(params) {
        params = T5.ex({
            landmark: "",
            municipality: "",
            municipalitySubdivision: "",
            countrySubdivision: "",
            countryCode: ""
        }, params);

        var _self = T5.ex({
            calcMatchPercentage: function(input) {
                var fnresult = 0;

                if (params.landmark && params.landmarkSubType) {
                    if (T5.wordExists(input, params.landmarkSubType)) {
                        fnresult += 0.4;

                        fnresult += T5.wordExists(input, params.landmark) ? 0.6 : 0;
                    } // if
                }
                else {
                    fnresult += T5.wordExists(input, params.municipalitySubdivision) ? 0.8 : 0;

                    if ((fnresult === 0) && params.municipality) {
                        fnresult += T5.wordExists(input, params.municipality) ? 0.7 : 0;
                    } // if
                } // if..else

                if (params.countrySubdivision) {
                    fnresult += T5.wordExists(input, params.countrySubdivision) ? 0.2 : 0;
                } // if

                return fnresult;
            },

            getCountryCode: function() {
                if (params.countryCode) {
                    return params.countryCode.toUpperCase();
                } // if

                return "";
            },

            parse: function(details) {
                for (var ii = 0; details && (ii < details.length); ii++) {
                    var contentType = details[ii].type ? (details[ii].type.slice(0, 1).toLowerCase() + details[ii].type.slice(1)) : "";

                    if (typeof params[contentType] !== 'undefined') {
                        params[contentType] = details[ii].content;

                        if (details[ii].subType) {
                            params[contentType + "SubType"] = details[ii].subType;
                        } // if
                    } // if
                } // for

                T5.ex(_self, params);
            },

            toString: function() {
                var formatter = placeFormatters[_self.getCountryCode()];

                if (! formatter) {
                    formatter = placeFormatters.DEFAULT;
                } // if

                return formatter(params);
            }
        }, params);

        return _self;
    },

    Street = function(params) {
        params = T5.ex({
            json: {}
        }, params);

        var street = "",
            building = "";

        if (params.json.Street) {
            street = params.json.Street.content ? params.json.Street.content : params.json.Street;
        } // if

        street = (street && street.replace) ? street.replace(/\/\d+$/, "") : "";

        if (params.json.Building) {
            if (params.json.Building.number) {
                building = params.json.Building.number;
            } // if
        } // if

        return {
            building: building,
            street: street,

            calcMatchPercentage: function(input) {
                var fnresult = 0,
                    test1 = T5.Geo.A.normalize(input),
                    test2 = T5.Geo.A.normalize(street);

                if (params.json.Building) {
                    if (T5.Geo.A.buildingMatch(input, params.json.Building.number.toString())) {
                        fnresult += 0.2;
                    } // if
                } // if

                if (test1 && test2 && T5.wordExists(test1, test2)) {
                    fnresult += 0.8;
                } // if

                return fnresult;
            },

            toString: function() {
                if (street) {
                    return (building ? building + " " : "") + street;
                } // if

                return "";
            }
        };
    };

/* request types and functions */

function createRequestHeader(payload) {
    return header(
        currentConfig.clientName,
        currentConfig.clientPassword,
        currentConfig.sessionID,
        currentConfig.configuration,
        currentConfig.release,
        payload);
} // createRequestHeader

function createRequestTag(request, payload) {
    return requestFormatter(
        request.maxResponses,
        request.version,
        request.requestID,
        request.methodName,
        payload);
} // createRequestTag

function generateRequest(request) {
    return createRequestHeader(createRequestTag(request, request.getRequestBody()));
} // generateRequest

function generateRequestUrl(request, request_data) {
    if (! currentConfig.server) {
        _log("No server configured for deCarta - we are going to have issues", 'warn');
    } // if

    return urlFormatter(currentConfig.server, request.requestID, escape(request_data));
} // generateRequestUrl

function makeServerRequest(request, callback) {

    _jsonp(generateRequestUrl(request, generateRequest(request)), function(data) {
        var response = data.response.XLS.Response;

        if ((response.numberOfResponses > 0) && response[request.methodName + 'Response']) {
            var parsedResponse = null;
            if (request.parseResponse) {
                parsedResponse = request.parseResponse(response[request.methodName + 'Response']);
            } // if

            if (callback) {
                callback(parsedResponse);
            } // if
        }
        else {
            _log("no responses from server: " + data.response, 'error');
        } // if..else
    });
} // openlsComms

function parseAddress(address, position) {
    var streetDetails = new Street({
            json: address.StreetAddress
        });

    var placeDetails = new Place({
        countryCode: address.countryCode
    });

    placeDetails.parse(address.Place);

    var addressParams = {
        streetDetails: streetDetails,
        location: placeDetails,
        country: address.countryCode ? address.countryCode : "",
        postalCode: address.PostalCode ? address.PostalCode : "",
        pos: position
    };

    return new T5.Geo.Address(addressParams);
} // parseAddress

var Request = function() {
    var _self = {
        methodName: "",
        maxResponses: 25,
        version: "1.0",
        requestID: requestCounter++,

        getRequestBody: function() {
            return "";
        },

        parseResponse: function(response) {
            return response;
        }
    }; // _self

    return _self;
};

var RUOKRequest = function(params) {
    return T5.ex(new Request(), {
        methodName: 'RUOK',

        parseResponse: function(response) {
            return {
                aliasCount: response.maxHostAliases,
                host: response.hostName
            };
        }
    });
}; // RUOKRequest
T5.Registry.register('generator', 'decarta', function(params) {
    params = T5.ex({
        tileSize: 256
    }, params);

    var DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI;

    var _ll_LUT = [
        "89.787438015348100000,360.00000000000000000",
        "85.084059050110410000,180.00000000000000000",
        "66.653475896509040000,90.00000000000000000",
        "41.170427238429790000,45.000000000000000000",
        "22.076741328793200000,22.500000000000000000",
        "11.251819676168665000,11.250000000000000000",
        "5.653589942659626000,5.625000000000000000",
        "2.830287664051185000,2.812500000000000000",
        "1.415581451872543800,1.406250000000000000",
        "0.707845460801532700,0.703125000000000000",
        "0.353929573271679340,0.351562500000000000",
        "0.176965641673330230,0.175781250000000000",
        "0.088482927761462040,0.087890625000000000",
        "0.044241477246363230,0.043945312500000000",
        "0.022120740293895182,0.021972656250000000",
        "0.011060370355776452,0.010986328125000000",
        "0.005530185203987857,0.005493164062500000",
        "0.002765092605263539,0.002746582031250000",
        "0.001382546303032519,0.001373291015625000",
        "0.000691272945568983,0.000686645507812500",
        "0.000345636472797214,0.000343322753906250"
    ],
    hosts = null;

    /* internals */

    function createTiles(view, viewRect, store, callback) {
        var zoomLevel = view.zoom ? view.zoom() : 0;

        if (zoomLevel) {
            var numTiles = 2 << (zoomLevel - 1),
                numTilesHalf = numTiles >> 1,
                tileSize = params.tileSize,
                xTiles = (viewRect.w / tileSize | 0) + 1,
                yTiles = (viewRect.h / tileSize | 0) + 1,
                xTile = (viewRect.x / tileSize | 0) - numTilesHalf,
                yTile = numTiles - (viewRect.y / tileSize | 0) - numTilesHalf - yTiles,
                tiles = store.search({
                    x: (numTilesHalf + xTile) * tileSize,
                    y: (numTilesHalf + yTile*-1 - yTiles) * tileSize,
                    w: xTiles * tileSize,
                    h: yTiles * tileSize
                }),
                tileIds = {},
                ii;

            for (ii = tiles.length; ii--; ) {
                tileIds[tiles[ii].id] = true;
            } // for

            for (var xx = 0; xx <= xTiles; xx++) {
                for (var yy = 0; yy <= yTiles; yy++) {
                    var tileX = xTile + xx,
                        tileY = yTile + yy - 1,
                        tileId = tileX + '_' + tileY;

                    if (! tileIds[tileId]) {
                        var tileUrl = hosts[xx % hosts.length] + '/openls/image-cache/TILE?'+
                               'LLMIN=0.0,0.0' +
                               '&LLMAX=' + _ll_LUT[zoomLevel] +
                               '&CACHEABLE=true' +
                               '&DS=navteq-world' +
                               '&WIDTH=' + (256 /* * dpr*/) +
                               '&HEIGHT=' + (256 /* * dpr*/) +
                               '&CLIENTNAME=' + currentConfig.clientName +
                               '&SESSIONID=' + currentConfig.sessionID +
                               '&FORMAT=PNG' +
                               '&CONFIG=' + currentConfig.configuration +
                               '&N=' + tileY +
                               '&E=' + tileX,
                            tile = new T5.Tile(
                                (numTilesHalf + xTile + xx) * tileSize,
                                (numTilesHalf + yTile*-1 - yy) * tileSize,
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
    } // createTiles


    /* exports */

    function run(view, viewRect, store, callback) {
        if (hosts) {
            createTiles(view, viewRect, store, callback);
        }
        else {
            makeServerRequest(new RUOKRequest(), function(tileConfig) {
                hosts = [];

                if (tileConfig.aliasCount) {
                    for (var ii = 0; ii < tileConfig.aliasCount; ii++) {
                        hosts[ii] = 'http://' + tileConfig.host.replace('^(.*?)\.(.*)$', '\1-0' + (ii + 1) + '.\2');
                    } // for
                }
                else {
                    hosts = ['http://' + tileConfig.host];
                } // if..else

                createTiles(view, viewRect, store, callback);
            });
        }
    } // run

    /* define the generator */

    T5.userMessage('ack', 'decarta', '&copy; deCarta, Inc. Map and Imagery Data &copy; NAVTEQ or Tele Atlas or DigitalGlobe');

    return {
        run: run
    };
});
T5.Registry.register('service', 'geocoder', function() {

    /* internals */

    var GeocodeRequest = function(params) {
        params = T5.ex({
            addresses: [],
            parserReport: false,
            parseOnly: false,
            returnSpatialKeys: false
        }, params);

        var requestFormatter = _formatter('<xls:GeocodeRequest parserReport="{0}" parseOnly="{1}" returnSpatialKeys="{2}">');

        function validMatch(match) {
            return match.GeocodeMatchCode && match.GeocodeMatchCode.matchType !== "NO_MATCH";
        } // validMatch

        function parseMatchResult(match) {
            var matchAddress = null;
            var matchPos = null;

            if (match && validMatch(match)) {
                if (match && match.Point) {
                    matchPos = new T5.Pos(match.Point.pos);
                } // if

                if (match && match.Address) {
                    matchAddress = parseAddress(match.Address, matchPos);
                } // if
            }

            return matchAddress;
        } // parseMatchResult

        function getResponseAddresses(responseList) {
            var addresses = [];
            var responseCount = responseList ? responseList.numberOfGeocodedAddresses : 0;
            var matchList = [];

            if (responseCount > 1) {
                matchList = responseList.GeocodedAddress;
            }
            else if (responseCount == 1) {
                matchList = [responseList.GeocodedAddress];
            } // if..else

            try {
                for (var ii = 0; matchList && (ii < matchList.length); ii++) {
                    var matchResult = parseMatchResult(matchList[ii]);
                    if (matchResult) {
                        addresses.push(matchResult);
                    } // if
                } // for
            }
            catch (e) {
                _log(e, 'error');
            } // try..except

            return addresses;
        } // getResponseAddresses

        var parent = new Request();

        var _self = T5.ex({}, parent, {
            methodName: "Geocode",

            getRequestBody: function() {
                var body = requestFormatter(params.parserReport, params.parseOnly, params.returnSpatialKeys);

                for (var ii = 0; ii < params.addresses.length; ii++) {
                    body += params.addresses[ii].getXML();
                } // for

                return body + "</xls:GeocodeRequest>";
            },

            parseResponse: function(response) {

                if (params.addresses.length === 1) {
                    return [getResponseAddresses(response.GeocodeResponseList)];
                }
                else {
                    var results = [];
                    for (var ii = 0; ii < params.addresses.length; ii++) {
                        results.push(getResponseAddresses(response.GeocodeResponseList[ii]));
                    } // for

                    return results;
                } // if..else
            }
        });

        return _self;
    };

    var ReverseGeocodeRequest = function(params) {
        params = T5.ex({
            position: null,
            geocodePreference: "StreetAddress"
        }, params);

        var _self = T5.ex(new Request(), {
            methodName: "ReverseGeocode",

            getRequestBody: function() {
                return "" +
                    "<xls:ReverseGeocodeRequest>" +
                        "<xls:Position>" +
                            "<gml:Point>" +
                                "<gml:pos>" + params.position.toString() + "</gml:pos>" +
                            "</gml:Point>" +
                        "</xls:Position>" +
                        "<xls:ReverseGeocodePreference>" + params.geocodePreference + "</xls:ReverseGeocodePreference>" +
                    "</xls:ReverseGeocodeRequest>";
            },

            parseResponse: function(response) {
                var matchPos = null;

                if (response && response.Point) {
                    matchPos = new T5.Pos(match.Point.pos);
                } // if

                if (response && response.ReverseGeocodedLocation && response.ReverseGeocodedLocation.Address) {
                    return parseAddress(response.ReverseGeocodedLocation.Address, matchPos);
                } // if

                return null;
            }
        });

        return _self;
    };

    /* exports */

    function forward(args) {
        args = T5.ex({
            addresses: [],
            complete: null
        }, args);

        var ii, requestAddresses = [];

        if (args.addresses && (! T5.is(args.addresses, 'array'))) {
            args.addresses = [args.addresses];
        } // if

        for (ii = 0; ii < args.addresses.length; ii++) {
            if (T5.is(args.addresses[ii], 'object')) {
                _log("attempting to geocode a simple object - not implemented", 'warn');
            }
            else {
                requestAddresses.push(new types.Address({
                    freeform: args.addresses[ii]
                }));
            }
        } // if

        if (requestAddresses.length > 0) {
            var request = new GeocodeRequest({
                addresses: requestAddresses
            });

            makeServerRequest(request, function(geocodeResponses) {
                if (args.complete) {
                    for (ii = 0; ii < geocodeResponses.length; ii++) {
                        args.complete(args.addresses[ii], geocodeResponses[ii]);
                    } // for
                } // if

            });
        } // if
    } // forward

    function reverse(args) {
        args = T5.ex({
            position: null,
            complete: null
        }, args);

        if (! args.position) {
            throw new Error("Cannot reverse geocode without a position");
        } // if

        var request = new ReverseGeocodeRequest(args);

        makeServerRequest(request, function(matchingAddress) {
            if (args.complete) {
                args.complete(matchingAddress);
            }
        });
    } // reverse

    return {
        forward: forward,
        reverse: reverse
    };
});
T5.Registry.register('service', 'routing', function() {

    function parsePositions(sourceData) {
        var sourceLen = sourceData.length,
            positions = new Array(sourceLen);

        for (var ii = sourceLen; ii--; ) {
            positions[ii] = new Pos(sourceData[ii]);
        } // for

        return positions;
    } // parsePositions

    var RouteRequest = function(params) {
        params = T5.ex({
            waypoints: [],
            provideRouteHandle: false,
            distanceUnit: "KM",
            routeQueryType: "RMAN",
            routePreference: "Fastest",
            routeInstructions: true,
            routeGeometry: true
        }, params);

        var parent = new Request(),
            routeHeaderFormatter = T5.formatter('<xls:DetermineRouteRequest provideRouteHandle="{0}" distanceUnit="{1}" routeQueryType="{2}">'),
            waypointFormatter = T5.formatter('<xls:{0}><xls:Position><gml:Point><gml:pos>{1}</gml:pos></gml:Point></xls:Position></xls:{0}>');

        function parseInstructions(instructionList) {
            var fnresult = [],
                instructions = instructionList && instructionList.RouteInstruction ?
                    instructionList.RouteInstruction : [],
                totalDistance = 0,
                totalTime = new COG.Duration();

            for (var ii = 0; ii < instructions.length; ii++) {
                var distance = distanceToMeters(instructions[ii].distance),
                    time = COG.parseDuration(instructions[ii].duration, '8601');

                totalDistance = totalDistance + distance;
                totalTime = COG.addDuration(totalTime, time);

                fnresult.push(new T5.RouteTools.Instruction({
                    position: new T5.Pos(instructions[ii].Point),
                    description: instructions[ii].Instruction,
                    distance: distance,
                    distanceTotal: totalDistance,
                    time: time,
                    timeTotal: totalTime
                }));
            } // for


            return fnresult;
        } // parseInstructions

        var _self = T5.ex({}, parent, {
            methodName: "DetermineRoute",

            getRequestBody: function() {
                if (params.waypoints.length < 2) {
                    throw new Error("Cannot send RouteRequest, less than 2 waypoints specified");
                } // if

                var body = routeHeaderFormatter(params.provideRouteHandle, params.distanceUnit, params.routeQueryType);

                body += "<xls:RoutePlan>";

                body += "<xls:RoutePreference>" + params.routePreference + "</xls:RoutePreference>";

                body += "<xls:WayPointList>";

                for (var ii = 0; ii < params.waypoints.length; ii++) {
                    var tagName = (ii === 0 ? "StartPoint" : (ii === params.waypoints.length-1 ? "EndPoint" : "ViaPoint"));

                    body += waypointFormatter(tagName, params.waypoints[ii].toString());
                }

                body += "</xls:WayPointList>";


                body += "</xls:RoutePlan>";

                if (params.routeInstructions) {
                    body += "<xls:RouteInstructionsRequest rules=\"maneuver-rules\" providePoint=\"true\" />";
                } // if

                if (params.routeGeometry) {
                    body += "<xls:RouteGeometryRequest />";
                } // if

                body += "</xls:DetermineRouteRequest>";
                return body;
            },

            parseResponse: function(response) {

                return new T5.RouteTools.RouteData({
                    geometry: parsePositions(response.RouteGeometry.LineString.pos),
                    instructions: parseInstructions(response.RouteInstructionsList)
                });
            }
        });

        return _self;
    };

    /* exports */

    function calculate(args, callback) {
        args = T5.ex({
           waypoints: []
        }, args);

        if (typeof T5.RouteTools !== 'undefined') {
            var request = new RouteRequest(args);
            makeServerRequest(request, function(routeData) {
                if (callback) {
                    callback(routeData);
                } // if
            });
        }
        else {
            _log('Could not generate route, T5.RouteTools plugin not found', 'warn');
        } // if..else
    } // calculate

    return {
        calculate: calculate
    };
});

    return {
        applyConfig: function(args) {
            T5.ex(currentConfig, args);
        },

        compareFns: (function() {
            return {
                streetDetails: function(input, fieldVal) {
                    return fieldVal.calcMatchPercentage(input);
                },
                location: function(input, fieldVal) {
                    return fieldVal.calcMatchPercentage(input);
                }
            };
        })()
    };
})();

    exports.T5 = T5;
    exports.Tile5 = Tile5;
})(window);
