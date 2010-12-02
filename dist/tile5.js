/*!
 * Sidelab T5 Javascript Library v0.4.0

 * http://sidelab.com/projects/T5/
 *
 * Copyright 2010, Damon Oehlman
 * Licensed under the MIT licence
 * http://sidelab.com/projects/T5/license
 *
 * Date: ${date}
 */
 
/*jslint white: true, safe: true, onevar: true, undef: true, nomen: true, eqeqeq: true, newcap: true, immed: true, strict: true *//* GRUNTJS START */
/** @namespace */
COG = (function() {
    // initialise constants
    var REGEX_TEMPLATE_VAR = /\$\{(.*?)\}/ig;
    
    var hasOwn = Object.prototype.hasOwnProperty,
        objectCounter = 0;
    
    // define the GRUNT module
    var module = {
        /** @lends GRUNT */
        
        id: "grunt.core",
        
        /* 
        Very gr*nty jQuery stuff.
        Taken from http://github.com/jquery/jquery/blob/master/src/core.js
        */
        
        /** @static */
        extend: function() {
            // copy reference to target object
            var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

            // Handle a deep copy situation
            if ( typeof target === "boolean" ) {
                deep = target;
                target = arguments[1] || {};
                // skip the boolean and the target
                i = 2;
            }

            // Handle case when target is a string or something (possible in deep copy)
            if ( typeof target !== "object" && !module.isFunction(target) ) {
                target = {};
            }

            // extend module itself if only one argument is passed
            if ( length === i ) {
                target = this;
                --i;
            }

            for ( ; i < length; i++ ) {
                // Only deal with non-null/undefined values
                if ( (options = arguments[ i ]) != null ) {
                    // Extend the base object
                    for ( name in options ) {
                        src = target[ name ];
                        copy = options[ name ];

                        // Prevent never-ending loop
                        if ( target === copy ) {
                            continue;
                        }

                        // Recurse if we're merging object literal values or arrays
                        if ( deep && copy && ( module.isPlainObject(copy) || module.isArray(copy) ) ) {
                            var clone = src && ( module.isPlainObject(src) || module.isArray(src) ) ? src
                                : module.isArray(copy) ? [] : {};

                            // Never move original objects, clone them
                            target[ name ] = module.extend( deep, clone, copy );

                        // Don't bring in undefined values
                        } else if ( copy !== undefined ) {
                            target[ name ] = copy;
                        }
                    }
                }
            }

            // Return the modified object
            return target;
        },
        
        /** @static */
        isFunction: function( obj ) {
            return toString.call(obj) === "[object Function]";
        },

        /** @static */
        isArray: function( obj ) {
            return toString.call(obj) === "[object Array]";
        },

        /** @static */
        isPlainObject: function( obj ) {
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if ( !obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval ) {
                return false;
            }

            // Not own constructor property must be Object
            if ( obj.constructor &&
                !hasOwn.call(obj, "constructor") &&
                !hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
                return false;
            }

            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.

            var key;
            for ( key in obj ) {}

            return key === undefined || hasOwn.call( obj, key );
        },

        /** @static */
        isEmptyObject: function( obj ) {
            for ( var name in obj ) {
                return false;
            }
            return true;
        },
        
        /** @static */
        isXmlDocument: function(obj) {
            return toString.call(obj) === "[object Document]";
        },
        
        /**
        This function is used to determine whether an object contains the specified names
        as specified by arguments beyond and including index 1.  For instance, if you wanted 
        to check whether object 'foo' contained the member 'name' then you would simply call
        COG.contains(foo, 'name'). 
        
        @static
        */
        contains: function(obj, members) {
            var fnresult = obj;
            var memberArray = arguments;
            var startIndex = 1;
            
            // if the second argument has been passed in, and it is an array use that instead of the arguments array
            if (members && module.isArray(members)) {
                memberArray = members;
                startIndex = 0;
            } // if
            
            // iterate through the arguments specified after the object, and check that they exist in the 
            for (var ii = startIndex; ii < memberArray; ii++) {
                fnresult = fnresult && (typeof foo[memberArray[ii]] !== 'undefined');
            } // for
            
            return fnresult;
        },
        
        /** @static */
        newModule: function(params) {
            params = module.extend({
                id: null,
                requires: [],
                parent: null
            }, params);
            
            // TODO: if parent is not assigned, then assign the default root module
            
            if (params.parent) {
                params = module.extend({}, params.parent, params);
            } // if
            
            return params;
        },
        
        toID: function(text) {
            return text.replace(/\s/g, "-");
        },
        
        /** @static */
        objId: function(prefix) {
            return (prefix ? prefix : "obj") + objectCounter++;
        },
        
        // TODO: rewrite implementation of this
        formatStr: function(text) {
            //check if there are two arguments in the arguments list
            if ( arguments.length <= 1 )
            {
                //if there are not 2 or more arguments there's nothing to replace
                //just return the original text
                return text;
            }
            //decrement to move to the second argument in the array
            var tokenCount = arguments.length - 2;
            for( var token = 0; token <= tokenCount; token++ )
            {
                //iterate through the tokens and replace their placeholders from the original text in order
                text = text.replace( new RegExp( "\\{" + token + "\\}", "gi" ),
                                                        arguments[ token + 1 ] );
            }
            return text;
        },
        
        wordExists: function(stringToCheck, word) {
            var testString = "";

            // if the word argument is an object, and can be converted to a string, then do so
            if (word.toString) {
                word = word.toString();
            } // if

            // iterate through the string and test escape special characters
            for (var ii = 0; ii < word.length; ii++) {
                testString += (! (/\w/).test(word[ii])) ? "\\" + word[ii] : word[ii];
            } // for

            var regex = new RegExp("(^|\\s|\\,)" + testString + "(\\,|\\s|$)", "i");

            return regex.test(stringToCheck);
        },
        
        /* some simple template parsing */
        
        parseTemplate: function(templateHtml, data) {
            // look for template variables in the html
            var matches = REGEX_TEMPLATE_VAR.exec(templateHtml);
            while (matches) {
                // remove the variable from the text
                templateHtml = templateHtml.replace(matches[0], COG.XPath.first(matches[1], data));

                // find the next match
                REGEX_TEMPLATE_VAR.lastIndex = 0;
                matches = REGEX_TEMPLATE_VAR.exec(templateHtml);
            } // while

            return templateHtml;
        }
    }; // module definition
    
    return module;
})();

COG.Log = (function() {
    var listeners = [];
    var jsonAvailable = (typeof JSON !== 'undefined'),
        traceAvailable = window.console && window.console.markTimeline;
    
    function writeEntry(level, entryDetails) {
        // initialise variables
        var ii;
        var message = entryDetails && (entryDetails.length > 0) ? entryDetails[0] : "";
        
        // iterate through the remaining arguments and append them as required
        for (ii = 1; entryDetails && (ii < entryDetails.length); ii++) {
            message += " " + (jsonAvailable && COG.isPlainObject(entryDetails[ii]) ? JSON.stringify(entryDetails[ii]) : entryDetails[ii]);
        } // for
        
        if (typeof console !== 'undefined') {
            console[level](message);
        } // if
        
        // if we have listeners, then tell them about the event
        for (ii = 0; ii < listeners.length; ii++) {
            listeners[ii].call(module, message, level);
        } // for
    } // writeEntry
    
    // define the module
    var module = {
        id: "grunt.log",
        
        /* logging functions */
        
        getTraceTicks: function() {
            return traceAvailable ? new Date().getTime() : null;
        },
        
        trace: function(message, startTicks) {
            if (traceAvailable) {
                console.markTimeline(message + (startTicks ? ": " + (module.getTraceTicks() - startTicks) + "ms" : ""));
            } // if
        },
        
        debug: function(message) {
            writeEntry("debug", arguments);
        },
        
        info: function(message) {
            writeEntry("info", arguments);
        },

        warn: function(message) {
            writeEntry("warn", arguments);
        },

        error: function(message) {
            writeEntry("error", arguments);
        },
        
        exception: function(error) {
            module.error(arguments);
            
            // iterate through the keys of the error and add them as info sections
            // TODO: make this targeted at the stack, etc
            for (var keyname in error) {
                module.info("ERROR DETAIL: " + keyname + ": " + error[keyname]);
            } // for
        },
        
        /* error monitoring, exception raising functions */
        
        watch: function(sectionDesc, callback) {
            try {
                callback();
            }
            catch (e) {
                module.exception(e, sectionDesc);
            } // try..catch
        },
        
        throwError: function(errorMsg) {
            // log the error
            module.error(errorMsg);
            throw new Error(errorMsg);
        },
        
        /* event handler functions */
        
        requestUpdates: function(callback) {
            listeners.push(callback);
        }
    };
    
    return module;
})();

(function() {
    // initilialise local variables
    var configurables = {};
    
    /* internal functions */

    function attachHelper(target, helperName) {
        // if the helper is not defined, then attach
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
        target.gtConfId = COG.objId("configurable");
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

        // if the target doesn't yet have a configurable settings member, then add it
        if (! target.gtConfId) {
            initSettings(target);
        } // if

        var ii,
            targetId = target.gtConfId,
            targetSettings = getSettings(target),
            targetCallbacks = getConfigCallbacks(target);

        // update the configurables
        // this is a which gets the last object in an extension chain in
        // the configurables list, so make sure you extend before you make
        // an object configurable, otherwise things will get a bit wierd.
        configurables[targetId] = target;

        // add the callback to the list
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
(function() {
    function getHandlers(target) {
        return target.gtObsHandlers;
    } // getHandlers
    
    function getHandlersForName(target, eventName) {
        var handlers = getHandlers(target);
        if (! handlers[eventName]) {
            handlers[eventName] = [];
        } // if

        return handlers[eventName];
    } // getHandlersForName
    
    COG.observable = function(target) {
        if (! target) { return; }

        /* initialization code */

        // check that the target has handlers 
        if (! getHandlers(target)) {
            target.gtObsHandlers = {};
        } // if

        var attached = target.bind || target.trigger || target.unbind;
        if (! attached) {
            target.bind = function(eventName, callback) {
                var callbackId = COG.objId("callback");
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
                        tickCount: new Date().getTime()
                    },
                    eventArgs;

                // check that we have callbacks
                if (! eventCallbacks) {
                    return null;
                } // if
                
                eventArgs = Array.prototype.slice.call(arguments, 1);
                eventArgs.unshift(evt);

                for (var ii = eventCallbacks.length; ii-- && (! evt.cancel); ) {
                    eventCallbacks[ii].fn.apply(self, eventArgs);
                } // for

                return evt;
            }; // trigger

            target.unbind = function(eventName, callbackId) {
                var eventCallbacks = getHandlersForName(target, eventName);
                for (var ii = 0; eventCallbacks && (ii < eventCallbacks.length); ii++) {
                    if (eventCallbacks[ii].id === callbackId) {
                        eventCallbacks.splice(ii, 1);
                        break;
                    } // if
                } // for

                return target;
            }; // unbind
        } // if
    };
})();

// TODO: add functionality that allows you to stop listening to messages
(function() {
    // initialise variables
    var messageListeners = {},
        pipes = [];
    
    // define the module
    COG.addPipe = function(callback) {
        // test the pipe because if it is broke it will break everything
        callback("pipe.test", {});
        
        // given that didn't throw an exception and we got here, we can now add the pipe
        pipes.push(callback);
    }; // addPipe
    
    COG.listen = function(message, callback) {
        // if we don't have a message listener array configured, then create one now
        if (! messageListeners[message]) {
            messageListeners[message] = [];
        } // if
        
        // add the callback to the listener queue
        if (callback) {
            messageListeners[message].push(callback);
        } // if
    }; // listen
        
    COG.say = function(message, args) {
        var ii;
        
        // if there are pipes, then send the message through each
        for (ii = pipes.length; ii--; ) {
            pipes[ii](message, args);
        } // for
        
        // if we don't have any message listeners for that message, then return
        if (! messageListeners[message]) { return; }
        
        // iterate through the message callbacks
        for (ii = messageListeners[message].length; ii--; ) {
            messageListeners[message][ii](args);
        } // for
    }; // say
})();

/**
COG.Loopage
----------

This module implements a control loop that can be used to centralize
jobs draw loops, animation calculations, partial calculations for COG.Job 
instances, etc.
*/
COG.Loopage = (function() {
    // initialise some defaults (to once per minute)
    var MIN_SLEEP = 60 * 1000;
    
    // initialise variables
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
        // create the worker
        var worker = new LoopWorker(params);
        if (worker.after > 0) {
            worker.lastTick = new Date().getTime() + worker.after;
        } // if
        
        // make the worker observable
        COG.observable(worker);
        worker.bind('complete', function() {
            leaveLoop(worker.id);
        });
        
        // add the worker to the array
        workers.unshift(worker);
        reschedule();
        
        // return the newly created worker
        return worker;
    } // joinLoop
    
    function leaveLoop(workerId) {
        removalQueue.push(workerId);
        reschedule();
    } // leaveLoop
    
    function reschedule() {
        // if the loop is not running, then set it running
        if (loopTimeout) {
            clearTimeout(loopTimeout);
        } // if
        
        // reschedule the loop
        loopTimeout = setTimeout(runLoop, 0);
        
        // return the newly created worker
        recalcSleepFrequency = true;
    } // reschedule
    
    function runLoop() {
        // get the current tick count
        var ii,
            tickCount = new Date().getTime(),
            workerCount = workers.length;
    
        // iterate through removal queue
        while (removalQueue.length > 0) {
            var workerId = removalQueue.shift();
        
            // look for the worker and remove it
            for (ii = workerCount; ii--; ) {
                if (workers[ii].id === workerId) {
                    workers.splice(ii, 1);
                    break;
                } // if
            } // for
        
            recalcSleepFrequency = true;
            workerCount = workers.length;
        } // while
    
        // if the sleep frequency needs to be calculated then do that now
        if (recalcSleepFrequency) {
            sleepFrequency = MIN_SLEEP;
            for (ii = workerCount; ii--; ) {
                sleepFrequency = workers[ii].frequency < sleepFrequency ? workers[ii].frequency : sleepFrequency;
            } // for
        } // if
    
        // iterate through the workers and run
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
    
        // update the loop timeout
        loopTimeout = workerCount ? setTimeout(runLoop, sleepFrequency) : 0;
    } // runLoop
    
    var module = {
        join: joinLoop,
        leave: leaveLoop
    };
    
    return module;
})();
/*
    http://www.JSON.org/json2.js
    2010-03-20

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

(function() {
    
    function determineObjectMapping(line) {
        // if the line is empty, then return null
        if (! line) {
            return null;
        } // if
        
        // split the line on the pipe character
        var fields = line.split("|");
        var objectMapping = {};
        
        // iterate through the fields and initialise the object mapping
        for (var ii = 0; ii < fields.length; ii++) {
            objectMapping[fields[ii]] = ii;
        } // for
        
        return objectMapping;
    } // determineObjectMapping
    
    function mapLineToObject(line, mapping) {
        // split the line on the pipe character
        var fields = line.split("|");
        var objectData = {};
        
        // iterate through the mapping and pick up the fields and assign them to the object
        for (var fieldName in mapping) {
            var fieldIndex = mapping[fieldName];
            objectData[fieldName] = fields.length > fieldIndex ? fields[fieldIndex] : null;
        } // for
        
        return objectData;
    } // mapLineToObject
    
    function parsePDON(data) {
        // initialise variables
        var objectMapping = null;
        var results = [];

        // split the data on line breaks
        var lines = data.split("\n");
        for (var ii = 0; ii < lines.length; ii++) {
            // TODO: remove leading and trailing whitespace
            var lineData = lines[ii];

            // if the object mapping hasn't been initialised, then initialise it
            if (! objectMapping) {
                objectMapping = determineObjectMapping(lineData);
            }
            // otherwise create an object from the object mapping
            else {
                results.push(mapLineToObject(lineData, objectMapping));
            } // if..else
        } // for

        return results;
    } // parsePDON
    
    // define the supported formats
    var supportedFormats = {
        JSON: {
            parse: function(data) {
                return JSON.parse(data);
            }
        },
        
        PDON: {
            parse: function(data) {
                return parsePDON(data);
            }
        }
    }; // supportedFormats
    
    // define the module
    COG.parseData = function(data, format) {
        format = format ? format.toUpperCase() : "JSON";
        
        // check that the format is supported, if not raise an exception
        if (! supportedFormats[format]) {
            throw new Error("Unsupported data format: " + format);
        } // if
        
        try {
            return supportedFormats[format].parse(data);
        } 
        catch (e) {
            COG.Log.exception(e);
        } // try..catch
        
        return {};
    }; // parseData
})();

COG.XPath = (function() {
    var xpathEnabled = typeof XPathResult !== 'undefined';
    var nsResolvers = [];
    
    // defne a set of match handlers that are invoked for the various different type of xpath match results
    var MATCH_HANDLERS = [
        // 0: ANY_TYPE
        null, 
        
        // 1: NUMBER_TYPE
        function(match) {
            return match.numberValue;
        },
        
        // 2: STRING_TYPE
        function(match) {
            return match.stringValue;
        },
        
        // 3: BOOLEAN_TYPE
        function(match) {
            return match.booleanValue;
        },
        
        // 4: UNORDERED_NODE_ITERATOR_TYPE
        null,
        
        // 5: ORDERED_NODE_ITERATOR_TYPE
        null,
        
        // 6: UNORDERED_NODE_SNAPSHOT_TYPE
        null,
        
        // 7: ORDERED_NODE_SNAPSHOT_TYPE
        null,
        
        // 8: ANY_UNORDERED_NODE_TYPE
        function(match) {
            return match.singleNodeValue ? match.singleNodeValue.textContent : null;
        },
        
        // 9: FIRST_ORDERED_NODE_TYPE
        function(match) {
            return match.singleNodeValue ? match.singleNodeValue.textContent : null;
        }
    ];
    
    function namespaceResolver(prefix) {
        var namespace = null;
        
        // iterate through the registered resolvers and give them the opportunity to provide a namespace
        for (var ii = 0; ii < nsResolvers.length; ii++) {
            namespace = nsResolvers[ii](prefix);
            
            // if the namespace has been defined, by this resolver then break from the loop
            if (namespace) { break; }
        } // for
        
        return namespace;
    } // namespaceResolver
    
    // if xpath is not enabled, then throw a warning
    if (! xpathEnabled) {
        COG.Log.warn("No XPATH support");
    } // if
    
    function xpath(expression, context, resultType) {
        // if the result type is not specified, then use any type
        if (! resultType) {
            resultType = XPathResult.ANY_TYPE;
        } // if
        
        try {
            // if the context node is not xml, then return null and raise a warning
            if (! COG.isXmlDocument(context)) {
                COG.Log.warn("attempted xpath expression: " + expression + " on a non-xml document");
                return null;
            } // if
            
            // return the value of the expression
            return context.evaluate(expression, context, namespaceResolver, resultType, null);
        } 
        catch (e) {
            COG.Log.warn("invalid xpath expression: " + expression + " on node: " + context);
            return null;
        } // try..catch
    } // xpath
    
    // define the module
    var module = {
        SearchResult: function(matches) {
            // initialise self
            var self = {
                
                toString: function() {
                    var result = null;
                    
                    if (matches) {
                        var matchHandler = null;
                        if ((matches.resultType >= 0) && (matches.resultType < MATCH_HANDLERS.length)) {
                            matchHandler = MATCH_HANDLERS[matches.resultType];
                        } // if
                        
                        // if we have a match handler, then call it
                        if (matchHandler) {
                            // COG.Log.info("invoking match handler for result type: " + matches.resultType);
                            result = matchHandler(matches);
                        }
                    } // if
                    
                    return result ? result : "";
                }
            };
            
            return self;
        },
        
        first: function(expression, node) {
            return new module.SearchResult(xpath(expression, node, XPathResult.FIRST_ORDERED_NODE_TYPE));
        },
        
        registerResolver: function(callback) {
            nsResolvers.push(callback);
        }
    };
    
    return module;
})();

COG.Storage = (function() {
    function getStorageScope(scope) {
        if (scope && (scope == "session")) {
            return sessionStorage;
        } // if
        
        return localStorage;
    } // getStorageTarget

    return {
        get: function(key, scope) {
            // get the storage target
            var value = getStorageScope(scope).getItem(key);
            
            // if the value looks like serialized JSON, parse it
            return (/^(\{|\[).*(\}|\])$/).test(value) ? JSON.parse(value) : value;
        },
        
        set: function(key, value, scope) {
            // if the value is an object, the stringify using JSON
            var serializable = jQuery.isArray(value) || jQuery.isPlainObject(value);
            var storeValue = serializable ? JSON.stringify(value) : value;
            
            // save the value
            getStorageScope(scope).setItem(key, storeValue);
        },
        
        remove: function(key, scope) {
            getStorageScope(scope).removeItem(key);
        }
    };
})();
COG.ParseRules = function(params) {
    var rules = [];
    
    var self = {
        add: function(regex, handler) {
            rules.push({
                regex: regex,
                handler: handler
            });
        },
        
        each: function(input, outputReceiver, allCompleteCallback) {
            var completionCounter = 0;
            
            function incCounter() {
                completionCounter++;
                if (allCompleteCallback && (completionCounter >= rules.length)) {
                    allCompleteCallback(outputReceiver);
                } // if
            } // incCounter
            
            for (var ii = 0; ii < rules.length; ii++) {
                var regex = rules[ii].regex,
                    handler = rules[ii].handler,
                    handled = false;
                
                if (regex) {
                    regex.lastIndex = -1;
                    
                    var matches = regex.exec(input);
                    if (matches && handler) {
                        handled = true;
                        if (handler(matches, outputReceiver, incCounter)) {
                            incCounter();
                        } // if
                    } // if
                } // if
                
                if (! handled) {
                    incCounter();
                } // if
            }
        }
    };
    
    return self;
}; // ParseRules
/** @namespace 

The XHR namespace provides functionality for issuing AJAX requests in a similar style 
to the way jQuery does.  Why build a replacement for jQuery's ajax functionality you ask 
(and a fair question, I might add)?  Basically, because I was writing a library that I 
didn't want to have to rely on the presence of jQuery especially when the internals of the
way AJAX is handled changed between version 1.3.2 and 1.4.2. While not a big deal for 
end users of jQuery it became a problem when you wanted to implement a replacement XHR 
object.  So what does GRUNT XHR provide then?

TODO: add information here...
*/
(function() {
    // define some content types
    var CONTENT_TYPES = {
        HTML: "text/html",
        XML: "text/xml",
        TEXT: "text/plain",
        STREAM: "application/octet-stream"
    };

    // define some regular expressions to help determine the type of the request
    var REQUEST_URL_EXTENSIONS = {
        JSON: ['json'],
        PDON: ['pdon.txt']
    };
    
    var INDERMINATE_CONTENT_TYPES = ["TEXT", "STREAM"];
    
    // initialise some regexes
    var REGEX_URL = /^(\w+:)?\/\/([^\/?#]+)/;

    // define the variable content type processors
    var RESPONSE_TYPE_PROCESSORS = {
        XML: function(xhr, requestParams) {
            return xhr.responseXML;
        },
        
        JSON: function(xhr, requestParams) {
            return COG.parseData(xhr.responseText);
        },
        
        PDON: function(xhr, requestParams) {
            return COG.parseData(xhr.responseText, "PDON");
        },
        
        DEFAULT: function(xhr, requestParam) {
            return xhr.responseText;
        }
    }; // CONTENT_TYPE_PROCESSORS
    
    // define headers
    var HEADERS = {
        CONTENT_TYPE: "Content-Type"
    };
    
    /**
    This function is used to determine the appropriate request type based on the extension 
    of the url that was originally requested.  This function is only called in the case where
    an indeterminate type of content-type has been received from the server that has supplied the 
    response (such as application/octet-stream).  
    
    @private
    @param {XMLHttpRequest } xhr the XMLHttpRequest object
    @param requestParams the parameters that were passed to the xhr request
    @param fallbackType the type of request that we will fallback to 
    */
    function getProcessorForRequestUrl(xhr, requestParams, fallbackType) {
        for (var requestType in REQUEST_URL_EXTENSIONS) {
            // iterate through the file extensions
            for (var ii = 0; ii < REQUEST_URL_EXTENSIONS[requestType].length; ii++) {
                var fileExt = REQUEST_URL_EXTENSIONS[requestType][ii];

                // if the request url ends with the specified file extension we have a match
                if (new RegExp(fileExt + "$", "i").test(requestParams.url)) {
                    return requestType;
                } // if
            } // for
        } // for
        
        return fallbackType ? fallbackType : "DEFAULT";
    } // getProcessorForRequestUrl
    
    function requestOK(xhr, requestParams) {
        return ((! xhr.status) && (location.protocol === "file:")) ||
            (xhr.status >= 200 && xhr.status < 300) || 
            (xhr.status === 304) || 
            (xhr.status === 1223) || 
            (xhr.status === 0);
    } // getStatus
    
    function param(data) {
        // iterate through the members of the data and convert to a paramstring
        var params = [];
        var addKeyVal = function (key, value) {
            // If value is a function, invoke it and return its value
            value = COG.isFunction(value) ? value() : value;
            params[ params.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
        };

        // If an array was passed in, assume that it is an array of form elements.
        if (COG.isArray(data)) {
            for (var ii = 0; ii < data.length; ii++) {
                addKeyVal(data[ii].name, data[ii].value);
            } // for
        }
        else {
            for (var keyname in data) {
                addKeyVal(keyname, data[keyname]);
            } // for
        } // if..else

        // Return the resulting serialization
        return params.join("&").replace(/%20/g, "+");
    } // param
    
    function processResponseData(xhr, requestParams) {
        // get the content type of the response
        var contentType = xhr.getResponseHeader(HEADERS.CONTENT_TYPE),
            processorId,
            matchedType = false;
        
        // COG.Log.info("processing response data, content type = " + contentType);
        
        // determine the matching content type
        for (processorId in CONTENT_TYPES) {
            if (contentType && (contentType.indexOf(CONTENT_TYPES[processorId]) >= 0)) {
                matchedType = true;
                break;
            }
        } // for
        
        // if the match type was indeterminate, then look at the url of the request to
        // determine which is the best type to match on
        var indeterminate = (! matchedType);
        for (var ii = 0; ii < INDERMINATE_CONTENT_TYPES.length; ii++) {
            indeterminate = indeterminate || (INDERMINATE_CONTENT_TYPES[ii] == processorId);
        } // for
        
        if (indeterminate) {
            processorId = getProcessorForRequestUrl(xhr, requestParams, processorId);
        } // if
        
        try {
            // COG.Log.info("using processor: " + processorId + " to process response");
            return RESPONSE_TYPE_PROCESSORS[processorId](xhr, requestParams);
        }
        catch (e) {
            // COG.Log.warn("error applying processor '" + processorId + "' to response type, falling back to default");
            return RESPONSE_TYPE_PROCESSORS.DEFAULT(xhr, requestParams);
        } // try..catch
    } // processResponseData
    
    COG.xhr = function(params) {
        
        function handleReadyStateChange() {
            if (this.readyState === 4) {
                var responseData = null,
                    success = requestOK(this, params);

                try {
                    // get and check the status
                    if (success) {
                        // process the response
                        if (params.handleResponse) {
                            params.handleResponse(this);
                        }
                        else {
                            responseData = processResponseData(this, params);
                        }
                    }
                    else if (params.error) {
                        params.error(this);
                    } // if..else
                }
                catch (e) {
                    COG.Log.exception(e, "PROCESSING AJAX RESPONSE");
                } // try..catch

                // if the success callback is defined, then call it
                // COG.Log.info("received response, calling success handler: " + params.success);
                if (success && responseData && params.success) {
                    params.success.call(this, responseData);
                } // if
            } // if
        } // handleReadyStateChange
        
        // given that I am having to write my own AJAX handling, I think it's safe to assume that I should
        // do that in the context of a try catch statement to catch the things that are going to go wrong...
        try {
            params = COG.extend({
                method: "GET",
                data: null,
                url: null,
                async: true,
                success: null,
                handleResponse: null,
                error: null,
                contentType: "application/x-www-form-urlencoded"
            }, params);
            
            // determine if this is a remote request (as per the jQuery ajax calls)
            var parts = REGEX_URL.exec(params.url),
                remote = parts && (parts[1] && parts[1] !== location.protocol || parts[2] !== location.host);                
            
            // if we have data, then update the method to POST
            if (params.data) {
                params.method = "POST";
            } // if

            // if the url is empty, then log an error
            if (! params.url) {
                COG.Log.warn("ajax request issued with no url - that ain't going to work...");
                return;
            } // if
            
            // if the we have an xhr creator registered, then let it decide whether it wants to create the client
            var xhr = null;
            if (params.xhr) {
                xhr = params.xhr(params);
            } // if
            
            // if the optional creator, didn't create the client, then create the default client
            if (! xhr) {
                xhr = new XMLHttpRequest();
            } // if

            // COG.Log.info("opening request: " + JSON.stringify(params));

            // open the request
            // TODO: support basic authentication
            xhr.open(params.method, params.url, params.async);

            // if we are sending data, then set the correct content type
            if (params.data) {
                xhr.setRequestHeader("Content-Type", params.contentType);
            } // if
            
            // if this is not a remote request, the set the requested with header
            if (! remote) {
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            } // if
            
            xhr.onreadystatechange = handleReadyStateChange;

            // send the request
            // COG.Log.info("sending request with data: " + param(params.data));
            xhr.send(params.method == "POST" ? param(params.data) : null);
        } 
        catch (e) {
            COG.Log.exception(e);
        } // try..catch                    
    }; // COG.xhr
})();

/** @namespace 

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
    
    function prepAndLoad(url, callback, callbackParam) {
        // apply either a ? or & to the url depending on whether we already have query params
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
    } // jsonp
    
    COG.jsonp = prepAndLoad;
}());COG.Touch = (function() {
    // initialise constants
    var MAX_TOUCHES = 10,
        WHEEL_DELTA_STEP = 120,
        DEFAULT_INERTIA_MAX = 500,
        INERTIA_TIMEOUT_MOUSE = 100,
        INERTIA_TIMEOUT_TOUCH = 250,
        THRESHOLD_DOUBLETAP = 300,
        THRESHOLD_PINCHZOOM = 5;
        
    // define the touch modes
    var TOUCH_MODE_TAP = 0,
        TOUCH_MODE_MOVE = 1,
        TOUCH_MODE_PINCH = 2;

    // TODO: configure the move distance to be screen size sensitive....
    var MIN_MOVEDIST = 7;

    var elementCounter = 0,
        listenerCount = 0,
        supportsTouch = undefined;
        
    function calcDiff(v1, v2) {
        return {
            x: v1.x - v2.x, 
            y: v1.y - v2.y
        };
    } // calcDiff
    
    function calcDistance(v1, v2) {
        var distV = calcDiff(v1, v2);
            
        return Math.sqrt(distV.x * distV.x + distV.y * distV.y);
    } // calcDistance
        
    function touchDistance(touchData) {
        if (touchData.count > 1) {
            return calcDistance(
                touchData.touches[0],
                touchData.touches[1]);
        } // if
        
        return 0;
    } // calcDistance
    
    function calcChange(first, second) {
        var srcVector = (first && (first.count > 0)) ? first.touches[0] : null;
        if (srcVector && second && (second.count > 0)) {
            return calcDiff(srcVector, second.touches[0]);
        } // if
        
        return null;
    } // calcChange
    
    function copyTouchData(dst, src) {
        dst.count = src.count;
        
        for (var ii = MAX_TOUCHES; ii--; ) {
            dst.touches[ii].x = src.touches[ii].x;
            dst.touches[ii].y = src.touches[ii].y;
        } // for
    } // copyTouchData
    
    function initTouchData() {
        // initialise some empty touch data
        var touchData = {
            count: 0,
            touches: new Array(MAX_TOUCHES)
        }; 
        
        // create ten touch points
        for (var ii = MAX_TOUCHES; ii--; ) {
            touchData.touches[ii] = createPoint();
        } // for
        
        return touchData;
    } // initTouchData
    
    function preventDefault(evt) {
        if (evt.preventDefault) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        else if (evt.cancelBubble) {
            evt.cancelBubble();
        } // if..else
    } // preventDefault
    
    function fillTouchData(touchData, evt, evtProp) {
        if (supportsTouch) {
            var touches = evt[evtProp ? evtProp : 'touches'],
                touchCount = touches.length;
            
            touchData.count = touchCount;
            for (var ii = touchCount; ii--; ) {
                touchData.touches[ii].x = touches[ii].pageX;
                touchData.touches[ii].y = touches[ii].pageY;
            } // for
        }
        else if (evt.button === 0) {
            touchData.count = 1;
            touchData.touches[0].x = evt.pageX ? evt.pageX : evt.screenX;
            touchData.touches[0].y = evt.pageY ? evt.pageY : evt.screenY;
        }
        else {
            touchData.count = 0;
        } // if//else
    } // fillTouchPoints
    
    // used to return a composite xy value compatible with a T5.Vector
    function createPoint(x, y) {
        return {
            x: x ? x : 0,
            y: y ? y : 0
        };
    } // createPoint
    
    /* touch helper */
    
    var TouchHelper =  function(params) {
        params = COG.extend({
            element: null,
            observable: null,
            inertiaTrigger: 20,
            maxDistDoubleTap: 20,
            touchStartHandler: null,
            moveHandler: null,
            moveEndHandler: null,
            pinchZoomHandler: null,
            pinchZoomEndHandler: null,
            tapHandler: null,
            doubleTapHandler: null,
            wheelZoomHandler: null
        }, params);

        /*
        // determine whether touch is supported
        // nice work to thomas fuchs on this:
        // http://mir.aculo.us/2010/06/04/making-an-ipad-html5-app-making-it-really-fast/
        var touchReady = 'createTouch' in document;
        */

        // initialise private members
        var doubleTap = false,
            tapTimer = 0,
            config = T5.getConfig(),
            touchesStart = initTouchData(),
            touchesCurrent = initTouchData(),
            touchesLast = initTouchData(),
            touchesEnd = initTouchData(),
            touchDelta = null,
            totalDelta = createPoint(),
            panDelta = createPoint(),
            touchMode = null,
            touchDown = false,
            touchStartTick = 0,
            listeners = [],
            lastXY = createPoint(),
            inertia = false,
            inertiaDuration,
            inertiaMaxDist,
            ticksCurrent = 0,
            ticksLast = 0,
            targetElement = params.element,
            observable = params.observable,
            aggressiveCapture = typeof FlashCanvas !== 'undefined',
            BENCHMARK_INTERVAL = 300;
            
        function calculateInertia(upXY, currentXY, distance, tickDiff) {
            var theta = Math.asin((upXY.y - currentXY.y) / distance),
                // TODO: remove the magic numbers from here (pass through animation time from view, and determine max from dimensions)
                extraDistance = distance * (inertiaDuration / tickDiff) >> 0;
                
            // ensure that the extra distance does not exist the max distance
            extraDistance = extraDistance > inertiaMaxDist ? inertiaMaxDist : extraDistance;
                
            // calculate theta
            theta = currentXY.x > upXY.x ? theta : Math.PI - theta;
            
            // trigger the pan event
            triggerEvent(
                "pan",
                Math.cos(theta) * -extraDistance,
                Math.sin(theta) * extraDistance,
                true);
        } // calculateInertia
        
        function checkInertia(upXY, currentTick) {
            var tickDiff, distance;
            
            if (! supportsTouch) {
                lastXY.x = upXY.x;
                lastXY.y = upXY.y;
                
                COG.Loopage.join({
                    execute: function(tickCount, worker) {
                        tickDiff = tickCount - currentTick;
                        
                        // calculate the distance from the upXY (which doesn't change) and the
                        // lastXY (which changes as the mouse continues to move) if we move over
                        // a certain distance then trigger the intertia
                        distance = calcDistance(upXY, lastXY);

                        // calculate the inertia
                        if ((tickDiff < INERTIA_TIMEOUT_MOUSE) && (distance > params.inertiaTrigger)) {
                            worker.trigger('complete');
                            calculateInertia(upXY, lastXY, distance, tickDiff);
                        }
                        else if (tickDiff > INERTIA_TIMEOUT_MOUSE) {
                            worker.trigger('complete');
                        } // if..else
                    },
                    frequency: 10
                });
            }
            else {
                tickDiff = currentTick - touchStartTick;
                
                if ((tickDiff < INERTIA_TIMEOUT_TOUCH)) {
                    distance = calcDistance(touchesStart.touches[0], upXY);
                    
                    if (distance > params.inertiaTrigger) {
                        calculateInertia(touchesStart.touches[0], upXY, distance, tickDiff);
                    } // if
                } // if
            } // if..else                
        } // checkInertia
        
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
            
            return createPoint(calcLeft, calcTop);
        } // getOffset
            
        function relativeTouches(touchData) {
            var touchCount = touchData.count,
                fnresult = new Array(touchCount),
                elementOffset = getOffset(targetElement);
            
            // apply the offset
            for (var ii = touchCount; ii--; ) {
                fnresult[ii] = createPoint(
                    touchData.touches[ii].x - elementOffset.x, 
                    touchData.touches[ii].y - elementOffset.y);
            } // for
            
            return fnresult;
        } // relativeTouches
        
        function triggerEvent() {
            // COG.Log.info("triggering event: " + arguments[0]);
            if (observable) {
                observable.trigger.apply(null, arguments);
            } // if
        } // triggerEvent
        
        function triggerPositionEvent(eventName, absVector) {
            var offsetVector = getOffset(targetElement),
                relativeVector = createPoint(
                    absVector.x - offsetVector.x,
                    absVector.y - offsetVector.y);
            
            // fire the event
            triggerEvent(eventName, absVector, relativeVector);
        } // triggerPositionEvent
        
        function touchStart(evt) {
            var targ = evt.target ? evt.target : evt.srcElement;
            
            if (aggressiveCapture || targ && (targ === targetElement)) {
                fillTouchData(touchesStart, evt);
                if (touchesStart.count === 0) {
                    return;
                } // if
                
                // reset the touch and total vectors
                touchDelta = null;
                totalDelta.x = 0;
                totalDelta.y = 0;
                
                touchDown = true;
                doubleTap = false;
                touchStartTick = new Date().getTime();

                // cancel event propogation
                preventDefault(evt);
                targ.style.cursor = 'move';

                // trigger the inertia cancel event
                triggerEvent("inertiaCancel");

                // log the current touch start time
                ticksCurrent = touchStartTick;
        
                // fire the touch start event handler
                var touchVector = touchesStart.count > 0 ? touchesStart.touches[0] : null;
        
                // if we don't have a touch vector, then log a warning, and exit
                if (! touchVector) {
                    COG.Log.warn("Touch start fired, but no touch vector found");
                    return;
                } // if
        
                // fire the touch start handler
                triggerEvent("touchStart", touchVector.x, touchVector.y);
        
                // check to see whether this is a double tap (if we are watching for them)
                if (ticksCurrent - ticksLast < THRESHOLD_DOUBLETAP) {
                    // calculate the difference between this and the last touch point
                    var touchChange = calcDiff(touchesStart.touches[0], touchesLast.touches[0]);
                    if (touchChange && (Math.abs(touchChange.x) < params.maxDistDoubleTap) && (Math.abs(touchChange.y) < params.maxDistDoubleTap)) {
                        doubleTap = true;
                    } // if
                } // if

                // reset the touch mode to unknown
                touchMode = TOUCH_MODE_TAP;
        
                // update the last touches
                copyTouchData(touchesLast, touchesStart);
            } // if
        } // touchStart
        
        function touchMove(evt) {
            var targ = evt.target ? evt.target : evt.srcElement,
                zoomDistance = 0;
            
            if (aggressiveCapture || targ && (targ === targetElement)) {
                // fill the touch data
                fillTouchData(touchesCurrent, evt);
                
                // update the last xy
                if (touchesCurrent.count > 0) {
                    lastXY.x = touchesCurrent.touches[0].x;
                    lastXY.y = touchesCurrent.touches[0].y;
                } // if
                
                if (! touchDown) { return; }

                // cancel event propogation
                if (supportsTouch) {
                    preventDefault(evt);
                } // if

                // check to see if we are pinching or zooming
                if (touchesCurrent.count > 1) {
                    // if the start touches does have two touch points, then reset to the current
                    if (touchesStart.count === 1) {
                        copyTouchData(touchesStart, touchesCurrent);
                    } // if

                    zoomDistance = touchDistance(touchesStart) - touchDistance(touchesCurrent);
                } // if

                // if the touch mode is tap, then check to see if we have gone beyond a move threshhold
                if (touchMode === TOUCH_MODE_TAP) {
                    // get the delta between the first touch and the current touch
                    var tapDelta = calcChange(touchesCurrent, touchesStart);

                    // if the delta.x or delta.y is greater than the move threshhold, we are no longer moving
                    if (tapDelta && ((Math.abs(tapDelta.x) >= MIN_MOVEDIST) || (Math.abs(tapDelta.y) >= MIN_MOVEDIST))) {
                        touchMode = TOUCH_MODE_MOVE;
                    } // if
                } // if


                // if we aren't in tap mode, then let's see what we should do
                if (touchMode !== TOUCH_MODE_TAP) {
                    // TODO: queue touch count history to enable an informed decision on touch end whether
                    // a single or multitouch event is completing...

                    // if we aren't pinching or zooming then do the move 
                    if ((! zoomDistance) || (Math.abs(zoomDistance) < THRESHOLD_PINCHZOOM)) {
                        // calculate the pan delta
                        touchDelta = calcChange(touchesCurrent, touchesLast);

                        // update the total delta
                        if (touchDelta) {
                            totalDelta.x -= touchDelta.x; totalDelta.y -= touchDelta.y;
                            panDelta.x -= touchDelta.x; panDelta.y -= touchDelta.y;
                        } // if

                        // trigger the pan event
                        triggerEvent("pan", panDelta.x, panDelta.y);
                        
                        // reset the pan vector
                        panDelta.x = 0;
                        panDelta.y = 0;

                        // set the touch mode to move
                        touchMode = TOUCH_MODE_MOVE;
                    }
                    else {
                        triggerEvent('pinchZoom', relativeTouches(touchesStart), relativeTouches(touchesCurrent));

                        // set the touch mode to pinch zoom
                        touchMode = TOUCH_MODE_PINCH;
                    } // if..else
                } // if..else

                copyTouchData(touchesLast, touchesCurrent);
            } // if
        } // touchMove
        
        function touchEnd(evt) {
            var targ = evt.target ? evt.target : evt.srcElement;
            
            if (touchDown && (aggressiveCapture || targ && (targ === targetElement))) {
                fillTouchData(touchesEnd, evt, 'changedTouches');
                
                var touchUpXY = touchesEnd.touches[0];
                
                // cancel event propogation
                if (supportsTouch) {
                    preventDefault(evt);
                } // if

                // get the end tick
                var endTick = new Date().getTime();

                // save the current ticks to the last ticks
                ticksLast = ticksCurrent;

                // if tapping, then first the tap event
                if (touchMode === TOUCH_MODE_TAP) {
                    // start the timer to fire the tap handler, if 
                    if (! tapTimer) {
                        tapTimer = setTimeout(function() {
                            // reset the timer 
                            tapTimer = 0;

                            // fire the appropriate tap event
                            triggerPositionEvent(doubleTap ? 'doubleTap' : 'tap', touchesStart.touches[0]);
                        }, THRESHOLD_DOUBLETAP + 50);
                    }
                }
                // if moving, then fire the move end
                else if (touchMode == TOUCH_MODE_MOVE) {
                    triggerEvent("panEnd", totalDelta.x, totalDelta.y);
                    
                    if (inertia) {
                        checkInertia(touchUpXY, endTick);
                    } // if
                }
                // if pinchzooming, then fire the pinch zoom end
                else if (touchMode == TOUCH_MODE_PINCH) {
                    triggerEvent('pinchZoomEnd', relativeTouches(touchesStart), relativeTouches(touchesLast), endTick - touchStartTick);
                } // if..else
                
                targ.style.cursor = 'default';
                touchDown = false;
            } // if
        } // touchEnd
        
        function getWheelDelta(evt) {
            // process ff DOMMouseScroll event
            if (evt.detail) {
                var delta = -evt.detail * WHEEL_DELTA_STEP;
                
                return createPoint(
                    evt.axis === 1 ? delta : 0,
                    evt.axis === 2 ? delta : 0);
            }
            else {
                return createPoint(
                    evt.wheelDeltaX,
                    evt.wheelDeltaY);
            } // if..else
        } // getWheelDelta
        
        function wheelie(evt) {
            var targ = evt.target ? evt.target : evt.srcElement;
            
            if (aggressiveCapture || targ && (targ === targetElement)) {
                var delta = getWheelDelta(evt), 
                    zoomAmount = delta.y !== 0 ? Math.abs(delta.y / WHEEL_DELTA_STEP) : 0;

                if (lastXY && (zoomAmount !== 0)) {
                    // apply the offset to the xy
                    var xy = createPoint(
                        lastXY.x - targetElement.offsetLeft, 
                        lastXY.y - targetElement.offsetTop);
                    
                    triggerEvent("wheelZoom", xy, Math.pow(2, delta.y > 0 ? zoomAmount : -zoomAmount));
                } // if
                
                preventDefault(evt);
            } // if
        } // wheelie

        // initialise self
        var self = {
            supportsTouch: supportsTouch,

            /* define methods */
            
            addListeners: function(args) {
                listeners.push(args);
            },
            
            decoupleListeners: function(listenerId) {
                // iterate through the listeners and look for the matching listener id
                for (var ii = 0; listenerId && (ii < listeners.length); ii++) {
                    if (listeners[ii].listenerId === listenerId) {
                        listeners.splice(ii, 1);

                        break;
                    } // if
                } // for
            },
            
            release: function() {
                config.unbindEvent(supportsTouch ? 'touchstart' : 'mousedown', touchStart, false);
                config.unbindEvent(supportsTouch ? 'touchmove' : 'mousemove', touchMove, false);
                config.unbindEvent(supportsTouch ? 'touchend' : 'mouseup', touchEnd, false);
                
                // handle mouse wheel events by
                if (! supportsTouch) {
                    window.removeEventListener("mousewheel", wheelie, false);
                    window.removeEventListener("DOMMouseScroll", wheelie, false);
                } // if
            },

            inertiaEnable: function(animationTime, dimensions) {
                inertia = true;
                inertiaDuration = animationTime;
                inertiaMaxDist = dimensions ? Math.min(dimensions.width, dimensions.height) : DEFAULT_INERTIA_MAX;
            },
            
            inertiaDisable: function() {
                inertia = false;
            }
        };
        
        if (typeof supportsTouch === 'undefined') {
            supportsTouch = T5.getConfig().supportsTouch;
        } // if
        
        // wire up the events
        config.bindEvent(supportsTouch ? 'touchstart' : 'mousedown', touchStart, false);
        config.bindEvent(supportsTouch ? 'touchmove' : 'mousemove', touchMove, false);
        config.bindEvent(supportsTouch ? 'touchend' : 'mouseup', touchEnd, false);
        
        // handle mouse wheel events by
        if (! supportsTouch) {
            config.bindEvent("mousewheel", wheelie, window);
            config.bindEvent("DOMMouseScroll", wheelie, window);
        } // if

        return self;
    }; // TouchHelper
    
    // initialise touch helpers array
    var touchHelpers = [];
    
    /* start module definition */
    
    var module = {
        capture: function(element, params) {
            if (! element) {
                throw new Error("Unable to capture touch of null element");
            } // if

            // if the element does not have an id, then generate on
            if (! element.id) {
                element.id = "touchable_" + elementCounter++;
            } // if

            // create the touch helper
            var touchHelper = touchHelpers[element.id];

            // if the touch helper has not been created, then create it and attach to events
            if (! touchHelper) {
                touchHelper = new TouchHelper(COG.extend({ element: element}, params));
                touchHelpers[element.id] = touchHelper;
            } // if

            // if we have params, then perform extra initialization
            if (params) {
                // if we already have an association with listeners, then remove first
                if (params.listenerId) {
                    touchHelper.decoupleListeners(params.listenerId);
                } // if

                // flag the parameters with touch listener ids so they can be removed later
                params.listenerId = (++listenerCount);

                // add the listeners to the helper
                touchHelper.addListeners(params);
            } // if

            return touchHelper;
        },
        
        release: function(element) {
            if (element && element.id && touchHelpers[element.id]) {
                touchHelpers[element.id].release();
                delete touchHelpers[element.id];
            } // if
        }
    }; // module definition
    
    return module;
})();
/* GRUNTJS END */
/**
# T5
The T5 core module contains classes and functionality that support basic drawing 
operations and math that are used in managing and drawing the graphical and tiling interfaces 
that are provided in the Tile5 library.

## Classes
- T5.Vector
- T5.Dimensions
- T5.Rect


## Submodules
- T5.Settings
- T5.V
- T5.D
- T5.R
*/
T5 = (function() {
    /**
    # T5.Vector
    A vector is used to encapsulate X and Y coordinates for a point, and rather than 
    bundle it with methods it has been kept to just core data to ensure it has a 
    lightweight memory footprint.

    ## Constructor
    `T5.Vector(x, y)`
    */
    var Vector = function(initX, initY) {
        return {
            x: initX ? initX : 0,
            y: initY ? initY : 0
        };
    }; // Vector
    
    /**
    # T5.V
    This module defines functions that are used to maintain T5.Vector objects and this
    is removed from the actual Vector class to keep the Vector object lightweight.

    ## Functions
    */
    var vectorTools = (function() {
        function edges(vectors, count) {
            if (! count) {
                count = vectors.length;
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
            
            var diffFn = vectorTools.diff;
            
            // iterate through the vectors and calculate the edges
            // OPTMIZE: look for speed up opportunities
            for (var ii = 0; ii < count - 1; ii++) {
                var diff = diffFn(vectors[ii], vectors[ii + 1]);
                
                fnresult.edges[ii] = 
                    Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
                fnresult.accrued[ii] = 
                    fnresult.total + fnresult.edges[ii];
                    
                fnresult.total += fnresult.edges[ii];
            } // for
            
            return fnresult;
        } // edges

        return {
            VECTOR_SIMPLIFICATION: 4,
            
            /**
            ### create(x, y)
            Create a new vector with the specified `x` and `y` value
            */
            create: function(x, y) {
                return new Vector(x, y);
            },
            
            /**
            ### add(v*)
            Return a new T5.Vector that is the total sum value of all the 
            vectors passed to the function.
            */
            add: function() {
                var fnresult = new Vector();
                for (var ii = arguments.length; ii--; ) {
                    fnresult.x += arguments[ii].x;
                    fnresult.y += arguments[ii].y;
                } // for
                
                return fnresult;
            },
            
            /**
            ### absSize(vector)
            */
            absSize: function(vector) {
                return Math.max(Math.abs(vector.x), Math.abs(vector.y));
            },
            
            /**
            ### diff(v1, v2)
            Return a new T5.Vector that contains the result of v1 - v2.
            */
            diff: function(v1, v2) {
                return new Vector(v1.x - v2.x, v1.y - v2.y);
            },
            
            /**
            ### copy(src)
            Return a new T5.Vector copy of the vector passed to the function 
            */
            copy: function(src) {
                return src ? new Vector(src.x, src.y) : null;
            },
            
            /**
            ### invert(v)
            Return a new T5.Vector that contains the inverted values of the 
            vector passed to the function
            */
            invert: function(vector) {
                return new Vector(-vector.x, -vector.y);
            },
            
            /**
            ### offset(vector, offsetX, offsetY)
            Return a new T5.Vector that is offset by the specified x and y offset
            */
            offset: function(vector, offsetX, offsetY) {
                return new Vector(
                                vector.x + offsetX, 
                                vector.y + (offsetY ? offsetY : offsetX));
            },
            
            edges: edges,
            
            /**
            ### distance(v*)
            Return the total euclidean distance between all the points of the
            vectors supplied to the function
            */
            distance: function(vectors, count) {
                return edges(vectors, count).total;
            },
            
            /**
            ### simplify(v*, generalization)
            This function is used to simplify a vector array by removing what would be considered
            'redundant' vector positions by elimitating at a similar position (based on the supplied
            generalization factor)
            */
            simplify: function(vectors, generalization) {
                if (! vectors) {
                    return null;
                } // if
                
                // set the the default generalization
                generalization = generalization ? generalization : vectorTools.VECTOR_SIMPLIFICATION;

                var tidyVectors = [],
                    last = null;

                for (var ii = vectors.length; ii--; ) {
                    var current = vectors[ii];

                    // determine whether the current point should be included
                    include = !last || ii === 0 || 
                        (Math.abs(current.x - last.x) + 
                            Math.abs(current.y - last.y) >
                            generalization);

                    if (include) {
                        tidyVectors.unshift(current);
                        last = current;
                    }
                } // for

                return tidyVectors;
            },
            
            /**
            ### theta (v1, v2, distance)
            */
            theta: function(v1, v2, distance) {
                var theta = Math.asin((v1.y - v2.y) / distance);
                return v1.x > v2.x ? theta : Math.PI - theta;
            },
            
            
            /**
            ### pointOnEdge(v1, v2, theta, delta)
            */
            pointOnEdge: function(v1, v2, theta, delta) {
                var xyDelta = new Vector(
                                    Math.cos(theta) * delta, 
                                    Math.sin(theta) * delta);
                
                return new Vector(
                                    v1.x - xyDelta.x, 
                                    v1.y - xyDelta.y);
            },
            
            /**
            ### getRect(v*)
            Get a T5.Rect that is large enough to contain the vectors passed
            to the function.
            */
            getRect: function(vectorArray) {
                var arrayLen = vectorArray.length;
                if (arrayLen > 1) {
                    return new Rect(
                        Math.min(
                            vectorArray[0].x, 
                            vectorArray[arrayLen - 1].x
                        ),
                        Math.min(
                            vectorArray[0].y, 
                            vectorArray[arrayLen - 1].y
                        ),
                        Math.abs(vectorArray[0].x - 
                            vectorArray[arrayLen - 1].x),
                        Math.abs(vectorArray[0].y - 
                            vectorArray[arrayLen - 1].y)
                    );
                }
            },
            
            /**
            ### toString(vector)
            Return the string representation of the vector
            */
            toString: function(vector) {
                return vector.x + ', ' + vector.y;
            }
        };
    })(); // vectorTools
    
    /**
    # T5.Rect
    
    A class used to store details pertaining to a rectangular region.
    
    ## Constructor
    `new T5.Rect(x, y, width, height)`
    
    ## Properties
    
    - origin - the top left point of the rectangle
    - dimensions - the width and height of the rectangle
    - invalid - used to indicate that the rect dimensions are irrelevant
    
    
    ## Notes
    The invalid property was added and is used for assisting with managing
    the clip rect that will be drawn in a View.  If marked invalid then
    detailed checking of the draw area is skipped, and no clip() will be
    applied when drawing the canvas (the whole thing is drawn).
    */
    var Rect = function(x, y, width, height) {
        return {
            origin: new Vector(x, y),
            dimensions: new Dimensions(width, height),
            invalid: false
        };
    }; // Rect
    
    /**
    # T5.R
    A module of utility functions for working with T5.Rect objects.
    
    ## Functions
    */
    var rectTools = (function() {
        var subModule = {
            /**
            ## bottomRight(src)
            Get the a T5.Vector for the bottom right position of the rect
            */
            bottomRight: function(src) {
                return vectorTools.offset(
                            src.origin, 
                            src.dimensions.width, 
                            src.dimensions.height);
            },

            /**
            ### empty()
            Return a new empty T5.Rect
            */
            empty: function() {
                return new Rect(0, 0, 0, 0);
            },
            
            /**
            ### copy(src)
            Return a new T5.Rect that is a copy of the specified `src` 
            */
            copy: function(src) {
                return src ? 
                    new Rect(
                            src.origin.x, 
                            src.origin.y, 
                            src.dimensions.width, 
                            src.dimensions.height) :
                    null;
            },
            
            /**
            ### getCenter(rect)
            Return the a T5.Vector for the center of the specified `rect`
            */
            getCenter: function(rect) {
                return new Vector(
                            rect.origin.x + (rect.dimensions.width / 2), 
                            rect.origin.y + (rect.dimensions.height / 2));
            },
            
            /**
            ### isEmpty(rect)
            Return true if the `rect` has 0 width or 0 height.
            */
            isEmpty: function(rect) {
                return rect.dimensions.width === 0 || rect.dimensions.height === 0;
            },
            
            /**
            ### union(dst, src)
            This function takes the Rect values passed to the function and determines
            the required rect to contain all of those values. This origin and dimensions
            of this resulting Rect are then used to replace the first Rect passed to 
            the function.
            */
            union: function() {
                if (arguments.length < 2) { return; }

                var top = arguments[0].origin.y,
                    left = arguments[0].origin.x, 
                    bottom = top + arguments[0].dimensions.height,
                    right = left + arguments[0].dimensions.width,
                    rects = Array.prototype.slice.call(arguments, 1);
                    
                // iterate through the other rects and find the max bounds
                for (var ii = rects.length; ii--; ) {
                    var testTop = rects[ii].origin.y,
                        testLeft = rects[ii].origin.x,
                        testBottom = testTop + rects[ii].dimensions.height,
                        testRight = testLeft + rects[ii].dimensions.width;
                        
                    top = top < testTop ? top : testTop;
                    left = left < testLeft ? left : testLeft;
                    bottom = bottom > testBottom ? bottom : testBottom;
                    right = right > testRight ? right : testRight;
                } // for
                
                // update the first rect with the max bounds
                arguments[0].origin.x = left;
                arguments[0].origin.y = top;
                arguments[0].dimensions.width = right - left;
                arguments[0].dimensions.height = bottom - top;
            }
        };
        
        return subModule;
    })(); // rectTools

    /**
    # T5.Dimensions
    
    */
    var Dimensions = function(initWidth, initHeight) {
        return {
            width: initWidth ? initWidth : 0,
            height: initHeight ? initHeight : 0
        }; 
    }; // Dimensions
    
    /** 
    # T5.D
    A module of utility functions for working with T5.Dimension objects
    
    ## Functions
    */
    var dimensionTools = (function() {
        var subModule = {
            /**
            ### getAspectRatio(dimensions)
            Return the aspect ratio for the `dimensions` (width / height)
            */
            getAspectRatio: function(dimensions) {
                return dimensions.height !== 0 ? 
                    dimensions.width / dimensions.height : 1;
            },

            /**
            ### getCenter(dimensions)
            Get the a T5.Vector for the center of the `dimensions` (width / 2, height  / 2)
            */
            getCenter: function(dimensions) {
                return new Vector(
                            dimensions.width / 2, 
                            dimensions.height / 2);
            },
            
            /**
            ### getSize(dimensions)
            Get the size for the diagonal for the `dimensions`
            */
            getSize: function(dimensions) {
                return Math.sqrt(Math.pow(dimensions.width, 2) + 
                        Math.pow(dimensions.height, 2));
            }
        };
        
        return subModule;
    })(); // dimensionTools
    
    /* exports */
    
    function getTicks() {
        return new Date().getTime();
    } // getTicks
    
    /* module definition */

    var module = {
        ex: COG.extend,
        ticks: getTicks,
        
        Vector: Vector, // Vector
        V: vectorTools,
        
        Dimensions: Dimensions, // Dimensions
        D: dimensionTools,
        
        Rect: Rect,
        R: rectTools
    };
    
    return module;
})();
(function() {
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
            COG.Log.info("would push url: " + messageToUrl(message, args));
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

            // TODO: can we detect the 3G ???
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
                    // TODO: need to detect what device dpi we have instructed the browser to use in the viewport tag
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
        
        // initilaise the order in which we will check configurations
        deviceCheckOrder = [
            deviceConfigs.froyo,
            deviceConfigs.android,
            deviceConfigs.ipod,
            deviceConfigs.iphone,
            deviceConfigs.ipad,
            deviceConfigs.ie
        ];
    } // loadDeviceConfigs
    
    T5.getConfig = function() {
        if (! deviceConfigs) {
            loadDeviceConfigs();
        } // if
        
        // if the device configuration hasn't already been detected do that now
        if (! detectedConfig) {
            COG.Log.info("ATTEMPTING TO DETECT PLATFORM: UserAgent = " + navigator.userAgent);

            // iterate through the platforms and run detection on the platform
            for (var ii = 0; ii < deviceCheckOrder.length; ii++) {
                var testPlatform = deviceCheckOrder[ii];

                if (testPlatform.regex && testPlatform.regex.test(navigator.userAgent)) {
                    detectedConfig = T5.ex({}, deviceConfigs.base, testPlatform);
                    COG.Log.info("PLATFORM DETECTED AS: " + detectedConfig.name);
                    break;
                } // if
            } // for

            if (! detectedConfig) {
                COG.Log.warn("UNABLE TO DETECT PLATFORM, REVERTING TO BASE CONFIGURATION");
                detectedConfig = deviceConfigs.base;
            }
            
            COG.Log.info("CURRENT DEVICE PIXEL RATIO = " + window.devicePixelRatio);
        } // if
        
        return detectedConfig;        
    }; // T5.getConfig
})();

T5.Dispatcher = (function() {
    // initialise variables
    var registeredActions = [];
    
    // initialise the module
    var module = {
        
        /* actions */
        
        execute: function(actionId) {
            // find the requested action
            var action = module.findAction(actionId);
            if (action) {
                action.execute.apply(action, Array.prototype.slice.call(arguments, 1));
            } // if
        },
        
        findAction: function(actionId) {
            for (var ii = registeredActions.length; ii--; ) {
                if (registeredActions[ii].id == actionId) {
                    return registeredActions[ii];
                } // if
            } // for
            
            return null;
        },
        
        getRegisteredActions: function() {
            return [].concat(registeredActions);
        },
        
        getRegisteredActionIds: function() {
            var actionIds = [];
            
            // get the action ids
            for (var ii = registeredActions.length; ii--; ) {
                registeredActions[ii].id ? actionIds.push(registeredActions[ii].id) : null;
            } // for
            
            return actionIds;
        },
        
        registerAction: function(action) {
            if (action && action.id) {
                registeredActions.push(action);
            } // if
        },
        
        Action: function(params) {
            // use default parameter when insufficient are provided
            params = T5.ex({
                autoRegister: true,
                id: '',
                title: '',
                icon: '',
                hidden: false,
                execute: null
            }, params);
            
            // initialise self
            var self = {
                id: params.id,
                
                execute: function() {
                    if (params.execute) {
                        params.execute.apply(this, arguments);
                    } // if
                },
                
                getParam: function(paramId) {
                    return params[paramId] ? params[paramId] : "";
                },
                
                toString: function() {
                    return COG.formatStr("{0} [title = {1}, icon = {2}]", self.id, params.title, params.icon);
                }
            };
            
            // if the action has been set to auto register, then add it to the registry
            if (params.autoRegister) {
                module.registerAction(self);
            } // if
            
            return self;
        },
        
        /* agents */
        
        Agent: function(params) {
            params = COG.extend({
                name: "Untitled",
                translator: null,
                execute: null
            }, params);
            
            // define the wrapper for the agent
            var self = {
                getName: function() {
                    return params.name;
                },
                
                getParam: function(key) {
                    return params[key];
                },
                
                getId: function() {
                    return COG.toID(self.getName());
                },
                
                run: function(args, callback) {
                    if (params.execute) {
                        // save the run instance ticks to a local variable so we can check it in the callback
                        // SEARCH ARGS changed
                        var searchArgs = params.translator ? params.translator(args) : args;
                        
                        // execute the agent
                        params.execute.call(self, searchArgs, function(data, agentParams) {
                            if (callback) {
                                callback(data, agentParams, searchArgs);
                            } // if
                        });
                    } // if
                } // run
            };
            
            return self;
        },
        
        runAgents: function(agents, args, callback) {
            // iterate through the agents and run them
            for (var ii = 0; ii < agents.length; ii++) {
                agents[ii].run(args, callback);
            } // for
        }
    };
    
    return module;
})();

T5.Resources = (function() {
    var basePath = "",
        cachedSnippets = {},
        cachedResources = {};
        
    var module = {
        getPath: function(path) {
            // if the path is an absolute url, then just return that
            if (/^(file|https?|\/)/.test(path)) {
                return path;
            }
            // otherwise prepend the base path
            else {
                return basePath + path;
            } // if..else
        },
        
        setBasePath: function(path) {
            basePath = path;
        },

        loadResource: function(params) {
            // extend parameters with defaults
            params = T5.ex({
                filename: "",
                cacheable: true,
                dataType: null,
                callback: null
            }, params);
            
            var callback = function(data) {
                if (params.callback) {
                    COG.Log.watch("CALLING RESOURCE CALLBACK", function() {
                        params.callback(data);
                    });
                } // if
            };
            
            if (params.cacheable && cachedResources[params.filename]) {
                callback(cachedResources[params.filename]); 
            }
            else {
                COG.xhr({
                    url: module.getPath(params.filename),
                    dataType: params.dataType,
                    success: function(data) {
                        // COG.Log.info("got data: " + data);
                        // add the snippet to the cache
                        if (params.cacheable) {
                            cachedResources[params.filename] = data;
                        }
                        
                        // trigger the callback
                        callback(data);
                    },
                    error: function(raw_request, textStatus, error_thrown) {
                        COG.Log.error("error loading resource [" + params.filename + "], error = " + error_thrown);
                    }
                });
            } // if..else
        },
        
        loadSnippet: function(snippetPath, callback) {
            // if the snippet path does not an extension, add the default
            if (! (/\.\w+$/).test(snippetPath)) {
                snippetPath += ".html";
            } // if
            
            module.loadResource({
                filename: "snippets/" + snippetPath,
                callback: callback,
                dataType: "html"
            });
        }
    };
    
    return module;
})();

T5.Images = (function() {
    // initialise image loader internal variables
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
        
    function newCanvas(width, height) {
        var tmpCanvas = document.createElement('canvas');

        // set the size of the canvas if specified
        tmpCanvas.width = width ? width : 0;
        tmpCanvas.height = height ? height : 0;

        // flash canvas initialization
        if (typeof FlashCanvas !== 'undefined') {
            tmpCanvas.id = 'tmpCanvas' + (canvasCounter++);
            tmpCanvas.style.cssText = 'position: absolute; top: -' + (height-1) + 'px; left: -' + (width-1) + 'px;';

            document.body.appendChild(tmpCanvas);

            FlashCanvas.initElement(tmpCanvas);
        } // if
        
        // explorer canvas initialization
        if (typeof G_vmlCanvasManager !== 'undefined') {
            G_vmlCanvasManager.initElement(tmpCanvas);
        } // if

        return tmpCanvas;
    } // newCanvas
        
    function postProcess(imageData) {
        if (! imageData.image) { return; }
        
        var width = imageData.realSize ? imageData.realSize.width : image.width,
            height = imageData.realSize ? imageData.realSize.height : image.height,
            canvas = newCanvas(width, height),
            context = canvas.getContext('2d'),
            offset = imageData.offset ? imageData.offset : new T5.Vector();
            
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
        // update the image data image
        imageData.image = canvas;
    } // applyBackground
        
    function handleImageLoad() {
        // get the image data
        var imageData = loadWatchers[this.id];
        if (imageData && imageData.image.complete && (imageData.image.width > 0)) {
            imageData.loaded = true;
            // TODO: check the image width to ensure the image is loaded properly
            imageData.hitCount = 1;
            
            // remove the image data from the loading images array
            for (var ii = loadingImages.length; ii--; ) {
                if (loadingImages[ii].image.src == this.src) {
                    loadingImages.splice(ii, 1);
                    break;
                } // if
            } // for
            
            // if we have an image background, or overlay then apply
            if (imageData.background || imageData.postProcess || imageData.drawBackground || imageData.customDraw) {
                postProcess(imageData);
            } // if
            
            // if the image data has a callback, fire it
            if (imageData.loadCallback) {
                imageData.loadCallback(this, false);
            } // if
            
            // add the image to the cached images
            cachedImages[cachedImages.length] = {
                url: this.src,
                created: imageData.requested
            };
            
            // remove the item from the load watchers
            delete loadWatchers[this.id];
            
            // load the next image
            loadNextImage();
        } // if
    } // handleImageLoad
    
    function loadNextImage() {
        if (loadWorker) { 
            return;
        }
        
        // get the max image loads
        var maxImageLoads = T5.getConfig().maxImageLoads;
        
        // initialise the load worker
        loadWorker = COG.Loopage.join({
            execute: function(tickCount, worker) {
                if ((! maxImageLoads) || (loadingImages.length < maxImageLoads)) {
                    var imageData = queuedImages.shift();
                    
                    if (! imageData) {
                        worker.trigger('complete');
                    }
                    else {
                        // add the image data to the loading images
                        loadingImages[loadingImages.length] = imageData;

                        // reset the queued flag and attempt to load the image
                        imageData.image.onload = handleImageLoad;
                        imageData.image.src = T5.Resources.getPath(imageData.url);
                        imageData.requested = T5.ticks();
                    } // if..else
                } // if
            },
            frequency: 10
        });
        
        // handle the load worker finishing
        loadWorker.bind('complete', function(evt) {
            loadWorker = null;
        });
    } // loadNextImage
    
    function cleanupImageCache() {
        clearingCache = true;
        try {
            var halfLen = cachedImages.length / 2 >> 0;
            if (halfLen > 0) {
                // TODO: make this more selective... currently some images on screen may be removed :/
                cachedImages.sort(function(itemA, itemB) {
                    return itemA.created - itemB.created;
                });

                // remove the cached image data
                for (var ii = halfLen; ii--; ) {
                    delete images[cachedImages[ii].url];
                } // for

                // now remove the images from the cached images
                cachedImages.splice(0, halfLen);
            } // if
        }
        finally {
            clearingCache = false;
        } // try..finally
        
        COG.say("imagecache.cleared");
    } // cleanupImageCache

    function checkTimeoutsAndCache(currentTickCount) {
        var timedOutLoad = false, ii = 0,
            config = T5.getConfig();
            
        // iterate through the loading images, and check if any of them have been active too long
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
        
        // if we timeout some images, then load next images
        if (timedOutLoad) {
            loadNextImage();
        } // if
        
        // if we have a configuration and an image cache max size, then ensure we haven't exceeded it
        if (config && config.imageCacheMaxSize) {
            imageCacheFullness = (cachedImages.length * module.avgImageSize) / config.imageCacheMaxSize;
            if (imageCacheFullness >= 1) {
                cleanupImageCache();
            } // if
        } // if
    } // checkTimeoutsAndCache
    
    function getImage(url) {
        var imageData = null,
            image = null;
            
        if (! clearingCache) {
            imageData = images[url];
        } // if

        // return the image from the image data
        image = imageData ? imageData.image : null;
        
        if (image && (image.getContext || (image.complete && (image.width > 0)))) {
            return image;
        } // if
    } // getImage
    
    function loadImage(url, callback, loadArgs) {
        // look for the image data
        var imageData = images[url];

        // if the image data is not defined, then create new image data
        if (! imageData) {
            // initialise the image data
            imageData = T5.ex({
                url: url,
                image: new Image(),
                loaded: false,
                created: T5.ticks(),
                requested: null,
                hitCount: 0,
                loadCallback: callback
            }, loadArgs);
            
            // COG.Log.info("loading image, image args = ", loadArgs);
            
            // initialise the image id
            imageData.image.id = "resourceLoaderImage" + (imageCounter++);
            
            // add the image to the images lookup
            images[url] = imageData;
            loadWatchers[imageData.image.id] = imageData;
            
            // add the image to the queued images
            queuedImages[queuedImages.length] = imageData;
            
            // trigger the next load event
            loadNextImage();
        }
        else {
            imageData.hitCount++;
            if (imageData.image.complete && callback) {
                callback(imageData.image, true);
            } // if
        }
        
        return imageData;
    } // loadImage
    
    var module = {
        avgImageSize: 25,
        loadTimeout: 10,
        
        cancelLoad: function() {
            loadingImages = [];
        },
        
        get: getImage,
        load: loadImage,
        newCanvas: newCanvas,
        
        stats: function() {
            return {
                imageLoadingCount: loadingImages.length,
                queuedImageCount: queuedImages.length,
                imageCacheFullness: imageCacheFullness
            };
        }
    }; // 
    
    COG.Loopage.join({
        execute: checkTimeoutsAndCache,
        frequency: 20000
    });
    
    return module;
})();
/**
# T5.TimeLord

Time utilities for T5, will probably be moved out to it's own library as it really
doesn't fit here...

## Module Functions
*/
T5.TimeLord = (function() {
    // initialise constants
    var DAY_SECONDS = 86400;
    
    // the period regex (the front half of the ISO8601 post the T-split)
    var periodRegex = /^P(\d+Y)?(\d+M)?(\d+D)?$/,
        // the time regex (the back half of the ISO8601 post the T-split)
        timeRegex = /^(\d+H)?(\d+M)?(\d+S)?$/,
        
        Duration = function(days, seconds) {
            return {
                days: days ? days : 0,
                seconds: seconds ? seconds : 0
            };
        };
        
    /**
    ### increase(duration*)
    This function is used to return a new duration that is the sum of the duration
    values passed to the function.
    */
    function addDuration() {
        var result = new Duration();
        
        // sum the component parts of a duration
        for (var ii = arguments.length; ii--; ) {
            result.days = result.days + arguments[ii].days;
            result.seconds = result.seconds + arguments[ii].seconds;
        } // for
        
        // now determine if the total value of seconds is more than a days worth
        if (result.seconds >= DAY_SECONDS) {
            result.days = result.days + ~~(result.seconds / DAY_SECONDS);
            result.seconds = result.seconds % DAY_SECONDS;
        } // if
        
        return result;
    } // increaseDuration
    
    /**
    ### formatDuration(duration)
    
    This function is used to format the specified duration as a string value
    
    #### TODO
    Add formatting options and i18n support
    */
    function formatDuration(duration) {
        // TODO: Im sure this can be implemented better....
        
        var days, hours, minutes, totalSeconds,
            output = '';
            
        if (duration.days) {
            output = duration.days + ' days ';
        } // if
        
        if (duration.seconds) {
            totalSeconds = duration.seconds;

            // if we have hours, then get them
            if (totalSeconds >= 3600) {
                hours = ~~(totalSeconds / 3600);
                totalSeconds = totalSeconds - (hours * 3600);
            } // if
            
            // if we have minutes then extract those
            if (totalSeconds >= 60) {
                minutes = Math.round(totalSeconds / 60);
                totalSeconds = totalSeconds - (minutes * 60);
            } // if
            
            // format the result
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
    } // formatDuration
        
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
        
        // parse the period part
        periodRegex.lastIndex = -1;
        periodMatches = periodRegex.exec(durationParts[0]);
        
        // increment the days by the valid number of years, months and days
        // TODO: add handling for more than just days here but for the moment
        // that is all that is required
        days = days + (periodMatches[3] ? parseInt(periodMatches[3].slice(0, -1), 10) : 0);
        
        // parse the time part
        timeRegex.lastIndex = -1;
        timeMatches = timeRegex.exec(durationParts[1]);
        
        // increment the time by the required number of hour, minutes and seconds
        seconds = seconds + (timeMatches[1] ? parseInt(timeMatches[1].slice(0, -1), 10) * 3600 : 0);
        seconds = seconds + (timeMatches[2] ? parseInt(timeMatches[2].slice(0, -1), 10) * 60 : 0);
        seconds = seconds + (timeMatches[3] ? parseInt(timeMatches[3].slice(0, -1), 10) : 0);

        return new Duration(days, seconds);
    } // parse8601Duration

    // initialise the duration parsers
    var durationParsers = {
        8601: parse8601Duration
    };

    function parseDuration(duration, format) {
        var parser = format ? durationParsers[format] : null;
        
        if (parser) {
            return parser(duration);
        }
        
        COG.Log.warn('Could not find duration parser for specified format: ' + format);
        return new Duration();
    } // durationToSeconds            
    
    var module = {
        // sensible human durations 
        Duration: Duration,
        
        addDuration: addDuration,
        parseDuration: parseDuration,
        formatDuration: formatDuration
    };
    
    return module;
})();
/**
Easing functions

sourced from Robert Penner's excellent work:
http://www.robertpenner.com/easing/

Functions follow the function format of fn(t, b, c, d, s) where:
- t = time
- b = beginning position
- c = change
- d = duration
*/
(function() {
    // define some constants
    var TWO_PI = Math.PI * 2,
        HALF_PI = Math.PI / 2;
        
    // define some function references
    var abs = Math.abs,
        pow = Math.pow,
        sin = Math.sin,
        asin = Math.asin,
        cos = Math.cos;
    
    var s = 1.70158;
    
    function simpleTypeName(typeName) {
        return typeName.replace(/[\-\_\s\.]/g, '').toLowerCase();
    } // simpleTypeName
    
    var easingFns = {
        linear: function(t, b, c, d) {
            return c*t/d + b;
        },
        
        /* back easing functions */
        
        backin: function(t, b, c, d) {
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },
            
        backout: function(t, b, c, d) {
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },
            
        backinout: function(t, b, c, d) {
            return ((t/=d/2)<1) ? c/2*(t*t*(((s*=(1.525))+1)*t-s))+b : c/2*((t-=2)*t*(((s*=(1.525))+1)*t+s)+2)+b;
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
    
    T5.easing = function(typeName) {
        return easingFns[simpleTypeName(typeName)];
    }; // easing
    
    T5.registerEasingType = function(typeName, callback) {
        easingFns[simpleTypeName(typeName)] = callback;
    }; // setEasing
})();
T5.Tween = function(params) {
    params = T5.ex({
        target: null,
        property: null,
        startValue: 0,
        endValue: null,
        duration: 2000,
        tweenFn: T5.easing('sine.out'),
        complete: null,
        cancelOnInteract: false
    }, params);
    
    // get the start ticks
    var startTicks = T5.ticks(),
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
        cancelOnInteract: params.cancelOnInteract,
        
        isComplete: function() {
            return complete;
        },
        
        triggerComplete: function(cancelled) {
            if (params.complete) {
                params.complete(cancelled);
            } // if
        },
        
        update: function(tickCount) {
            try {
                // calculate the updated value
                var elapsed = tickCount - startTicks,
                    updatedValue = params.tweenFn(
                                        elapsed, 
                                        beginningValue, 
                                        change, 
                                        params.duration);
            
                // update the property value
                if (params.target) {
                    params.target[params.property] = updatedValue;
                } // if
            
                // iterate through the update listeners 
                // and let them know the updated value
                notifyListeners(updatedValue);

                complete = startTicks + params.duration <= tickCount;
                if (complete) {
                    if (params.target) {
                        params.target[params.property] = params.tweenFn(params.duration, beginningValue, change, params.duration);
                    } // if
                
                    notifyListeners(updatedValue, true);
                } // if
            }
            catch (e) {
                COG.Log.exception(e);
            } // try..catch
        },
        
        requestUpdates: function(callback) {
            updateListeners.push(callback);
        }
    };
    
    // calculate the beginning value
    beginningValue = 
        (params.target && params.property && params.target[params.property]) ? params.target[params.property] : params.startValue;

    // calculate the change and beginning position
    if (typeof params.endValue !== 'undefined') {
        change = (params.endValue - beginningValue);
    } // if
    
    // if no change is required, then mark as complete 
    // so the update method will never be called
    if (change == 0) {
        complete = true;
    } // if..else
    
    // wake the tween timer
    T5.wakeTweens();
    
    return self;
}; 
(function() {
    // initialise variables
    var tweens = [],
        tweenWorker = null,
        updating = false;
                
    function update(tickCount, worker) {
        if (updating) { return tweens.length; }
        
        updating = true;
        try {
            // iterate through the active tweens and update each
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
            updating = false;
        } // try..finally
        
        // if we have no more tweens then complete it
        if (tweens.length === 0) {
            tweenWorker.trigger('complete');
        } // if
        
        return tweens.length;
    } // update
    
    /*
    # T5.tweenValue
    */
    T5.tweenValue = function(startValue, endValue, fn, callback, duration) {
        // create a tween that doesn't operate on a property
        var fnresult = new T5.Tween({
            startValue: startValue,
            endValue: endValue,
            tweenFn: fn,
            complete: callback,
            duration: duration
        });
        
        // add the the list return the new tween
        tweens.push(fnresult);
        return fnresult;
    }; // T5.tweenValue
    
    /*
    # T5.tween
    */
    T5.tween = function(target, property, targetValue, fn, callback, duration) {
        var fnresult = new T5.Tween({
            target: target,
            property: property,
            endValue: targetValue,
            tweenFn: fn,
            duration: duration,
            complete: callback
        });
        
        // return the new tween
        tweens.push(fnresult);
        return fnresult;
    }; // T5.tween
    
    /*
    # T5.tweenVector
    */
    T5.tweenVector = function(target, dstX, dstY, fn, callback, duration) {
        var fnresult = [];
        
        if (target) {
            var xDone = target.x == dstX;
            var yDone = target.y == dstY;
            
            if (! xDone) {
                fnresult.push(T5.tween(target, "x", dstX, fn, function() {
                    xDone = true;
                    if (xDone && yDone) { callback(); }
                }, duration));
            } // if
            
            if (! yDone) {
                fnresult.push(T5.tween(target, "y", dstY, fn, function() {
                    yDone = true;
                    if (xDone && yDone) { callback(); }
                }, duration));
            } // if
        } // if
        
        return fnresult;
    }; // T5.tweenVector
    
    T5.cancelAnimation = function(checkCallback) {
        if (updating) { return ; }
        
        updating = true;
        try {
            var ii = 0;

            // trigger the complete for the tween marking it as cancelled
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
            updating = false;
        } // try..finally
    }; // T5.cancelAnimation
    
    T5.isTweening = function() {
        return tweens.length > 0;
    }; // T5.isTweening

    T5.wakeTweens = function() {
        if (tweenWorker) { return; }
        
        // create a tween worker
        tweenWorker = COG.Loopage.join({
            execute: update,
            frequency: 20
        });
        
        tweenWorker.bind('complete', function(evt) {
            tweenWorker = null;
        });
    };
})();(function() {
    var viewStates = {
        NONE: 0,
        ACTIVE: 1,
        ANIMATING: 4,
        PAN: 8,
        PINCH: 16,
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
    - PINCH = 16
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
    T5.viewState = function() {
        var result = 0;
        
        for (var ii = arguments.length; ii--; ) {
            var value = viewStates[arguments[ii].toUpperCase()];
            if (value) {
                result = result | value;
            } // if
        } // for
        
        return result;
    }; // T5.viewState
})();
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
T5.ViewLayer = function(params) {
    params = T5.ex({
        id: "",
        zindex: 0,
        supportFastDraw: false,
        animated: false,
        validStates: T5.viewState("ACTIVE", "ANIMATING", "PAN", "PINCH")
    }, params);
    
    var parent = null,
        parentFastDraw = false,
        changed = false,
        supportFastDraw = params.supportFastDraw,
        id = params.id,
        activeState = T5.viewState("ACTIVE"),
        validStates = params.validStates,
        lastOffsetX = 0,
        lastOffsetY = 0;
    
    var self = T5.ex({
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
        shouldDraw: function(displayState, offset, redraw) {
            var drawOK = ((displayState & validStates) !== 0) && 
                (parentFastDraw ? supportFastDraw: true);
                
            // perform the check
            drawOK = changed || redraw || (lastOffsetX !== offset.x) || (lastOffsetY !== offset.y);

            return drawOK;
        },
        
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
            - offset - a Vector object containing the current virtual canvas offset
            - dimensions - a Dimensions object specifying the actual size of the drawing surface
            - state - the current DisplayState of the view
            - view - a reference to the View
            - redraw - whether a redraw is required
            - tickCount - the current tick count
        */
        draw: function(context, offset, dimensions, state, view, redraw, tickCount) {
        },
        
        /**
        ### remove()
        
        The remove method enables a view to flag that it is ready or should be removed
        from any views that it is contained in.  This was introduced specifically for
        animation layers that should only exist as long as an animation is active.
        */
        remove: function() {
            COG.say("layer.remove", { id: id });
        },
        
        /**
        ### changed()
        
        The changed method is used to flag the layer has been modified and will require 
        a redraw
        
        */
        changed: function() {
            // flag as changed
            changed = true;
            self.trigger('changed', self);
            
            // invalidate the parent
            if (parent) {
                parent.trigger('invalidate');
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
            // update the parent
            parent = view;
            
            // update the parent fast draw state
            parentFastDraw = parent ? (parent.fastDraw && (displayState !== activeState)) : false;
            
            // trigger the parent change event
            self.trigger('parentChange', parent);
        }
    }, params); // self
    
    // make view layers observable
    COG.observable(self);
    
    // handle the draw complete
    self.bind('drawComplete', function(evt, offset) {
        changed = false;

        // update the last offset
        lastOffsetX = offset.x;
        lastOffsetY = offset.y;
    });

    return self;
}; // T5.ViewLayer
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
- `intertia`
- `pannable`
- `scalable`
- `panAnimationEasing`
- `panAnimationDuration`
- `pinchZoomAnimateTrigger`
- `adjustScaleFactor`


## Events

### scale
This event is fired when the view has been scaled.
<pre>
view.bind('scale', function(scaleFactor, scaleXY) {
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
view.bind('tap', function(absXY, relXY, gridXY) {
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
view.bind('resize', function(width, height) {

});
</pre>

### idle
This event is fired once the view has gone into an idle state (once draw
operations haven't been required for 500ms).
<pre>
view.bind('idle', function() {
});
</pre>

### drawComplete
Triggered when drawing the view has been completed (who would have thought).
<pre>
view.bind('drawComplete', function(offset, tickCount) {
});
</pre>

- offset (T5.Vector) - the view offset that was used for the draw operation
- tickCount - the tick count at the start of the draw operation.


## Methods
*/
T5.View = function(params) {
    // initialise defaults
    params = T5.ex({
        id: COG.objId('view'),
        container: "",
        fastDraw: false,
        inertia: true,
        pannable: true,
        scalable: true,
        panAnimationEasing: T5.easing('sine.out'),
        panAnimationDuration: 750,
        pinchZoomAnimateTrigger: 400,
        adjustScaleFactor: null,
        autoSize: true,
        tapExtent: 10
    }, params);
    
    // get the container context
    var layers = [],
        layerCount = 0,
        canvas = document.getElementById(params.container),
        mainContext = null,
        offsetX = 0,
        offsetY = 0,
        cycleOffset = new T5.Vector(),
        clearBackground = false,
        cycleWorker = null,
        frozen = false,
        deviceScaling = 1,
        dimensions = new T5.Dimensions(),
        wakeTriggers = 0,
        endCenter = null,
        idle = false,
        panimating = false,
        paintTimeout = 0,
        idleTimeout = 0,
        rescaleTimeout = 0,
        zoomCenter = new T5.Vector(),
        rotation = 0,
        tickCount = 0,
        scaling = false,
        startRect = null,
        endRect = null,
        redraw = false,
        redrawEvery = 40,
        resizeCanvasTimeout = 0,
        scaleFactor = 1,
        lastScaleFactor = 0,
        lastDrawScaleFactor = 1,
        aniProgress = null,
        tweenStart = null,
        startCenter = null,
        isFlash = typeof FlashCanvas !== 'undefined',
        touchHelper = null,
        
        /* state shortcuts */
        
        stateActive = T5.viewState('ACTIVE'),
        statePan = T5.viewState('PAN'),
        statePinch = T5.viewState('PINCH'),
        stateAnimating = T5.viewState('ANIMATING'),
        
        state = stateActive;
        
    // some function references for speed
    var vectorRect = T5.V.getRect,
        dimensionsSize = T5.D.getSize,
        rectCenter = T5.R.getCenter;
        
    /* panning functions */
    
    function pan(evt, x, y, inertia) {
        state = statePan;
        wake();
        
        if (inertia && params.inertia) {
            // update the offset by the specified amount
            panimating = true;
            updateOffset(offsetX + x, offsetY + y, params.panAnimationEasing, params.panAnimationDuration);
        }
        else if (! inertia) {
            updateOffset(offsetX + x, offsetY + y);
        } // if..else
    } // pan
    
    function panEnd(evt, x, y) {
        state = stateActive;
        panimating = false;
        
        COG.Loopage.join({
            execute: wake,
            after: 50,
            single: true
        });
    } // panEnd
    
    /* scaling functions */
    
    function resetZoom() {
        scaleFactor = 1;
    } // resetZoom
    
    function checkTouches(start, end) {
        startRect = vectorRect(start);
        endRect = vectorRect(end);

        // get the sizes of the rects
        var startSize = dimensionsSize(startRect.dimensions),
            endSize = dimensionsSize(endRect.dimensions);

        // update the zoom center
        startCenter = rectCenter(startRect);
        endCenter = rectCenter(endRect);

        // determine the ratio between the start rect and the end rect
        scaleFactor = (startRect && (startSize !== 0)) ? (endSize / startSize) : 1;
    } // checkTouches            
    
    function pinchZoom(evt, touchesStart, touchesCurrent) {
        checkTouches(touchesStart, touchesCurrent);
        scaling = scaleFactor !== 1;
        
        if (scaling) {
            state = statePinch;
            wake();
        } // if
    } // pinchZoom
    
    function pinchZoomEnd(evt, touchesStart, touchesEnd, pinchZoomTime) {
        checkTouches(touchesStart, touchesEnd);
        
        if (params.adjustScaleFactor) {
            scaleFactor = params.adjustScaleFactor(scaleFactor);
            COG.Log.info("scale factor adjusted to: " + scaleFactor);
        } // if

        if (pinchZoomTime < params.pinchZoomAnimateTrigger) {
            // TODO: move this to the map to override
            animateZoom(
                lastDrawScaleFactor, 
                scaleFactor, 
                startCenter, 
                calcPinchZoomCenter(), 
                // TODO: make the animation configurable
                T5.easing('sine.out'),
                function() {
                    scaleView();
                    resetZoom();
                },
                // TODO: make the animation duration configurable
                300);
                
            // reset the scale factor to the last draw scale factor
            scaleFactor = lastDrawScaleFactor;
        }
        else {
            scaleView();
            resetZoom();
        } // if..else
    } // pinchZoomEnd
    
    function wheelZoom(evt, relXY, zoom) {
        self.zoom(relXY, Math.min(Math.pow(2, Math.round(Math.log(zoom))), 8), 500);
    } // wheelZoom
    
    function scaleView() {
        scaling = false;
        self.trigger("scale", scaleFactor, startRect ? calcPinchZoomCenter() : endCenter);

        state = stateActive;
        wake();
    } // scaleView
    
    function handleContainerUpdate(name, value) {
        canvas = document.getElementById(value);
        
        // attach to the new canvas
        attachToCanvas();
    } // handleContainerUpdate
    
    function handleResize(evt) {
        clearTimeout(resizeCanvasTimeout);
        resizeCanvasTimeout = setTimeout(attachToCanvas, 50);
    } // handleResize
    
    function handleRotationUpdate(name, value) {
        rotation = value;
    } // handlePrepCanvasCallback
    
    function handleTap(evt, absXY, relXY) {
        // calculate the grid xy
        var gridXY = T5.V.offset(relXY, offsetX, offsetY);
        
        // iterate through the layers, and inform of the tap event
        for (var ii = layers.length; ii--; ) {
            evt.cancel = evt.cancel || 
                layers[ii].trigger('tap', absXY, relXY, gridXY).cancel;
        } // for
    } // handleTap
        
    function updateOffset(x, y, tweenFn, tweenDuration, callback) {
        
        // initialise variables
        var tweensComplete = 0;
        
        function updateOffsetAnimationEnd() {
            tweensComplete += 1;
            
            if (tweensComplete >= 2) {
                panEnd(0, 0);
                if (callback) {
                    callback();
                } // if
            } // if
        } // updateOffsetAnimationEnd
        
        if (tweenFn) {
            var tweenX = T5.tweenValue(offsetX, x, tweenFn, 
                    updateOffsetAnimationEnd, tweenDuration),
                    
                tweenY = T5.tweenValue(offsetY, y, tweenFn, 
                    updateOffsetAnimationEnd, tweenDuration);
                    
            // attach update listeners
            tweenX.cancelOnInteract = true;
            tweenX.requestUpdates(function(updatedVal) {
                offsetX = updatedVal;
                panimating = true;
                wake();
            });
            
            tweenY.cancelOnInteract = true;
            tweenY.requestUpdates(function(updatedVal) {
                offsetY = updatedVal;
                panimating = true;
                wake();
            });
        }
        else {
            offsetX = x;
            offsetY = y;
        } // if..else
    } // updateOffset
    
    /* private functions */
    
    function attachToCanvas() {
        var ii;
        
        if (canvas) {
            COG.Touch.release(canvas);

            // if we are autosizing the set the size
            if (params.autoSize && canvas.parentNode) {
                var rect = canvas.parentNode.getBoundingClientRect();
                
                if (rect.height !== 0 && rect.width !== 0) {
                    canvas.height = rect.height;
                    canvas.width = rect.width;
                } // if
            } // if

            try {
                // ensure that the canvas has an id, as the styles reference it
                if (! canvas.id) {
                    canvas.id = params.id + '_canvas';
                } // if
                
                // get the canvas context
                mainContext = canvas.getContext('2d');
                mainContext.clearRect(0, 0, canvas.width, canvas.height);
            } 
            catch (e) {
                COG.Log.exception(e);
                throw new Error("Could not initialise canvas on specified view element");
            }
            
            // capture touch events
            touchHelper = COG.Touch.capture(canvas, {
                observable: self
            });
            
            // initialise the dimensions
            if (dimensions.height !== canvas.height || dimensions.width !== canvas.width) {
                dimensions = new T5.Dimensions(canvas.width, canvas.height);
                
                // trigger the resize event for the view
                self.trigger('resize', canvas.width, canvas.height);
                
                // and then tell all the layers
                for (ii = layerCount; ii--; ) {
                    layers[ii].trigger('resize', canvas.width, canvas.height);
                } // for
            } // if
            
            // enable inertia if configured
            if (params.inertia) {
                touchHelper.inertiaEnable(params.panAnimationDuration, dimensions);
            } // if
            
            // iterate through the layers, and change the context
            for (ii = layerCount; ii--; ) {
                layerContextChanged(layers[ii]);
            } // for

            // tell the view to redraw
            invalidate();
        } // if        
    } // attachToCanvas
    
    function addLayer(id, value) {
        // make sure the layer has the correct id
        value.setId(id);
        value.added = T5.ticks();
        
        layerContextChanged(value);
        
        // tell the layer that I'm going to take care of it
        value.setParent(self);
        
        // add the new layer
        layers.push(value);
        
        // sort the layers
        layers.sort(function(itemA, itemB) {
            var result = itemB.zindex - itemA.zindex;
            if (result === 0) {
                result = itemB.added - itemA.added;
            } // if
            
            return result;
        });
        
        // update the layer count
        layerCount = layers.length;
        return value;
    } // addLayer
    
    function getLayerIndex(id) {
        for (var ii = layerCount; ii--; ) {
            if (layers[ii].getId() == id) {
                return ii;
            } // if
        } // for
        
        return -1;
    } // getLayerIndex
    
    /* animation code */
    
    function animateZoom(scaleFactorFrom, scaleFactorTo, startXY, targetXY, tweenFn, callback, duration) {
        
        function finishAnimation() {
            // if we have a callback to complete, then call it
            if (callback) {
                callback();
            } // if

            scaleView();

            // reset the scale factor
            resetZoom();
            aniProgress = null;
        } // finishAnimation
        
        // update the zoom center
        scaling = true;
        startCenter = T5.V.copy(startXY);
        endCenter = T5.V.copy(targetXY);
        startRect = null;

        // if tweening then update the targetXY
        if (tweenFn) {
            var tween = T5.tweenValue(
                            0, 
                            scaleFactorTo - scaleFactorFrom, 
                            tweenFn, 
                            finishAnimation, 
                            duration ? duration : 1000);
                            
            tween.requestUpdates(function(updatedValue, completed) {
                // calculate the completion percentage
                aniProgress = updatedValue / (scaleFactorTo - scaleFactorFrom);

                // update the scale factor
                scaleFactor = scaleFactorFrom + updatedValue;

                // trigger the on animate handler
                state = statePinch;
                wake();
                self.trigger("animate");
            });
        }
        // otherwise, update the scale factor and fire the callback
        else {
            scaleFactor = targetScaleFactor;
            finishAnimation();
        }  // if..else                
    } // animateZoom
    
    /* draw code */
    
    function calcPinchZoomCenter() {
        var center = T5.D.getCenter(dimensions),
            endDist = T5.V.distance([endCenter, center]),
            endTheta = T5.V.theta(endCenter, center, endDist),
            shiftDelta = T5.V.diff(startCenter, endCenter);
            
        center = T5.V.pointOnEdge(endCenter, center, endTheta, endDist / scaleFactor);

        center.x = center.x + shiftDelta.x;
        center.y = center.y + shiftDelta.y; 
        
        return center;
    } // calcPinchZoomCenter
    
    function calcZoomCenter() {
        var displayCenter = T5.D.getCenter(dimensions),
            shiftFactor = (aniProgress ? aniProgress : 1) / 2,
            centerOffset = T5.V.diff(startCenter, endCenter);

        if (startRect) {
            zoomCenter.x = endCenter.x + centerOffset.x;
            zoomCenter.y = endCenter.y + centerOffset.y;
        } 
        else {
            zoomCenter.x = endCenter.x - centerOffset.x * shiftFactor;
            zoomCenter.y = endCenter.y - centerOffset.y * shiftFactor;
        } // if..else
    } // calcZoomCenter
    
    function triggerIdle() {
        self.trigger("idle");
        
        idle = true;
        idleTimeout = 0;
    } // idle
    
    function drawView(context, offset, redraw, tickCount) {
        var drawState = panimating ? statePan : (frozen ? T5.viewState('FROZEN') : state),
            isPinchZoom = (drawState & statePinch) !== 0,
            delayDrawLayers = [],
            ii = 0;

        // Change to force update
        if (clearBackground || isPinchZoom) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            clearBackground = false;
        } // if
        
        // if we are scaling then do some calcs
        if (isPinchZoom) {
            calcZoomCenter();
            
            // offset the draw args
            offset = T5.V.offset(offset, zoomCenter.x, zoomCenter.y);
        } // if
        
        // COG.Log.info("draw state = " + drawState);
        
        context.save();
        try {
            lastDrawScaleFactor = scaleFactor;
            
            // if the device dpi has scaled, then apply that to the display
            if (deviceScaling !== 1) {
                context.scale(deviceScaling, deviceScaling);
            }
            // if we are scaling, then tell the canvas to scale
            else if (isPinchZoom) {
                context.translate(endCenter.x, endCenter.y);
                context.scale(scaleFactor, scaleFactor);
            } // if..else
            
            for (ii = layerCount; ii--; ) {
                // draw the layer output to the main canvas
                // but only if we don't have a scale buffer or the layer is a draw on scale layer
                if (layers[ii].shouldDraw(drawState, offset, redraw)) {
                    layers[ii].draw(
                        context, 
                        offset, 
                        dimensions, 
                        drawState, 
                        self,
                        redraw,
                        tickCount);
                        
                    // trigger that the draw has been completed
                    layers[ii].trigger('drawComplete', offset, tickCount);
                } // if
            } // for
        }
        finally {
            context.restore();
        } // try..finally
        
        // trigger the draw complete for the view
        self.trigger('drawComplete', offset, tickCount);
        COG.Log.trace("draw complete", tickCount);
    } // drawView
    
    function cycle(tickCount, worker) {
        // check to see if we are panning
        var draw = false,
            interacting = (! panimating) && 
                ((state === statePinch) || (state === statePan)),
            // if any of the following are true, then we need to draw the whole canvas so just
            requireRedraw = redraw || 
                        state === T5.viewState('PAN') || 
                        state === T5.viewState('PINCH') || 
                        T5.isTweening();

        // convert the offset x and y to integer values
        // while canvas implementations work fine with real numbers, the actual drawing of images
        // will not look crisp when a real number is used rather than an integer (or so I've found)
        cycleOffset.x = offsetX >> 0;
        cycleOffset.y = offsetY >> 0;
        
        if (interacting) {
            T5.cancelAnimation(function(tweenInstance) {
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
                // add the animating state to the current state
                state = state | stateAnimating;
            } // if
            
            draw = layers[ii].cycle(tickCount, cycleOffset, state, requireRedraw) || draw;
        } // for
        
        // update the require redraw state based on whether we are now in an animating state
        requireRedraw = requireRedraw || ((state & stateAnimating) !== 0);
        
        // if we are scaling and at the same scale factor, don't redraw as its a waste of time
        draw = draw || requireRedraw || ((scaleFactor !== 1) && (scaleFactor !== lastScaleFactor));

        if (draw) {
            drawView(mainContext, cycleOffset, requireRedraw, tickCount);
            lastScaleFactor = scaleFactor;
            
            // reset draw monitoring variables
            redraw = false;
        } // if

        // include wake triggers in the change count
        if ((! draw) && (wakeTriggers === 0) && (! isFlash)) {
            if ((! idle) && (idleTimeout === 0)) {
                idleTimeout = setTimeout(triggerIdle, 500);
            } // if

            worker.trigger('complete');
        } // if
        
        wakeTriggers = 0;
        COG.Log.trace("Completed draw cycle", tickCount);
    } // cycle
    
    function invalidate() {
        redraw = true;
        wake();
    } // invalidate
    
    function wake() {
        wakeTriggers += 1;
        if (frozen || cycleWorker) { return; }
        
        // create the cycle worker
        cycleWorker = COG.Loopage.join({
            execute: cycle,
            frequency: 30
        });
        
        // bind to the complete method
        cycleWorker.bind('complete', function(evt) {
            cycleWorker = null;
        });
    } // wake
    
    function layerContextChanged(layer) {
        layer.trigger("contextChanged", mainContext);
    } // layerContextChanged
    
    /* object definition */
    
    // initialise self
    var self = {
        id: params.id,
        deviceScaling: deviceScaling,
        fastDraw: params.fastDraw || T5.getConfig().requireFastDraw,

        /**
        ### animate(targetScaleFactor, startXY, targetXY, tweenFn, callback)
        Performs an animated zoom on the T5.View.
        */
        animate: function(targetScaleFactor, startXY, targetXY, tweenFn, callback) {
            animateZoom(
                scaleFactor, 
                targetScaleFactor, 
                startXY, 
                targetXY, 
                tweenFn, 
                callback);
        },
        
        /**
        ### centerOn(offset: Vector)
        Move the center of the view to the specified offset
        */
        centerOn: function(offset) {
            offsetX = offset.x - (canvas.width / 2);
            offsetY = offset.y - (canvas.height / 2);
        },

        /**
        ### getDimensions()
        Return the Dimensions of the View
        */
        getDimensions: function() {
            return dimensions;
        },
        
        /**
        ### getZoomCenter()
        */
        getZoomCenter: function() {
            return zoomCenter;
        },
        
        /* layer getter and setters */
        
        /**
        ### getLayer(id: String)
        Get the ViewLayer with the specified id, return null if not found
        */
        getLayer: function(id) {
            // look for the matching layer, and return when found
            for (var ii = 0; ii < layerCount; ii++) {
                if (layers[ii].getId() == id) {
                    return layers[ii];
                } // if
            } // for
            
            return null;
        },
        
        /**
        ### setLayer(id: String, value: T5.ViewLayer)
        Either add or update the specified view layer
        */
        setLayer: function(id, value) {
            // if the layer already exists, then remove it
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
        },
        
        /**
        ### eachLayer(callback: Function)
        Iterate through each of the ViewLayers and pass each to the callback function 
        supplied.
        */
        eachLayer: function(callback) {
            // iterate through each of the layers and fire the callback for each
            for (var ii = layerCount; ii--; ) {
                callback(layers[ii]);
            } // for
        },
        
        /**
        ### clearBackground()
        **deprecated**
        */
        clearBackground: function() {
            COG.Log.info('CALL OF DEPRECATED METHOD CLEAR BACKGROUND');
            
            clearBackground = true;
            invalidate();
        },
        
        /**
        ### invalidate()
        The `invalidate` method is used to inform the view that a full redraw
        is required
        */
        invalidate: invalidate,
        
        /**
        ### freeze()
        Used to freeze the display (no updates are performed) until the view
        is unfrozen using the `unfreeze` method.
        */
        freeze: function() {
            frozen = true;
        },
        
        /**
        ### unfreeze()
        Renable updates to the display after a call to `freeze`
        */
        unfreeze: function() {
            frozen = false;
            
            wake();
        },
        
        /**
        ### resize(width: Int, height: Int)
        Perform a manual resize of the canvas associated with the view.  If the 
        view was originally marked as `autosize` this will override that instruction.
        */
        resize: function(width, height) {
            // if the canvas is assigned, then update the height and width and reattach
            if (canvas) {
                // flag the canvas as not autosize
                params.autoSize = false;
                
                // update the canvas width and height
                canvas.width = width;
                canvas.height = height;
                attachToCanvas();

                // trigger the resize event for the view
                self.trigger('resize', canvas.width, canvas.height);
            } // if
        },
        
        /**
        ### scale(targetScaling, tweenFn, callback, startXY, targetXY)
        */
        scale: function(targetScaling, tweenFn, callback, startXY, targetXY) {
            // if the start XY is not defined, used the center
            if (! startXY) {
                startXY = T5.D.getCenter(dimensions);
            } // if
            
            // if the target xy is not defined, then use the canvas center
            if (! targetXY) {
                targetXY = T5.D.getCenter(dimensions);
            } // if
            
            self.animate(
                    targetScaling, 
                    startXY, 
                    targetXY, 
                    tweenFn, 
                    callback);

            return self;
        },
        
        /**
        ### removeLayer(id: String)
        Remove the T5.ViewLayer specified by the id
        */
        removeLayer: function(id) {
            var layerIndex = getLayerIndex(id);
            if ((layerIndex >= 0) && (layerIndex < layerCount)) {
                COG.say("layer.removed", { layer: layers[layerIndex] });

                layers.splice(layerIndex, 1);
                invalidate();
            } // if
            
            // update the layer count
            layerCount = layers.length;
        },
        
        /* offset methods */
        
        /**
        ### getOffset()
        Return a T5.Vector containing the current view offset
        */
        getOffset: function() {
            // return the last calculated cycle offset
            return cycleOffset;
        },
        
        /**
        ### updateOffset(x, y, tweenFn, tweenDuration, callback)
        */
        updateOffset: updateOffset,
        
        /**
        ### zoom(targetXY, newScaleFactor, rescaleAfter)
        */
        zoom: function(targetXY, newScaleFactor, rescaleAfter) {
            panimating = false;
            scaleFactor = newScaleFactor;
            scaling = scaleFactor !== 1;

            startCenter = T5.D.getCenter(dimensions);
            endCenter = scaleFactor > 1 ? T5.V.copy(targetXY) : T5.D.getCenter(dimensions);
            startRect = null;
            
            clearTimeout(rescaleTimeout);

            if (scaling) {
                state = statePinch;
                wake();

                if (rescaleAfter) {
                    rescaleTimeout = setTimeout(function() {
                        scaleView();
                        resetZoom();
                    }, parseInt(rescaleAfter, 10));
                } // if
            } // if
        }
    };

    // listen for layer removals
    COG.listen("layer.remove", function(args) {
        if (args.id) {
            self.removeLayer(args.id);
        } // if
    });
    
    deviceScaling = T5.getConfig().getScaling();
    
    // add the markers layer
    self.markers = addLayer('markers', new T5.MarkerLayer());
    
    // make the view observable
    COG.observable(self);
    
    // listen for being woken up
    self.bind("wake", wake);
    self.bind("invalidate", invalidate);
    
    // if this is pannable, then attach event handlers
    if (params.pannable) {
        self.bind("pan", pan);
        self.bind("panEnd", panEnd);

        // handle intertia events
        self.bind("inertiaCancel", function(evt) {
            panimating = false;
            wake();
        });
    } // if

    // if this view is scalable, attach zooming event handlers
    if (params.scalable) {
        self.bind("pinchZoom", pinchZoom);
        self.bind("pinchZoomEnd", pinchZoomEnd);
        self.bind("wheelZoom", wheelZoom);
    } // if
    
    // handle tap events
    self.bind('tap', handleTap);
    
    // make the view configurable
    COG.configurable(
        self, 
        ["inertia", "container", 'rotation', 'tapExtent'], 
        COG.paramTweaker(params, null, {
            "container": handleContainerUpdate,
            'rotation':  handleRotationUpdate
        }),
        true);
    
    // attach the map to the canvas
    attachToCanvas();
    
    // if autosized, then listen for resize events
    if (params.autoSize) {
        window.addEventListener('resize', handleResize, false);
    } // if
    
    return self;
}; // T5.View

/**
# T5.PathLayer
_extends:_ T5.ViewLayer


The T5.PathLayer is used to display a single path on a T5.View
*/
T5.PathLayer = function(params) {
    params = T5.ex({
        style: 'waypoints',
        pixelGeneralization: 8,
        zindex: 50
    }, params);
    
    // initialise variables
    var redraw = false,
        coordinates = [],
        markerCoordinates = null,
        rawCoords = [],
        rawMarkers = null,
        pathAnimationCounter = 0,
        spawnedAnimations = [];
        
    /* private internal functions */
    
    function handleGridUpdate(evt, grid) {
        resyncPath(grid);
        
        // tell all the spawned animations to remove themselves
        for (var ii = spawnedAnimations.length; ii--; ) {
            COG.say(
                'layer.remove', { id: spawnedAnimations[ii] });
        } // for
        
        // reset the spawned animations array
        spawnedAnimations = [];
    };
        
    function resyncPath(grid) {
        // update the vectors
        grid.syncVectors(rawCoords);
        if (rawMarkers) {
            grid.syncVectors(rawMarkers);
        } // if

        self.trigger('tidy');
    } // resyncPath
    
    // create the view layer the we will draw the view
    var self = T5.ex(new T5.ViewLayer(params), {
        getAnimation: function(easingFn, duration, drawCallback, autoCenter) {
            // define the layer id
            var layerId = 'pathAnimation' + pathAnimationCounter++;
            spawnedAnimations.push(layerId);

            // create a new animation layer based on the coordinates
            return new T5.AnimatedPathLayer({
                id: layerId,
                path: coordinates,
                zindex: params.zindex + 1,
                easing: easingFn ? easingFn : T5.easing('sine.inout'),
                duration: duration ? duration : 5000,
                drawIndicator: drawCallback,
                autoCenter: autoCenter ? autoCenter : false
            });
        },
        
        cycle: function(tickCount, offset, state, redraw) {
            return redraw;
        },

        draw: function(context, offset, dimensions, state, view) {
            var ii,
                coordLength = coordinates.length;
                
            context.save();
            try {
                T5.applyStyle(context, params.style);
                
                if (coordLength > 0) {
                    // start drawing the path
                    context.beginPath();
                    context.moveTo(
                        coordinates[coordLength - 1].x - offset.x, 
                        coordinates[coordLength - 1].y - offset.y);

                    for (ii = coordLength; ii--; ) {
                        context.lineTo(
                            coordinates[ii].x - offset.x,
                            coordinates[ii].y - offset.y);
                    } // for

                    context.stroke();

                    // if we have marker coordinates draw those also
                    if (markerCoordinates) {
                        context.fillStyle = params.waypointFillStyle;

                        // draw the instruction coordinates
                        for (ii = markerCoordinates.length; ii--; ) {
                            context.beginPath();
                            context.arc(
                                markerCoordinates[ii].x - offset.x, 
                                markerCoordinates[ii].y - offset.y,
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
            var parent = self.getParent(),
                grid = parent ? parent.getTileLayer() : null;
            
            // update the coordinates
            rawCoords = coords;
            rawMarkers = markerCoords;
            
            // if we have a grid, then update
            COG.Log.info('updating coordinates, grid = ' + grid);
            if (grid) {
                resyncPath(grid);
            } // if
        }
    });
    
    self.bind('gridUpdate', handleGridUpdate);
    self.bind('tidy', function(evt) {
        coordinates = T5.V.simplify(rawCoords, params.pixelGeneralization);
        markerCoordinates = T5.V.simplify(rawMarkers, params.pixelGeneralization);

        // wake the parent
        redraw = true;
        self.changed();
    });
    
    return self;
};
/**
# T5.Poly
This class is used to represent individual poly(gon/line)s that are drawn within
a T5.PolyLayer.  

## Constructor

`T5.Poly(vectors, params)`

The constructor requires an array of vectors that represent the poly and 
also accepts optional initialization parameters (see below).


### Initialization Parameters

- `fill` (default = true) - whether or not the poly should be filled.
- `style` (default = null) - the style override for this poly.  If none
is specified then the style of the T5.PolyLayer is used.


## Methods
*/
T5.Poly = function(vectors, params) {
    params = T5.ex({
        fill: false,
        style: null
    }, params);

    // initialise variables
    var haveData = false,
        fill = params.fill,
        styleOverride = params.style,
        drawVectors = [];
    
    /* exported functions */
    
    /**
    ### drawPoly(context, offsetX, offsetY, state)
    This method is used to draw the poly to the specified `context`.  The 
    `offsetX` and `offsetY` arguments specify the panning offset of the T5.View
    which is taken into account when drawing the poly to the display.  The 
    `state` argument specifies the current T5.ViewState of the view.
    */
    function drawPoly(context, offsetX, offsetY, state) {
        if (haveData) {
            var first = true,
                previousStyle = styleOverride ? T5.applyStyle(context, params.style) : null;
            
            context.beginPath();
            
            // now draw the lines
            // COG.Log.info('drawing poly: have ' + drawVectors.length + ' vectors');
            for (var ii = drawVectors.length; ii--; ) {
                var x = drawVectors[ii].x - offsetX,
                    y = drawVectors[ii].y - offsetY;
                    
                if (first) {
                    context.moveTo(x, y);
                    first = false;
                }
                else {
                    context.lineTo(x, y);
                }
            } // for
            
            if (fill) {
                context.fill();
            } // if
            
            context.stroke();
            
            // if we had a previous style, then return to that style
            if (previousStyle) {
                T5.applyStyle(context, previousStyle);
            } // if
        } // if
    } // drawPoly
    
    /**
    ### resync(grid)
    Used to synchronize the vectors of the poly to the grid.
    */
    function resyncToGrid(grid) {
        grid.syncVectors(vectors);
        
        // simplify the vectors for drawing (if required)
        drawVectors = vectors.length <= 3 ? vectors : T5.V.simplify(vectors);
    } // resyncToGrid
    
    /* define self */
    
    var self = {
        draw: drawPoly,
        resync: resyncToGrid
    };

    // initialise the first item to the first element in the array
    haveData = vectors && (vectors.length >= 2);
    
    return self;
};

/**
# T5.PolyLayer
_extends:_ T5.ViewLayer


The PolyLayer is designed to facilitate the storage and display of multiple 
geometric shapes.  This is particularly useful for displaying [GeoJSON](http://geojson.org) 
data and the like.

## Methods
*/
T5.PolyLayer = function(params) {
    params = T5.ex({
        zindex: 80,
        style: null
    }, params);
    
    // initialise variables
    var children = [],
        forceRedraw = false;
        
    /* private functions */
    
    function handleGridUpdate(evt, grid) {
        // iterate through the children and resync to the grid
        for (var ii = children.length; ii--; ) {
            children[ii].resync(grid);
        } // for
        
        forceRedraw = true;
        self.changed();
    }
    
    function handleParentChange(evt, parent) {
        var grid = parent ? parent.getTileLayer() : null;
        
        if (grid) {
            // iterate through the children and resync to the grid
            for (var ii = children.length; ii--; ) {
                children[ii].resync(grid);
            } // for
        } // if
    } // handleParentChange
    
    /* initialise self */
    
    var self = T5.ex(new T5.ViewLayer(params), {
        /**
        ### add(poly)
        Used to add a T5.Poly to the layer
        */
        add: function(poly) {
            // children.push(poly);
            children.unshift(poly);
        },
        
        cycle: function(tickCount, offset, state, redraw) {
            return forceRedraw;
        },

        draw: function(context, offset, dimensions, state, view, redraw) {
            var offsetX = offset.x,
                offsetY = offset.y;
            
            context.save();
            try {
                T5.applyStyle(context, params.style);

                // iterate through the children and draw the layers
                for (var ii = children.length; ii--; ) {
                    children[ii].draw(context, offsetX, offsetY, state);
                } // for
            }
            finally {
                context.restore();
            } // try..finally
            
            forceRedraw = false;
        }
    });
    
    // handle grid updates
    self.bind('gridUpdate', handleGridUpdate);
    self.bind('parentChange', handleParentChange);
    
    // set the style attribute to be configurable
    COG.configurable(
        self, 
        ['style'], 
        COG.paramTweaker(params, null, null),
        true);    

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

- `easing` (easing function, default = T5.easing('sine.inout')) - the easing function to use for the animation

- `drawIndicator` (callback, default = defaultDraw) - A callback function that is called every time the indicator for 
the animation needs to be drawn.  If the parameter is not specified in the constructor the default callback 
is used, which simply draws a small circle at the current position of the animation.

- `duration` (int, default = 2000) - The animation duration.  See T5.Animation module information for more details.

- `autoCenter` (boolean, default = false) - Whether or not the T5.View should be panned with the animation.


## Draw Indicator Callback Function
`function(context, offset, xy, theta)`


The drawIndicator parameter in the constructor allows you to specify a particular callback function that is 
used when drawing the indicator.  The function takes the following arguments:


- `context` - the canvas context to draw to when drawing the indicator
- `offset` - the current tiling offset to take into account when drawing
- `xy` - the xy position where the indicator should be drawn (offset accounted for)
- `theta` - the current angle (in radians) given the path positioning.
*/
T5.AnimatedPathLayer = function(params) {
    params = T5.ex({
        path: [],
        id: COG.objId('pathAni'),
        easing: T5.easing('sine.inout'),
        validStates: T5.viewState("ACTIVE", "PAN", "PINCH"),
        drawIndicator: null,
        duration: 2000,
        autoCenter: false
    }, params);
    
    // generate the edge data for the specified path
    var edgeData = T5.V.edges(params.path), 
        tween,
        theta,
        indicatorXY = null,
        pathOffset = 0;
    
    function drawDefaultIndicator(context, offset, indicatorXY) {
        // draw an arc at the specified position
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
    
    // calculate the tween
    tween = T5.tweenValue(
        0, 
        edgeData.total, 
        params.easing, 
        function() {
            self.remove();
        },
        params.duration);
        
    // if we are autocentering then we need to cancel on interaction
    // tween.cancelOnInteract = autoCenter;
        
    // request updates from the tween
    tween.requestUpdates(function(updatedValue, complete) {
        pathOffset = updatedValue;

        if (complete) {
            self.remove();
        } // if
    });
    
    // initialise self
    var self =  T5.ex(new T5.ViewLayer(params), {
        cycle: function(tickCount, offset, state, redraw) {
            var edgeIndex = 0;

            // iterate through the edge data and determine the current journey coordinate index
            while ((edgeIndex < edgeData.accrued.length) && (edgeData.accrued[edgeIndex] < pathOffset)) {
                edgeIndex++;
            } // while

            // reset offset xy
            indicatorXY = null;

            // if the edge index is valid, then let's determine the xy coordinate
            if (edgeIndex < params.path.length-1) {
                var extra = pathOffset - (edgeIndex > 0 ? edgeData.accrued[edgeIndex - 1] : 0),
                    v1 = params.path[edgeIndex],
                    v2 = params.path[edgeIndex + 1];

                theta = T5.V.theta(v1, v2, edgeData.edges[edgeIndex]);
                indicatorXY = T5.V.pointOnEdge(v1, v2, theta, extra);

                if (params.autoCenter) {
                    var parent = self.getParent();
                    if (parent) {
                        parent.centerOn(indicatorXY);
                    } // if
                } // if
            } // if
            
            return indicatorXY;
        },
        
        draw: function(context, offset, dimensions, state, view) {
            if (indicatorXY) {
                // if the draw indicator method is specified, then draw
                (params.drawIndicator ? params.drawIndicator : drawDefaultIndicator)(
                    context,
                    offset,
                    new T5.Vector(indicatorXY.x - offset.x, indicatorXY.y - offset.y),
                    theta
                );
            } // if
        }
    });

    return self;
}; // T5.AnimatedPathLayer
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

- `tweenIn` (easing function, default = null) - the easing function that is used to 
animate the entry of the annotation.  When not provided, the annotation is simply
displayed statically.

- `animationSpeed` (int, default = 0) - the speed that the annotation should be animated
in at.  Used in combination with the `tweenIn` parameter.


## Methods

*/
T5.Marker = function(params) {
    params = T5.ex({
        xy: new T5.Vector(),
        tweenIn: null,
        animationSpeed: null
    }, params);
    
    // initialise defaults
    var MARKER_SIZE = 4;
    
    var animating = false;
    
    var self = T5.ex(params, {
        isNew: true,
        
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
        draw: function(context, offset, state, overlay, view) {
            if (self.isNew && (params.tweenIn)) {
                // get the end value and update the y value
                var endValue = self.xy.y;

                // set the y to offscreen
                self.xy.y = offset.y - 20;
                
                // animate the annotation
                animating = true;
                
                T5.tween(
                    self.xy, 
                    'y',
                    endValue, 
                    params.tweenIn, 
                    function() {
                        self.xy.y = endValue;
                        animating = false;
                    }, 
                    params.animationSpeed ? 
                        params.animationSpeed : 
                        250 + (Math.random() * 500)
                );
            } // if
            
            self.drawMarker(
                context, 
                offset, 
                self.xy.x - offset.x, 
                self.xy.y - offset.y,
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
        drawMarker: function(context, offset, x, y, state, overlay, view) {
            context.beginPath();
            context.arc(
                x, 
                y,
                MARKER_SIZE,
                0,
                Math.PI * 2,
                false);                    
            context.fill();
        },
        
        /**
        ### hitTest(gridX, gridY)
        This method is used to determine if the marker is located  at the specified 
        x and y position.
        */
        hitTest: function(gridX, gridY) {
            return Math.abs(gridX - self.xy.x) <= MARKER_SIZE && 
                Math.abs(gridY - self.xy.y) <= MARKER_SIZE;
        }
    }); // self
    
    // make a marker capable of triggering events
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
T5.ImageMarker = function(params) {
    params = T5.ex({
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
            T5.V.invert(params.imageAnchor) : 
            null,
        staticImage = params.image,
        animatingImage = params.animatingImage;
    
    function getImageUrl() {
        if (params.animatingImageUrl && self.isAnimating()) {
            // we want a smooth transition, so make 
            // sure the end image is loaded
            T5.Images.load(params.imageUrl);
            
            // return the animating image url
            return params.animatingImageUrl;
        }
        else {
            return params.imageUrl;
        } // if..else
    } // getImageUrl
    
    /* exports */
    
    function drawMarker(context, offset, x, y, state, overlay, view) {
        // get the image
        var image = self.isAnimating() && animatingImage ? animatingImage : staticImage;
        if (image && image.complete && (image.width > 0)) {
            if (! imageOffset) {
                imageOffset = new T5.Vector(
                    -image.width >> 1, 
                    -image.height >> 1
                );
            } // if
            
            // COG.Log.info('drawing image @ x: ' + x + ', y: ' + y);
            if (self.rotation || (self.scale !== 1) || (self.opacity !== 1)) {
                context.save();
                try {
                    context.globalAlpha = self.opacity;
                    context.translate(x, y);
                    context.rotate(self.rotation);
                
                    // draw the image
                    context.drawImage(
                        image,
                        imageOffset.x * self.scale,
                        imageOffset.y * self.scale,
                        image.width * self.scale,
                        image.height * self.scale);
                }
                finally {
                    context.restore();
                } // try..finally
            }
            else {
                // draw the image
                context.drawImage(
                    image,
                    x + imageOffset.x,
                    y + imageOffset.y,
                    image.width,
                    image.height);                
            } // if..else
        } // if
    } // drawImage
    
    if (! staticImage) {
        staticImage = T5.Images.get(params.imageUrl);
        if (! staticImage) {
            T5.Images.load(params.imageUrl, function(image) {
                staticImage = image;
            });
        } // if
    } // if
    
    if (! animatingImage) {
        animatingImage = T5.Images.get(params.imageUrl);
        if (! animatingImage) {
            T5.Images.load(params.animatingImageUrl, function(image) {
                animatingImage = image;
            });
        } // if
    } // if    
    
    var self = T5.ex(new T5.Marker(params), {
        /**
        ### drawMarker(context, offset, xy, state, overlay, view)
        An overriden implementation of the T5.Annotation.drawMarker which 
        draws an image to the canvas.
        */
        drawMarker: drawMarker,
        
        hitTest: function(gridX, gridY) {
            var markerX = self.xy.x,
                markerY = self.xy.y;
                
            // check for a hit test (image offsets are negative numbers)
            return (gridX >= markerX + imageOffset.x) && 
                (gridX <= markerX + (staticImage.width + imageOffset.x)) && 
                (gridY >= markerY + imageOffset.y) && 
                (gridY <= markerY + (staticImage.height + imageOffset.y));
        }
    });
    
    return self;
};
/** 
# T5.Annotation
__deprecated__


The T5.Annotation has been replaced by the T5.Marker, however, the T5.Annotation
has been maintained for backwards compatibility but will be removed before a 
stable 1.0 release of Tile5.
*/
T5.Annotation = function(params) {
    params = T5.ex({
        xy: null
    }, params);
    
    return new T5.Marker(params.xy, params);
};

/**
# T5.ImageAnnotation
__deprecated__


The T5.ImageAnnotation has been replaced by the T5.ImageMarker, however, the T5.ImageAnnotation
has been maintained for backwards compatibility but will be removed before a 
stable 1.0 release of Tile5.
*/
T5.ImageAnnotation = function(params) {
    params = T5.ex({
        xy: null
    }, params);
    
    return new T5.ImageMarker(params.xy, params);
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
T5.MarkerLayer = function(params) {
    params = T5.ex({
        zindex: 100
    }, params);
    
    var markers = [],
        animating = false;
        
    /* event handlers */
        
    function handleGridUpdate(evt, grid) {
        // iterate through the markers and fire the callback
        for (var ii = markers.length; ii--; ) {
            grid.syncVectors([markers[ii].xy]);
        } // for
    } // handleGridUpdate
    
    function handleTap(evt, absXY, relXY, gridXY) {
        var tappedMarkers = [],
            gridX = gridXY.x,
            gridY = gridXY.y;
        
        // iterate through the markers and look for matches
        for (var ii = markers.length; ii--; ) {
            if (markers[ii].hitTest(gridX, gridY)) {
                tappedMarkers[tappedMarkers.length] = markers[ii];
            } // if
        } // for
        
        // COG.Log.info('testing for tapped markers, tap count = ' + tappedMarkers.length);
        
        // if we have tapped markers, then cancel the tap event
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
        // wake and invalidate the parent
        self.changed();
        
        // trigger the markers changed event
        self.trigger('markerUpdate', markers);
    } // markerUpdate
    
    function resyncMarkers() {
        var grid = self.getParent().getTileLayer();
        if (grid) {
            handleGridUpdate(null, grid);
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
    ~     xy: T5.Geo.GeoVector(markerPos) // markerPos is a T5.Geo.Position
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
        // if annotation is an array, then iterate through and add them
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
        // if we have a test callback, then iterate through the markers and 
        // only remove ones that match the requirements
        if (testCallback) {
            for (var ii = 0; ii < markers.length; ii++) {
                if (testCallback(markers[ii])) {
                    markers.splice(ii, 1);
                } // if
            } // for
        }
        // otherwise, reset the markers
        else {
            markers = [];
        } // if..else
        
        markerUpdate();
    } // clear
    
    /** 
    ### find(testCallback)
    Find markers that match the requirements of the test callback.  For an example
    of test callback usage see the `clear` method.
    */
    function find(testCallback) {
        var results = [];
        
        // if we have a test callback, then run
        if (testCallback) {
            for (var ii = markers.length; ii--; ) {
                if (testCallback(markers[ii])) {
                    results[results.length] = markers[ii];
                } // if
            } // for
        } // if
        
        return results;
    } // testCallback

    // create the view layer the we will draw the view
    var self = T5.ex(new T5.ViewLayer(params), {
        cycle: function(tickCount, offset, state, redraw) {
            return animating;
        },
        
        draw: function(context, offset, dimensions, state, view) {
            // reset animating to false
            animating = false;
        
            // iterate through the markers and draw them
            for (var ii = markers.length; ii--; ) {
                markers[ii].draw(
                    context, 
                    offset, 
                    state, 
                    self, 
                    view);
                    
                animating = animating || markers[ii].isAnimating();
            } // for

            return animating ? 1 : 0;
        },
        
        add: add,
        clear: clear,
        find: find
    });
    
    // handle tap events
    self.bind('tap', handleTap);
    self.bind('gridUpdate', handleGridUpdate);
    self.bind('changed', resyncMarkers);
    
    return self;
};
/**
# T5.Style
The T5.Style class is used to define the various attributes that should
be applied to a canvas context when the style is selected.

*/
T5.Style = function(params) {
    params = T5.ex({
        // line styles
        lineWidth: undefined,
        lineCap: undefined,
        lineJoin: undefined,
        miterLimit: undefined,
        lineStyle: undefined,

        // fill styles
        fillStyle: undefined,
        
        // context globals
        globalAlpha: undefined,
        globalCompositeOperation: undefined
    }, params);
    
    // initialise variables
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
    
    /* define self */
    
    var self = {
        applyToContext: function(context) {
            // iterate through the mods and apply to the context
            for (var ii = mods.length; ii--; ) {
                mods[ii](context);
            } // for
        }
    };
   
    /* initialize */
   
    for (var keyName in params) {
        fillMods(keyName);
    } // for
    
    
    return self;
};

(function() {
    
    // define variables
    var previousStyles = {};
    
    /* define the core styles */
    
    var coreStyles = {
        basic: new T5.Style({
            lineWidth: 1,
            strokeStyle: '#000',
            fillStyle: '#fff'
        }),
        
        waypoints: new T5.Style({
            lineWidth: 4,
            strokeStyle: 'rgba(0, 51, 119, 0.9)',
            fillStyle: '#FFF'
        })        
    };
    
    /* define the apply style function */

    /** 
    # T5.applyStyle
    */
    T5.applyStyle = function(context, styleId) {
        var style = T5.styles[styleId] ? T5.styles[styleId] : T5.styles.basic,
            previousStyle;
            
        // if we have a context and context canvas, then update the previous style info
        if (context && context.canvas) {
            previousStyle = previousStyles[context.canvas.id];
            previousStyles[context.canvas.id] = styleId;
        } // if

        // apply the style
        style.applyToContext(context);

        // return the previously selected style
        return previousStyle;
    };

    /**
    # T5.loadStyles
    */
    T5.loadStyles = function(path, callback) {
        COG.jsonp(path, function(data) {
            T5.resetStyles(data);
        });
    };

    /**
    # T5.resetStyles
    */
    T5.resetStyles = function(data) {
        // initialise variables 
        // NOTE: I'm not calling this a stylesheet on purpose
        var styleGroup = {};

        // iterate through each of the items defined in the retured style definition and create
        // T5 styles
        for (var styleId in data) {
            styleGroup[styleId] = new T5.Style(data[styleId]);
        } // for

        // we have made it this far, so replace the T5.styles object
        T5.styles = T5.ex({}, coreStyles, styleGroup);
    };

    // export the core styles as the styles object (to start with)
    T5.styles = coreStyles;
})();

(function() {
    // set the default tile size to 256 pixels
    T5.tileSize = 256;
    
    /**
    # T5.Tile
    A very simple lightweight class that stores information relevant to a tile.
    
    ## Constructor 
    ` new T5.Tile(params);`
    
    ### Initialization Parameters
    
    - x (default: 0) - the current x screen coordinate of the tile
    - y (default: 0) - the current y screen coordinate of the tile
    - gridX (default: 0) - 
    - gridY (default: 0)
    - size (default: 256) - the size of the tile
    
    
    ## Properties
    Initialization parameters mapped directly to properties
    
    ## Usage
    A new tile is created using the following code:

    ~ var tile = new T5.Tile();

    or with specific initial property values:
    ~ var tile = new T5.Tile({
    ~     x: 10,
    ~     y: 10,
    ~     size: 128
    ~ });
    */    
    T5.Tile = function(params) {
        params = T5.ex({
            x: 0,
            y: 0,
            gridX: 0,
            gridY: 0,
            dirty: true
        }, params);
        
        return params;
    }; // T5.Tile
    
    T5.EmptyTile = function(params) {
        var self = new T5.Tile(params);
        self.empty = true;
        
        return self;
    }; // T5.EmptyTile
    
    /**
    # T5.ImageTile
    _extends:_ T5.Tile
    
    
    The ImageTile adds some additional properties to the base so that a T5.ImageTileGrid knows where 
    to load the tile from.
    
    ## Constructor 
    `new T5.ImageTile(params);`
    
    ### Initialization Parameters
    
    - url (string) - the url of the image to load into the tile
    

    ## Example Usage
    ~ new T5.Tiling.ImageTile({
    ~     url: "http://testurl.com/exampleimage.png"
    ~ });
    */
    T5.ImageTile = function(params) {
        // initialise parameters with defaults
        params = T5.ex({
            url: "",
            sessionParamRegex: null,
            loading: false,
            loaded: false
        }, params);
        
        return new T5.Tile(params);
    }; // T5.ImageTile
})();/**
# T5.TileGrid 
_extends_: T5.ViewLayer


The TileGrid implements functionality required to manage a virtual 
grid of tiles and draw them to the parent T5.View canvas.

## Constructor
`new T5.TileGrid(params);`

### Initialization Parameters

- tileSize (int, default = T5.tileSize) - the size of the tiles that will be loaded
into grid

- center (T5.Vector, default = empty)

- gridSize (int, default = 25) - the size of the grid.  Essentially, the grid will
contain gridSize * gridSize tiles.

- shiftOrigin

- supportFastDraw (boolean, default = true) - overrides the T5.ViewLayer setting for fast draw.
The grid should always be displayed, even if we are on a slow device.

- allowShift (boolean, default = true) - whether or not the grid is allowed to shift. Shifting
occurs when the TileGrid is getting to the edges of the grid and requires more image tiles to 
ensure a fluid display.  Shifting can be disabled if desired (but this would be strange).


## Events

### tileDrawComplete
This event is triggered once the tiles that are required to fill the current grid have
been loaded and drawn to the display.

<pre>
tiler.bind('tileDrawComplete', function() {

});
</pre>

## Methods
*/
T5.TileGrid = function(params) {
    // extend the params with the defaults
    params = T5.ex({
        tileSize: T5.tileSize,
        center: new T5.Vector(),
        gridSize: 25,
        shiftOrigin: null,
        supportFastDraw: true,
        allowShift: true
    }, params);
    
    // initialise tile store related information
    var storage = new Array(Math.pow(params.gridSize, 2)),
        gridSize = params.gridSize,
        tileSize = params.tileSize,
        gridHalfWidth = Math.ceil(params.gridSize >> 1),
        topLeftOffset = T5.V.offset(params.center, -gridHalfWidth),
        lastTileCreator = null,
        tileShift = new T5.Vector(),
        animating = false,
        lastNotifyListener = null,
        halfTileSize = Math.round(tileSize / 2),
        haveDirtyTiles = false,
        invTileSize = tileSize ? 1 / tileSize : 0,
        active = true,
        tileDrawQueue = null,
        loadedTileCount = 0,
        lastTilesDrawn = false,
        lastQueueUpdate = 0,
        lastCheckOffset = new T5.Vector(),
        shiftDelta = new T5.Vector(),
        repaintDistance = T5.getConfig().repaintDistance,
        reloadTimeout = 0,
        gridHeightWidth = gridSize * tileSize,
        tileCols, tileRows, centerPos,
        
        // initialise state short cuts
        stateAnimating = T5.viewState('ANIMATING'),
        statePinch = T5.viewState('PINCH');
        
    /* event handlers */
    
    function handleResize(evt, width, height) {
        COG.Log.info('captured resize');
        centerPos = null;
    } // handleResize
        
    /* internal functions */
        
    function copyStorage(dst, src, delta) {
        // set the length of the destination to match the source
        dst.length = src.length;

        for (var xx = 0; xx < gridSize; xx++) {
            for (var yy = 0; yy < gridSize; yy++) {
                dst[getTileIndex(xx, yy)] = getTile(xx + delta.x, yy + delta.y);
            } // for
        } // for
    } // copyStorage

    function createTempTile(col, row) {
        var gridXY = getGridXY(col, row);
        return new T5.EmptyTile({
            gridX: gridXY.x,
            gridY: gridXY.y,
            empty: true
        });
    } // createTempTile
    
    function findTile(matcher) {
        if (! matcher) { return null; }
        
        for (var ii = storage.length; ii--; ) {
            var tile = storage[ii];
            if (tile && matcher(tile)) {
                return tile;
            } // if
        } // for
        
        return null;
    } // findTile
    
    function getGridXY(col, row) {
        return T5.Vector(
            col * tileSize - tileShift.x,
            row * tileSize - tileShift.y);
    } // getGridXY
    
    function getNormalizedPos(col, row) {
        return T5.V.add(new T5.Vector(col, row), T5.V.invert(topLeftOffset), tileShift);
    } // getNormalizedPos
    
    function getShiftDelta(topLeftX, topLeftY, cols, rows) {
        // initialise variables
        var shiftAmount = gridSize * 0.2 >> 0,
            shiftDelta = new T5.Vector();
            
        // test the x
        if (topLeftX < 0 || topLeftX + cols > gridSize) {
            shiftDelta.x = topLeftX < 0 ? -shiftAmount : shiftAmount;
        } // if

        // test the y
        if (topLeftY < 0 || topLeftY + rows > gridSize) {
            shiftDelta.y = topLeftY < 0 ? -shiftAmount : shiftAmount;
        } // if
        
        return shiftDelta;
    } // getShiftDelta
    
    function getTile(col, row) {
        return (col >= 0 && col < gridSize) ? storage[getTileIndex(col, row)] : null;
    } // getTile
    
    function setTile(col, row, tile) {
        storage[getTileIndex(col, row)] = tile;
    } // setTile
    
    function getTileIndex(col, row) {
        return (row * gridSize) + col;
    } // getTileIndex
    
    /*
    What a cool function this is.  Basically, this goes through the tile
    grid and creates each of the tiles required at that position of the grid.
    The tileCreator is a callback function that takes a two parameters (col, row) and
    can do whatever it likes but should return a Tile object or null for the specified
    column and row.
    */
    function populate(tileCreator, notifyListener, resetStorage) {
        // take a tick count as we want to time this
        var startTicks = COG.Log.getTraceTicks(),
            tileIndex = 0,
            centerPos = new T5.Vector(gridSize / 2, gridSize / 2);
            
        // if the storage is to be reset, then do that now
        if (resetStorage) {
            storage = [];
        } // if
        
        if (tileCreator) {
            // COG.Log.info("populating grid, size = " + gridSize + ", x shift = " + tileShift.x + ", y shift = " + tileShift.y);
            
            for (var row = 0; row < gridSize; row++) {
                for (var col = 0; col < gridSize; col++) {
                    if (! storage[tileIndex]) {
                        var tile = tileCreator(col, row, topLeftOffset, gridSize);
                        
                        // set the tile grid x and grid y position
                        tile.gridX = (col * tileSize) - tileShift.x;
                        tile.gridY = (row * tileSize) - tileShift.y;

                        // add the tile to storage
                        storage[tileIndex] = tile;
                    } // if
                    
                    // increment the tile index
                    tileIndex++;
                } // for
            } // for
        } // if
        
        // save the last tile creator
        lastTileCreator = tileCreator;
        lastNotifyListener = notifyListener;

        // log how long it took
        COG.Log.trace("tile grid populated", startTicks);
        
        // if we have an onpopulate listener defined, let them know
        self.changed();
    } // populate
    
    function shift(shiftDelta, shiftOriginCallback) {
        // if the shift delta x and the shift delta y are both 0, then return
        if ((! params.allowShift) || ((shiftDelta.x === 0) && (shiftDelta.y === 0))) { return; }
        
        var ii, startTicks = COG.Log.getTraceTicks();
        // COG.Log.info("need to shift tile store grid, " + shiftDelta.x + " cols and " + shiftDelta.y + " rows.");

        // create new storage
        var newStorage = Array(storage.length);

        // copy the storage from given the various offsets
        copyStorage(newStorage, storage, shiftDelta);

        // update the storage and top left offset
        storage = newStorage;

        // TODO: check whether this is right or not
        if (shiftOriginCallback) {
            topLeftOffset = shiftOriginCallback(topLeftOffset, shiftDelta);
        }
        else {
            topLeftOffset = T5.V.add(topLeftOffset, shiftDelta);
        } // if..else

        // create the tile shift offset
        tileShift.x += (-shiftDelta.x * tileSize);
        tileShift.y += (-shiftDelta.y * tileSize);
        COG.Log.trace("tile storage shifted", startTicks);

        // populate with the last tile creator (crazy talk)
        populate(lastTileCreator, lastNotifyListener);
    } // shift
    
    function updateDrawQueue(offset, state, fullRedraw, tickCount) {
        var tile, tmpQueue = [],
            dirtyTiles = false,
            tileStart = new T5.Vector(
                            (offset.x + tileShift.x) * invTileSize >> 0, 
                            (offset.y + tileShift.y) * invTileSize >> 0);

        // reset the tile draw queue
        tilesNeeded = false;
        
        if (! centerPos) {
            var dimensions = self.getParent().getDimensions();

            tileCols = Math.ceil(dimensions.width * invTileSize) + 1;
            tileRows = Math.ceil(dimensions.height * invTileSize) + 1;
            centerPos = new T5.Vector((tileCols-1) / 2 >> 0, (tileRows-1) / 2 >> 0);
        } // if

        // right, let's draw some tiles (draw rows first)
        for (var yy = tileRows; yy--; ) {
            // iterate through the columns and draw the tiles
            for (var xx = tileCols; xx--; ) {
                // get the tile
                tile = getTile(xx + tileStart.x, yy + tileStart.y);
                var centerDiff = new T5.Vector(xx - centerPos.x, yy - centerPos.y);

                if (! tile) {
                    shiftDelta = getShiftDelta(tileStart.x, tileStart.y, tileCols, tileRows);
                    
                    // TODO: replace the tile with a temporary draw tile here
                    tile = createTempTile(xx + tileStart.x, yy + tileStart.y);
                } // if
                
                // update the tile dirty state
                dirtyTiles = tile ? ((tile.dirty = fullRedraw || tile.dirty) || dirtyTiles) : dirtyTiles;
                
                // add the tile and position to the tile draw queue
                tmpQueue[tmpQueue.length] = {
                    tile: tile,
                    centerness: T5.V.absSize(centerDiff)
                };
            } // for
        } // for

        // sort the tile queue by "centerness"
        tmpQueue.sort(function(itemA, itemB) {
            return itemB.centerness - itemA.centerness;
        });
        
        if (! tileDrawQueue) {
            tileDrawQueue = new Array(tmpQueue.length);
        } // if
        
        // copy the temporary queue item to the draw queue
        for (var ii = tmpQueue.length; ii--; ) {
            tileDrawQueue[ii] = tmpQueue[ii].tile;
            self.prepTile(tileDrawQueue[ii], state);
        } // for
        
        lastQueueUpdate = tickCount;
        return dirtyTiles;
    } // updateDrawQueue
    
    /* external object definition */
    
    // initialise self
    var self = T5.ex(new T5.ViewLayer(params), {
        gridDimensions: new T5.Dimensions(gridHeightWidth, gridHeightWidth),
        
        cycle: function(tickCount, offset, state, redraw) {
            var needTiles = shiftDelta.x !== 0 || shiftDelta.y !== 0,
                xShift = offset.x,
                yShift = offset.y,
                tileSize = T5.tileSize;

            if (needTiles) {
                shift(shiftDelta, params.shiftOrigin);

                // reset the delta
                shiftDelta = new T5.Vector();
                
                // we need to do a complete redraw
                redraw = true;
            } // if
            
            if ((! haveDirtyTiles) && ((state & statePinch) === 0)) {
                haveDirtyTiles = updateDrawQueue(offset, state, redraw, tickCount);
            } // if
            
            // update the tweening flag
            animating = ((state & stateAnimating) !== 0) || T5.isTweening();
            
            return haveDirtyTiles;
        },
        
        /**
        ## deactivate()
        This method is used to instruct the grid to stop drawing (and more importantly) loading tiles 
        in the background.  This is useful when one grid is no longer required and has been replaced 
        by another (for example in the case in mapping, where one layer has replaced another).
        */
        deactivate: function() {
            active = false;
        },
        
        /**
        ## find
        */
        find: findTile,
        
        /** 
        ## prepTile(tile, state)
        Used to prepare a tile for display.  In the T5.TileGrid implementation this does
        nothing.
        */
        prepTile: function(tile, state) {
        },
        
        /**
        ## drawTile(context, tile, x, y, state, redraw, tickCount)
        This method is used to draw the tile to the specified context.  In the T5.TileGrid
        implementation this does nothing.
        */
        drawTile: function(context, tile, x, y, state, redraw, tickCount) {
            return false;
        },
        
        // TODO: convert to a configurable implementation
        getTileSize: function() {
            return tileSize;
        },
        
        /** 
        ### clearTileRect(context, x, y, tileSize, state)
        */
        clearTileRect: function(context, x, y, tileSize, state) {
            context.clearRect(x, y, tileSize, tileSize);
        },
        
        draw: function(context, offset, dimensions, state, view, redraw, tickCount) {
            if (! active) { return; }
            
            // initialise variables
            var xShift = offset.x,
                yShift = offset.y,
                minX = dimensions.width,
                minY = dimensions.height,
                tilesDrawn = true;
                
            // if we don't have a draq queue return
            if (! tileDrawQueue) { return; }
            
            // iterate through the tiles in the draw queue
            for (var ii = tileDrawQueue.length; ii--; ) {
                var tile = tileDrawQueue[ii],
                    x = tile.gridX - xShift,
                    y = tile.gridY - yShift;

                // update the tile x and y
                tile.x = x;
                tile.y = y;

                // if the tile is loaded, then draw, otherwise load
                if (! tile.empty) {
                    // draw the tile
                    if (redraw || tile.dirty) {
                        // if the interface is tweening, then clear the tile rect first
                        if (animating) {
                            self.clearTileRect(context, x, y, tileSize, state);
                        } // if
                        
                        // draw the tile
                        tilesDrawn = self.drawTile(context, tile, x, y, state, redraw, tickCount) && tilesDrawn;
                    } // if
                } 
                else {
                    COG.Log.info("empty tile @ x: " + x + ", y: " + y);
                    self.clearTileRect(context, x, y, tileSize, state);
                    tilesDrawn = false;
                } // if..else
                
                // update the minx and miny
                minX = x < minX ? x : minX;
                minY = y < minY ? y : minY;
            } // for
            
            /* clean the display where required */
            
            if (minX > 0) {
                context.clearRect(0, 0, minX, dimensions.height);
            } // if
            
            if (minY > 0) {
                context.clearRect(0, 0, dimensions.width, minY);
            } // if
            
            // draw the borders if we have them...
            // COG.Log.trace("drew tiles at x: " + offset.x + ", y: " + offset.y, startTicks);
            
            // if the tiles have been drawn and previously haven't then fire the tiles drawn event
            if (tilesDrawn && (! lastTilesDrawn)) {
                view.trigger("tileDrawComplete");
            } // if
            
            // flag the grid as not dirty
            haveDirtyTiles = false;
            
            // update the last tile drawn state
            lastTilesDrawn = tilesDrawn;
        },

        /** 
        ### getTileAtXY(x, y)
        */
        getTileAtXY: function(x, y) {
            var queueLength = tileDrawQueue ? tileDrawQueue.length : 0,
                locatedTile = null;
            
            for (var ii = queueLength; ii--; ) {
                var tile = tileDrawQueue[ii];
                
                if (tile && (x >= tile.x) && (y >= tile.y)) {
                    if ((x <= tile.x + tileSize) && (y <= tile.y + tileSize)) {
                        locatedTile = tile;
                        break; 
                    } // if
                } // if
            } // for
            
            COG.Log.info("looking for tile @ x: " + x + ", y: " + y + ', found: ' + locatedTile);
            return locatedTile;
        },
        
        /** 
        ### getTileVirtualXY(col, row, getCenter)
        Returns a new T5.Vector that specifies the virtual X and Y coordinate of the tile as denoted 
        by the col and row parameters.  If the getCenter parameter is passed through and set to true, 
        then the X and Y coordinates are offset by half a tile to represent the center of the tile rather
        than the top left corner.
        */
        getTileVirtualXY: function(col, row, getCenter) {
            // get the normalized position from the tile store
            var pos = getNormalizedPos(col, row),
                fnresult = new T5.Vector(pos.x * tileSize, pos.y * tileSize);
            
            if (getCenter) {
                fnresult.x += halfTileSize;
                fnresult.y += halfTileSize;
            } // if
            
            return fnresult;
        },
        
        /** 
        ### populate(tileCreator)
        */
        populate: function(tileCreator) {
            populate(tileCreator, null, true);
        },
        
        /**
        ### syncVectors(vectors)
        */
        syncVectors: function(vectors) {
        }        
    });
    
    // bind to events
    self.bind('resize', handleResize);
    
    COG.listen("imagecache.cleared", function(args) {
        // reset all the tiles loaded state
        for (var ii = storage.length; ii--; ) {
            if (storage[ii]) {
                storage[ii].loaded = false;
            } // if
        } // for
    });
    
    COG.listen("tiler.repaint", function(args) {
        for (var ii = storage.length; ii--; ) {
            if (storage[ii]) {
                storage[ii].x = null;
                storage[ii].y = null;
            } // if
        } // for
    });

    return self;
}; // T5.TileGrid
/**
# T5.ImageTileGrid 
_extends_: T5.TileGrid


The ImageTileGrid extends the T5.TileGrid and implements the 
`drawTile` functionality to check the loaded state of image tiles, and treat them accordingly.  
If the tile is already loaded, then it is drawn to the canvas, it not the T5.Images module is used to load the 
tile and once loaded drawn.

## Constructor
`new T5.ImageTileGrid(params);`

### Initialization Parameters

- emptyTile (image, default = default empty tile) - specify an image here to be used as the empty tile
which is displayed when the required tile is not available and the display is not panning

- panningTile (image, default = default panning tile) - the image that is used to display a tile area
when panning, **if** the tile image has not been loaded already

- tileOffset - to be completed
- tileDrawArgs - to be completed


## Methods
*/
T5.ImageTileGrid = function(params) {
    params = T5.ex({
        emptyTile: getEmptyTile(T5.tileSize),
        panningTile: null,
        tileOffset: new T5.Vector(),
        tileDrawArgs: {}
    }, params);
    
    function getEmptyTile(tileSize) {
        if ((! emptyTile) || (tileSize !== emptyTile.width)) {
            emptyTile = T5.Images.newCanvas(tileSize, tileSize);

            var tileContext = emptyTile.getContext('2d');

            tileContext.fillStyle = "rgba(150, 150, 150, 0.1)";
            tileContext.fillRect(0, 0, emptyTile.width, emptyTile.height);
        } // if

        return emptyTile;
    } // getEmptyTile
    
    function getPanningTile(tileSize) {

        function getPattern() {
            var patternSize = 32,
                halfSize = patternSize / 2,
                patternCanvas = T5.Images.newCanvas(patternSize, patternSize);

            // get the canvas context
            var context = patternCanvas.getContext("2d");

            // fill the canvas
            context.fillStyle = "#BBBBBB";
            context.fillRect(0, 0, patternSize, patternSize);

            // now draw two smaller rectangles
            context.fillStyle = "#C3C3C3";
            context.fillRect(0, 0, halfSize, halfSize);
            context.fillRect(halfSize, halfSize, halfSize, halfSize);

            return patternCanvas;
        } // getPattern

        if ((! panningTile) || (tileSize !== panningTile.width)) {
            panningTile = T5.Images.newCanvas(tileSize, tileSize);

            var tileContext = panningTile.getContext('2d');

            // fill the panning tile with the pattern
            tileContext.fillStyle = 
                typeof FlashCanvas !== 'undefined' ? 
                    '#666666' : 
                    tileContext.createPattern(getPattern(), "repeat");
                    
            tileContext.fillRect(0, 0, panningTile.width, panningTile.height);
        } // if

        return panningTile;
    } // getPanningTile
    
    // initialise variables
    var emptyTile = params.emptyTile,
        panningTile = params.panningTile ? params.panningTile : getPanningTile(T5.tileSize),
        tileOffset = params.tileOffset,
        imageOverlay = params.imageOverlay,
        stateActive = T5.viewState('ACTIVE'),
        statePan = T5.viewState('PAN'),
        fastDraw = T5.getConfig().requireFastDraw,
        tileSize = params.tileSize ? params.tileSize : T5.tileSize,
        
        // some short cut functions
        getImage = T5.Images.get,
        loadImage = T5.Images.load;
        
    // initialise the tile draw args
    var tileDrawArgs = T5.ex({
        background: null, 
        overlay: null,
        offset: new T5.Vector(),
        realSize: new T5.Dimensions(tileSize, tileSize)
    }, params.tileDrawArgs);
        
    // initialise self
    var self = T5.ex(new T5.TileGrid(params), {
        /**
        ### clearTileRect(context, x, y, tileSize, state)
        */
        clearTileRect: function(context, x, y, tileSize, state) {
            // if the state is not the panning state, then clear the rect
            if ((state & statePan) === 0) {
                context.clearRect(x, y, tileSize, tileSize);
            } // if..else
        },
        
        /**
        ### drawTile(context, tile, x, y, state, redraw, tickCount)
        */
        drawTile: function(context, tile, x, y, state, redraw, tickCount) {
            var image = tile.url ? getImage(tile.url) : null,
                drawn = false;
                
            if (image) {
                context.drawImage(image, x, y);
                drawn = true;
            }
            else if (redraw || ((state & statePan) !== 0)) {
                context.drawImage(panningTile, x, y);
            }
            else if (emptyTile && (! tile.drawnEmpty)) {
                context.drawImage(emptyTile, x, y);
                tile.drawnEmpty = true;
            } // if..else
            
            tile.dirty = false;
            return drawn;
        },
        
        /**
        ### initTileUrl(tile)
        */
        initTileUrl: function(tile) {
        },
        
        /**
        ### prepTile: function(tile, state)
        */
        prepTile: function(tile, state) {
            if (tile && (! tile.loading) && ((! fastDraw) || (state === stateActive))) {
                if (! tile.url) {
                    self.initTileUrl(tile);
                } // if
                
                var image = getImage(tile.url);
                if (! image) {
                    tile.loading = true;

                    loadImage(
                        tile.url, 
                        function() {
                            tile.loaded = true;
                            tile.dirty = true;
                            
                            self.changed();
                        }, 
                        tileDrawArgs);
                } // if
            } // if
        }
    });
    
    return self;
}; // T5.ImageTileGrid
/** 
# T5.Tiler
_extends:_ T5.View


The T5.Tiler is the base class upon which tiling views are built.

## Constructor
`new T5.Tiler(params);`

## Events

### selectTile
This event is triggered when a tile in the tiler has been selected, which is
triggered by a tap.

<pre>
tiler.bind('selectTile', function(tile) {
});
</pre>

### gridUpdate
The gridUpdate event is trigger with then tiler layer has been update through the 
use of the `setTileLayer` method.  This event is also triggered on any T5.ViewLayer 
that is a current child of the view.

<pre>
tiler.bind('gridUpdate', function(grid) {
});
</pre>

## Methods
*/
T5.Tiler = function(params) {
    params = T5.ex({
        container: "",
        drawCenter: false,
        datasources: {},
        tileLoadThreshold: "first"
    }, params);
    
    // initialise layers
    var gridIndex = 0,
        lastTileLayerLoaded = "",
        actualTileLoadThreshold = 0;
        
    /* private methods */
    
    function selectTile(tile) {
        self.trigger("selectTile", tile);
    } // selectTile
    
    /* event handlers */
    
    function handleTap(evt, absXY, relXY) {
        var grid = self.getTileLayer();
        if (grid) {
            var tile = grid.getTileAtXY(relXY.x, relXY.y);
            if (tile) {
                selectTile(tile);
            }
        } // grid
    } // handleTap
    
    /* object definition */
    
    // initialise self
    var self = T5.ex(new T5.View(params), {
        /**
        ### getTileLayer
        */
        getTileLayer: function() {
            return self.getLayer("grid" + gridIndex);
        },

        /**
        ### setTileLayer(value)
        */
        setTileLayer: function(value) {
            self.setLayer("grid" + gridIndex, value);
            self.trigger('gridUpdate', value);
            
            // iterate through the other layers and let them know
            self.eachLayer(function(layer) {
                layer.trigger('gridUpdate', value);
            });
        },

        /**
        ### viewPixToGridPix(vector)
        */
        viewPixToGridPix: function(vector) {
            var offset = self.getOffset();
            return new T5.Vector(vector.x + offset.x, vector.y + offset.y);
        },
        
        /**
        ### centerPos(tile, easing, duration, callback)
        */
        centerOn: function(tile, easing, duration, callback) {
            var grid = self.getTileLayer(),
                dimensions = self.getDimensions(),
                tileSize = grid ? grid.getTileSize() : 0;
                
            if (tileSize) {
                self.updateOffset(
                    tile.gridX - (dimensions.width - tileSize) * 0.5 >> 0, 
                    tile.gridY - (dimensions.height - tileSize) * 0.5 >> 0,
                    easing,
                    duration,
                    callback);
            } // if
        },
        
        /**
        ### cleanup()
        */
        cleanup: function() {
            self.removeLayer("grid" + gridIndex);
        },
        
        repaint: function() {
            // flag to the tile store to reset the image positions
            COG.say("tiler.repaint");
            
            self.trigger("wake");
        },
        
        /**
        ### select(tile)
        Manually select the specified `tile`
        */
        select: function(tile) {
            selectTile(tile);
        }
    }); // self
    
    self.bind("tap", handleTap);

    return self;
}; // Tiler
/**
# T5.Geo
_module_


The Geo module contains classes and functionality to support geospatial 
operations and calculations that are required when drawing maps, routes, etc.

## Functions
*/
T5.Geo = (function() {
    // define constants
    var LAT_VARIABILITIES = [
        1.406245461070741,
        1.321415085624082,
        1.077179995861952,
        0.703119412486786,
        0.488332580888611
    ];
    
    // define some constants
    var HALF_PI = Math.PI / 2,
        TWO_PI = Math.PI * 2,
        MIN_LAT = -HALF_PI,
        MAX_LAT = HALF_PI,
        MIN_LON = -TWO_PI,
        MAX_LON = TWO_PI,
        M_PER_KM = 1000,
        KM_PER_RAD = 6371,
        DEGREES_TO_RADIANS = Math.PI / 180,
        RADIANS_TO_DEGREES = 180 / Math.PI,
        ECC = 0.08181919084262157,
        PHI_EPSILON = 1E-7,
        PHI_MAXITER = 12;
    
    var ROADTYPE_REGEX = null,
        // TODO: I think these need to move to the provider level..
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
    
    /* define some module constants */
    
    var moduleConstants = {
        VECTORIZE_PER_CYCLE: 500
    };
    
    /* define the exported functions */
        
    var exportedFunctions = {
        /**
        ### getEngine(requiredCapability)
        Returns the engine that provides the required functionality.  If preferred engines are supplied
        as additional arguments, then those are looked for first
        */
        getEngine: function(requiredCapability) {
            // initialise variables
            var fnresult = null;

            // iterate through the arguments beyond the capabililty for the preferred engine
            for (var ii = 1; (! fnresult) && (ii < arguments.length); ii++) {
                fnresult = findEngine(requiredCapability, arguments[ii]);
            } // for

            // if we found an engine using preferences, return that otherwise return an alternative
            fnresult = fnresult ? fnresult : findEngine(requiredCapability);

            // if no engine was found, then throw an exception
            if (! fnresult) {
                throw new Error("Unable to find GEO engine with " + requiredCapability + " capability");
            }

            return fnresult;
        },

        /**
        ### rankGeocodeResponses(requestAddress, responseAddress, engine)
        To be completed
        */
        rankGeocodeResponses: function(requestAddress, responseAddresses, engine) {
            var matches = [],
                compareFns = module.AddressCompareFns;

            // if the engine is specified and the engine has compare fns, then extend them
            if (engine && engine.compareFns) {
                compareFns = T5.ex({}, compareFns, engine.compareFns);
            } // if

            // iterate through the response addresses and compare against the request address
            for (var ii = 0; ii < responseAddresses.length; ii++) {
                matches.push(new module.GeoSearchResult({
                    caption: addrTools.toString(responseAddresses[ii]),
                    data: responseAddresses[ii],
                    pos: responseAddresses[ii].pos,
                    matchWeight: plainTextAddressMatch(requestAddress, responseAddresses[ii], compareFns, module.GeocodeFieldWeights)
                }));
            } // for

            // TODO: sort the matches
            matches.sort(function(itemA, itemB) {
                return itemB.matchWeight - itemA.matchWeight;
            });

            return matches;
        },
        
        /**
        ### distanceToString(distance)
        This function simply formats a distance value (in meters) into a human readable string.
        
        #### TODO
        - Add internationalization and other formatting support to this function
        */
        distanceToString: function(distance) {
            if (distance > 1000) {
                return (~~(distance / 10) / 100) + " km";
            } // if
            
            return distance ? distance + " m" : '';
        },

        /**
        ### dist2rad(distance)
        To be completed
        */
        dist2rad: function(distance) {
            return distance / KM_PER_RAD;
        },

        /**
        ### lat2pix(lat)
        To be completed
        */
        lat2pix: function(lat) {
            var radLat = parseFloat(lat) * DEGREES_TO_RADIANS; // *(2*Math.PI))/360;
            var sinPhi = Math.sin(radLat);
            var eSinPhi = ECC * sinPhi;
            var retVal = Math.log(((1.0 + sinPhi) / (1.0 - sinPhi)) * Math.pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ECC)) / 2.0;

            return retVal;
        },

        /**
        ### lon2pix(lon)
        To be completed
        */
        lon2pix: function(lon) {
            return parseFloat(lon) * DEGREES_TO_RADIANS; // /180)*Math.PI;
        },

        /**
        ### pix2lon(mercX)
        To be completed
        */
        pix2lon: function(mercX) {
            return module.normalizeLon(mercX) * RADIANS_TO_DEGREES;
        },

        /**
        ### pix2lat(mercY)
        To be completed
        */
        pix2lat: function(mercY) {
            var t = Math.pow(Math.E, -mercY),
                prevPhi = mercatorUnproject(t),
                newPhi = findRadPhi(prevPhi, t),
                iterCount = 0;

            while (iterCount < PHI_MAXITER && Math.abs(prevPhi - newPhi) > PHI_EPSILON) {
                prevPhi = newPhi;
                newPhi = findRadPhi(prevPhi, t);
                iterCount++;
            } // while

            return newPhi * RADIANS_TO_DEGREES;
        },

        /**
        ### normalizeLon(lon)
        To be completed
        */
        normalizeLon: function (lon) {
            // return lon;
            while (lon < -180) {
                lon += 360;
            } // while

            while (lon > 180) {
                lon -= 360;
            } // while

            return lon;
        }
    }; // exportedFunctions
        
    /* define the geo simple types */
    
    var Radius = function(init_dist, init_uom) {
        return {
            distance: parseInt(init_dist, 10),
            uom: init_uom
        }; 
    }; // Radius
    
    /**
    # T5.Geo.Position
    
    The position class is simply a data-storage class that is used to store 
    a latitude and longitude pair.  While this class used to contain methods 
    to support manipulation on these objects, these have been moved to the 
    Geo.P submodule for performance optimization reasons.

    ## Properties

    - lat
    The latitude of the position

    - lon
    The longitude of the position

    ## Usage

    Creating a new position object can be done by either specifically creating 
    a new Position object, by specifying the lat and lon as arguments:

    <pre>
    var pos = new T5.Geo.Position(-27.468, 153.028);
    </pre>

    Alternative, the T5.Geo.P submodule can be used to parse a 
    latitude / longitude pair from a string value

    <pre>
    var pos = T5.Geo.P.parse("-27.468 153.028");
    </pre>

    The parse function supports both space-separated, and comma-separated syntaxes.    
    */
    var Position = function(initLat, initLon) {
        // initialise self
        return {
            lat: parseFloat(initLat ? initLat : 0),
            lon: parseFloat(initLon ? initLon : 0)
        };
    }; // Position
    
    /**
    # T5.Geo.BoundingBox

    The BoundingBox class is used to store the min and max Geo.Position 
    that represents a bounding box.  For support functions for manipulating 
    a bounding box, see the Geo.B submodule.
    
    ## Properties

    - min
    The T5.Geo.Position object representing the minimum of the bounding box.  
    The minimum position of the bounding box is the south-western (or 
    bottom-left) corner of the bounding box.

    - max
    The T5.Geo.Position object representing the maximum position of the bounding 
    box.  The maximum position is the north-eastern (or top-right) corner of 
    the bounding box.

    ## Usage

    Creating a new Geo.BoundingBox is done by specifying either 
    a Geo.Position objects or parsable strings to the constructor:

    Created position objects example:
    
    <pre>
    var minPos = T5.Geo.P.parse("-27.587 152.876"),
        maxPos = T5.Geo.P.parse("-27.468 153.028"),
        bounds = new T5.Geo.BoundingBox(minPos, maxPos);
    </pre>

    Creating from latlon string pairs example (constructor arguments 
    automatically passed through the T5.Geo.P.parse function):

    <pre>
    var bounds = new T5.Geo.BoundingBox("-27.587 152.876", "-27.468 153.028");
    </pre>
    */
    var BoundingBox = function(initMin, initMax) {
        return {
            min: posTools.parse(initMin),
            max: posTools.parse(initMax)
        };
    }; // BoundingBox

    /**
    # T5.Geo.Address
    To be completed
    */
    var Address = function(params) {
        params = T5.ex({
            streetDetails: "",
            location: "",
            country: "",
            postalCode: "",
            pos: null,
            boundingBox: null
        }, params);
        
        return params;
    }; // Address
    
    /**
    # T5.Geo.P

    The Geo.P submodule is used to perform operations on Geo.Position objects rather 
    than have those operations bundled with the object.
    
    ## Functions
    */
    var posTools = (function() {
        var DEFAULT_VECTORIZE_CHUNK_SIZE = 100;
        
        var subModule = {
            /**
            ### calcDistance(pos1, pos2)
            Calculate the distance between two T5.Geo.Position objects, pos1 and pos2.  The 
            distance returned is measured in kilometers.
            */
            calcDistance: function(pos1, pos2) {
                if (subModule.empty(pos1) || subModule.empty(pos2)) {
                    return 0;
                } // if
                
                var halfdelta_lat = toRad(pos2.lat - pos1.lat) / 2;
                var halfdelta_lon = toRad(pos2.lon - pos1.lon) / 2;

                // TODO: find out what a stands for, I don't like single char variables in code (same goes for c)
                var a = (Math.sin(halfdelta_lat) * Math.sin(halfdelta_lat)) + 
                        (Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat))) * 
                        (Math.sin(halfdelta_lon) * Math.sin(halfdelta_lon));

                // calculate c (whatever c is)
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                // calculate the distance
                return KM_PER_RAD * c;
            },
            
            /**
            ### copy(src)
            Create a copy of the specified T5.Geo.Position object.
            */
            copy: function(src) {
                return src ? new Position(src.lat, src.lon) : null;
            },

            /**
            ### empty(pos)
            Returns true if the T5.Geo.Position object is empty, false if not.
            */
            empty: function(pos) {
                return (! pos) || ((pos.lat === 0) && (pos.lon === 0));
            },
            
            /**
            ### equal(pos1, pos2)
            Compares to T5.Geo.Position objects and returns true if they 
            have the same latitude and longitude values
            */
            equal: function(pos1, pos2) {
                return pos1 && pos2 && (pos1.lat == pos2.lat) && (pos1.lon == pos2.lon);
            },
            
            /**
            ### inArray(pos, testArray)
            Checks to see whether the specified T5.Geo.Position is contained within 
            the array of position objects passed in the testArray.
            */
            inArray: function(pos, testArray) {
                var arrayLen = testArray.length,
                    testFn = posTools.equal;
                    
                for (var ii = arrayLen; ii--; ) {
                    if (testFn(pos, testArray[ii])) {
                        return true;
                    } // if
                } // for
                
                return false;
            },
            
            /**
            ### inBounds(pos, bounds)
            Returns true if the specified Geo.Position object is within the 
            T5.Geo.BoundingBox specified by the bounds argument.
            */
            inBounds: function(pos, bounds) {
                // initialise variables
                var fnresult = ! (posTools.empty(pos) || posTools.empty(bounds));

                // check the pos latitude
                fnresult = fnresult && (pos.lat >= bounds.min.lat) && (pos.lat <= bounds.max.lat);

                // check the pos longitude
                fnresult = fnresult && (pos.lon >= bounds.min.lon) && (pos.lon <= bounds.max.lon);

                return fnresult;
            },
            
            /**
            ### offset(pos, latOffset, lonOffset)
            Return a new T5.Geo.Position which is the original `pos` offset by
            the specified `latOffset` and `lonOffset` (which are specified in 
            km distance)
            */
            offset: function(pos, latOffset, lonOffset) {
                var radOffsetLat = latOffset / KM_PER_RAD,
                    radOffsetLon = lonOffset / KM_PER_RAD,
                    radLat = pos.lat * DEGREES_TO_RADIANS,
                    radLon = pos.lon * DEGREES_TO_RADIANS,
                    newLat = radLat + radOffsetLat,
                    newLon;
                   
                // COG.Log.info('calculating offset for position: ', pos);
                // COG.Log.info('rad offset lat = ' + radOffsetLat);
                // COG.Log.info('rad lat = ' + radLat);
                // COG.Log.info('new rad lat = ' + newLat);
                // COG.Log.info('min lat = ' + MIN_LAT + ', max lat = ' + MAX_LAT);
                    
                if ((newLat > MIN_LAT) && (newLat < MAX_LAT)) {
                    var deltaLon = Math.asin(Math.sin(radOffsetLon) / Math.cos(radLat));
                    
                    // determine the max longitude
                    newLon = radLon + deltaLon;
                    if (newLon > MAX_LON) {
                        newLon -= 2 * Math.PI;
                    } // if
                }
                else {
                    newLat = Math.min(Math.max(newLat, MIN_LAT), MAX_LAT);
                    newLon = MIN_LON;
                } // if..else
                
                return new Position(
                    newLat * RADIANS_TO_DEGREES, 
                    newLon * RADIANS_TO_DEGREES);
            },
            
            /**
            ### parse(object)
            This function is used to take a latitude and longitude String 
            pair (either space or comma delimited) and return a new T5.Geo.Position 
            value.  The function is also tolerant of being passed an existing 
            T5.Geo.Position object as the object argument, and in these cases 
            returns a copy of the position.
            */
            parse: function(pos) {
                // first case, null value, create a new empty position
                if (! pos) {
                    return new Position();
                }
                else if (typeof(pos.lat) !== 'undefined') {
                    return subModule.copy(pos);
                }
                // now attempt the various different types of splits
                else if (pos.split) {
                    var sepChars = [' ', ','];
                    for (var ii = 0; ii < sepChars.length; ii++) {
                        var coords = pos.split(sepChars[ii]);
                        if (coords.length === 2) {
                            return new Position(coords[0], coords[1]);
                        } // if
                    } // for
                } // if..else

                return null;
            },

            /**
            ### parseArray(sourceData)
            Just like parse, but with lots of em'
            */
            parseArray: function(sourceData) {
                var sourceLen = sourceData.length,
                    positions = new Array(sourceLen);

                for (var ii = sourceLen; ii--; ) {
                    positions[ii] = subModule.parse(sourceData[ii]);
                } // for

                // COG.Log.info("parsed " + positions.length + " positions");
                return positions;
            },
            
            /**
            ### fromMercatorPixels(x, y, radsPerPixel)
            This function is used to take x and y mercator pixels values, 
            and using the value passed in the radsPerPixel value convert 
            that to a Geo.Position object.
            */
            fromMercatorPixels: function(mercX, mercY) {
                // return the new position
                return new Position(
                    T5.Geo.pix2lat(mercY),
                    T5.Geo.normalizeLon(T5.Geo.pix2lon(mercX))
                );
            },

            /**
            ### toMercatorPixels(pos, radsPerPixel)
            Basically, the reverse of the fromMercatorPixels function - 
            pass it a Geo.Position object and get a Vector object back 
            with x and y mercator pixel values back.
            */
            toMercatorPixels: function(pos) {
                return new T5.Vector(T5.Geo.lon2pix(pos.lon), T5.Geo.lat2pix(pos.lat));
            },
            
            /**
            ### generalize(sourceData, requiredPositions, minDist)
            To be completed
            */
            generalize: function(sourceData, requiredPositions, minDist) {
                var sourceLen = sourceData.length,
                    positions = [],
                    lastPosition = null;

                if (! minDist) {
                    minDist = DEFAULT_GENERALIZATION_DISTANCE;
                } // if

                // convert min distance to km
                minDist = minDist / 1000;

                COG.Log.info("generalizing positions, must include " + requiredPositions.length + " positions");

                // iterate thorugh the source data and add positions the differ by the required amount to 
                // the result positions
                for (var ii = sourceLen; ii--; ) {
                    if (ii === 0) {
                        positions.unshift(sourceData[ii]);
                    }
                    else {
                        var include = (! lastPosition) || posTools.inArray(sourceData[ii], requiredPositions),
                            posDiff = include ? minDist : posTools.calcDistance(lastPosition, sourceData[ii]);

                        // if the position difference is suitable then include
                        if (sourceData[ii] && (posDiff >= minDist)) {
                            positions.unshift(sourceData[ii]);

                            // update the last position
                            lastPosition = sourceData[ii];
                        } // if
                    } // if..else
                } // for

                COG.Log.info("generalized " + sourceLen + " positions into " + positions.length + " positions");
                return positions;
            },
            
            /**
            ### vectorize(positions, options)
            The vectorize function is used to take an array of positions specified in the 
            `positions` argument and convert these into T5.Geo.GeoVector objects. By default
            the vectorize function will process these asyncronously and will return a 
            COG Worker that will be taking care of chunking up and processing the request
            in an efficient way.  It is, however, possible to specify that the conversion should
            happen synchronously and in this case the array of vectors is returned rather
            than a worker instance.
            
            #### Example Usage (Asyncronous)
            ~ // default options are used (async + 500 conversions per cycle)
            ~ var worker = T5.Geo.P.vectorize(positions);
            ~ 
            ~ // bind to the complete event for the worker
            ~ worker.bind('complete', function(vectors) {
            ~     // DO SOMETHING WITH YOUR VECTORS HERE
            ~ });
            
            #### Example Usage (Synchronous)
            ~ var vectors = T5.Geo.P.vectorize(positions, {
            ~     async: false
            ~ });
            */
            vectorize: function(positions, options) {
                var posIndex = positions.length,
                    vectors = new Array(posIndex);
                    
                // initialise options
                options = T5.ex({
                    chunkSize: moduleConstants.VECTORIZE_PER_CYCLE,
                    async: true
                }, options);
                
                // if we are not processing async, then do it right now
                if (! options.async) {
                    for (var ii = posIndex; ii--; ) {
                        vectors[ii] = new T5.Geo.GeoVector(positions[ii]);
                    } // for
                    
                    return vectors;
                } // if
                
                // create a new loopage worker to manage the conversion 
                // as there could be a lot of positions...
                return COG.Loopage.join({
                    frequency: 10,
                    execute: function(tickCount, worker) {
                        // initialise variables
                        var chunkCounter = 0,
                            chunkSize = options.chunkSize,
                            ii = posIndex;
                        
                        // process from the last position index
                        for (; ii--;) {
                            vectors[ii] = new T5.Geo.GeoVector(positions[ii]);
                            
                            // increase the chunk counter
                            chunkCounter += 1;
                            
                            // if we have hit the chunk size, then break
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
            },

            /**
            ### toString(pos)
            Return a string representation of the Geo.Position object
            */
            toString: function(pos) {
                return pos ? pos.lat + " " + pos.lon : "";
            }
        };
        
        return subModule;
    })();
    
    
    /**
    # T5.Geo.B
    
    A collection of utilities that are primarily designed to help with working 
    with Geo.BoundingBox objects.  The functions are implemented here rather 
    than with the actual object itself to ensure that the object remains lightweight.
    
    ## Functions
    */
    var boundsTools = (function() {
        var subModule = {
            /**
            ### calcSize(min, max, normalize)
            The calcSize function is used to determine the size of a Geo.BoundingBox given 
            a minimum position (relates to the bottom-left / south-western corner) and 
            maximum position (top-right / north-eastern corner) of the bounding box.  
            The 3rd parameter specifies whether the size calculations should normalize the 
            calculation in cases where the bounding box crosses the 360 degree boundary.
            */
            calcSize: function(min, max, normalize) {
                var size = new T5.Vector(0, max.lat - min.lat);
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
            },

            /**
            ### createBoundsFromCenter(centerPos, distance)
            This function is very useful for creating a Geo.BoundingBox given a 
            center position and a radial distance (specified in KM) from the center 
            position.  Basically, imagine a circle is drawn around the center 
            position with a radius of distance from the center position, and then 
            a box is drawn to surround that circle.  Adapted from the [functions written 
            in Java by Jan Philip Matuschek](http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates)
            */
            createBoundsFromCenter: function(centerPos, distance) {
                var radDist = distance / KM_PER_RAD,
                    radLat = centerPos.lat * DEGREES_TO_RADIANS,
                    radLon = centerPos.lon * DEGREES_TO_RADIANS,
                    minLat = radLat - radDist,
                    maxLat = radLat + radDist,
                    minLon, maxLon;
                    
                // COG.Log.info("rad distance = " + radDist);
                // COG.Log.info("rad lat = " + radLat + ", lon = " + radLon);
                // COG.Log.info("min lat = " + minLat + ", max lat = " + maxLat);
                    
                if ((minLat > MIN_LAT) && (maxLat < MAX_LAT)) {
                    var deltaLon = Math.asin(Math.sin(radDist) / Math.cos(radLat));
                    
                    // determine the min longitude
                    minLon = radLon - deltaLon;
                    if (minLon < MIN_LON) {
                        minLon += 2 * Math.PI;
                    } // if
                    
                    // determine the max longitude
                    maxLon = radLon + deltaLon;
                    if (maxLon > MAX_LON) {
                        maxLon -= 2 * Math.PI;
                    } // if
                }
                else {
                    minLat = Math.max(minLat, MIN_LAT);
                    maxLat = Math.min(maxLat, MAX_LAT);
                    minLon = MIN_LON;
                    maxLon = MAX_LON;
                } // if..else
                
                return new BoundingBox(
                    new Position(minLat * RADIANS_TO_DEGREES, minLon * RADIANS_TO_DEGREES), 
                    new Position(maxLat * RADIANS_TO_DEGREES, maxLon * RADIANS_TO_DEGREES));
            },
            
            /**
            ### expand(bounds, amount)
            A simple function that is used to expand a Geo.BoundingBox 
            by the specified amount (in degrees).
            */
            expand: function(bounds, amount) {
                return new BoundingBox(
                    new Position(bounds.min.lat - amount, bounds.min.lon - module.normalizeLon(amount)),
                    new Position(bounds.max.lat + amount, bounds.max.lon + module.normalizeLon(amount)));
            },
            
            /**
            ### forPositions(positions, padding)

            This function is very useful when you need to create a 
            Geo.BoundingBox to contain an array of T5.Geo.Position.  
            The optional second parameter allows you to specify an amount of 
            padding (in degrees) to apply to the bounding box that is created.
            */
            forPositions: function(positions, padding) {
                var bounds = null,
                    startTicks = T5.ticks();

                // if padding is not specified, then set to auto
                if (! padding) {
                    padding = "auto";
                } // if

                for (var ii = positions.length; ii--; ) {
                    if (! bounds) {
                        bounds = new T5.Geo.BoundingBox(positions[ii], positions[ii]);
                    }
                    else {
                        var minDiff = subModule.calcSize(bounds.min, positions[ii], false),
                            maxDiff = subModule.calcSize(positions[ii], bounds.max, false);

                        if (minDiff.x < 0) { bounds.min.lon = positions[ii].lon; }
                        if (minDiff.y < 0) { bounds.min.lat = positions[ii].lat; }
                        if (maxDiff.x < 0) { bounds.max.lon = positions[ii].lon; }
                        if (maxDiff.y < 0) { bounds.max.lat = positions[ii].lat; }
                    } // if..else
                } // for

                // expand the bounds to give us some padding
                if (padding) {
                    if (padding == "auto") {
                        var size = subModule.calcSize(bounds.min, bounds.max);

                        // update padding to be a third of the max size
                        padding = Math.max(size.x, size.y) * 0.3;
                    } // if

                    bounds = subModule.expand(bounds, padding);
                } // if

                COG.Log.trace("calculated bounds for " + positions.length + " positions", startTicks);
                return bounds;
            },
            
            /**
            ### getCenter(bounds)
            Returns a Geo.Position for the center position of the bounding box.
            */
            getCenter: function(bounds) {
                // calculate the bounds size
                var size = boundsTools.calcSize(bounds.min, bounds.max);
                
                // create a new position offset from the current min
                return new T5.Geo.Position(bounds.min.lat + (size.y / 2), bounds.min.lon + (size.x / 2));
            },
            
            /**
            ### getGeohash(bounds)
            To be completed
            */
            getGeoHash: function(bounds) {
                var minHash = T5.Geo.GeoHash.encode(bounds.min.lat, bounds.min.lon),
                    maxHash = T5.Geo.GeoHash.encode(bounds.max.lat, bounds.max.lon);
                    
                COG.Log.info("min hash = " + minHash + ", max hash = " + maxHash);
            },

            /** 
            ### getZoomLevel(bounds, displaySize)

            This function is used to return the zoom level (seems consistent across 
            mapping providers at this stage) that is required to properly display 
            the specified T5.Geo.BoundingBox given the screen dimensions (specified as 
            a Dimensions object) of the map display. Adapted from 
            [this code](http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/43958790eafe037f/66e889029c555bee)
            */
            getZoomLevel: function(bounds, displaySize) {
                // get the constant index for the center of the bounds
                var boundsCenter = subModule.getCenter(bounds),
                    maxZoom = 1000,
                    variabilityIndex = Math.min(Math.round(Math.abs(boundsCenter.lat) * 0.05), LAT_VARIABILITIES.length),
                    variability = LAT_VARIABILITIES[variabilityIndex],
                    delta = subModule.calcSize(bounds.min, bounds.max),
                    // interestingly, the original article had the variability included, when in actual reality it isn't, 
                    // however a constant value is required. must find out exactly what it is.  At present, though this
                    // works fine.
                    bestZoomH = Math.ceil(Math.log(LAT_VARIABILITIES[3] * displaySize.height / delta.y) / Math.log(2)),
                    bestZoomW = Math.ceil(Math.log(variability * displaySize.width / delta.x) / Math.log(2));

                // COG.Log.info("constant index for bbox: " + bounds + " (center = " + boundsCenter + ") is " + variabilityIndex);
                // COG.Log.info("distances  = " + delta);
                // COG.Log.info("optimal zoom levels: height = " + bestZoomH + ", width = " + bestZoomW);

                // return the lower of the two zoom levels
                return Math.min(isNaN(bestZoomH) ? maxZoom : bestZoomH, isNaN(bestZoomW) ? maxZoom : bestZoomW);
            },

            /**
            ### isEmpty(bounds)
            Returns true if the specified T5.Geo.BoundingBox is empty.
            */
            isEmpty: function(bounds) {
                return (! bounds) || posTools.empty(bounds.min) || posTools.empty(bounds.max);
            },
            
            /**
            ### toString(bounds)
            Returns a string representation of a Geo.BoundingBox
            */
            toString: function(bounds) {
                return "min: " + posTools.toString(bounds.min) + ", max: " + posTools.toString(bounds.max);
            }
        };
        
        return subModule;
    })();
    
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
                // from the freeform address extract the building number
                REGEX_BUILDINGNO.lastIndex = -1;
                if (REGEX_BUILDINGNO.test(freeform)) {
                    var buildingNo = freeform.replace(REGEX_BUILDINGNO, "$1");

                    // split up the number range
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

                // if the road type regular expression has not been initialised, then do that now
                if (! ROADTYPE_REGEX) {
                    var abbreviations = [];
                    for (var roadTypes in ROADTYPE_REPLACEMENTS) {
                        abbreviations.push(roadTypes);
                    } // for

                    ROADTYPE_REGEX = new RegExp("(\\s)(" + abbreviations.join("|") + ")(\\s|$)", "i");
                } // if

                // run the road type normalizations
                ROADTYPE_REGEX.lastIndex = -1;

                // get the matches for the regex
                var matches = ROADTYPE_REGEX.exec(addressText);
                if (matches) {
                    // get the replacement road type
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

    /* define the distance tools */
    
    // define the engines array
    var engines = {};
    
    /* private internal functions */
    
    function findEngine(capability, preference) {
        var matchingEngine = null;
        
        // iterate through the registered engines
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
        var eSinPhi = ECC * Math.sin(phi);

        return HALF_PI - (2 * Math.atan (t * Math.pow((1 - eSinPhi) / (1 + eSinPhi), ECC / 2)));
    } // findRadPhi
    
    function mercatorUnproject(t) {
        return HALF_PI - 2 * Math.atan(t);
    } // mercatorUnproject
    
    /*
    This function is used to determine the match weight between a freeform geocoding
    request and it's structured response.
    */
    function plainTextAddressMatch(request, response, compareFns, fieldWeights) {
        var matchWeight = 0;
        
        // uppercase the request for comparisons
        request = request.toUpperCase();
        
        // COG.Log.info("CALCULATING MATCH WEIGHT FOR [" + request + "] = [" + response + "]");
        
        // iterate through the field weights
        for (var fieldId in fieldWeights) {
            // get the field value
            var fieldVal = response[fieldId];

            // if we have the field value, and it exists in the request address, then add the weight
            if (fieldVal) {
                // get the field comparison function
                var compareFn = compareFns[fieldId],
                    matchStrength = compareFn ? compareFn(request, fieldVal) : (COG.wordExists(request, fieldVal) ? 1 : 0);

                // increment the match weight
                matchWeight += (matchStrength * fieldWeights[fieldId]);
            } // if
        } // for
        
        return matchWeight;
    } // plainTextAddressMatch
    
    function toRad(value) {
        return value * DEGREES_TO_RADIANS;
    } // toRad
    
    /* public functions */
    
    // define the module
    var module = {
        /* position, bounds and address utility modules */

        P: posTools,
        B: boundsTools,
        A: addrTools,

        /* geo type definitions */
        
        Radius: Radius,
        Position: Position,
        BoundingBox: BoundingBox,
        
        /**
        # T5.Geo.GeoVector
        
        The GeoVector class is used to convert a position (T5.Geo.Position) into a
        T5.Vector that can be used to draw on the various T5.ViewLayer implementations.
        This class provides the necessary mechanism that allows the view layers to 
        assume operation using a simple vector (containing an x and y) with no need
        geospatial awareness built in.  
        
        Layers are aware that particular events may 
        require vector resynchronization which is facilitated by the `syncVectors` 
        method of the T5.Geo.UI.GeoTileGrid (the T5.TileGrid has a placeholder 
        implementation).
        
        ## Usage
        
        <pre>
        var position = T5.Geo.P.parse("-27.468 153.028"),
            vector = new T5.Geo.GeoVector(position);
        </pre>
        
        ## Methods
        */
        GeoVector: function(initPos) {
            var self = new T5.Vector();
                
            function updatePos(newPos) {
                // update the internal variables
                self.pos = newPos;
                self.mercXY = posTools.toMercatorPixels(newPos);
            } // updatePos
            
            T5.ex(self, {
                radsPerPixel: null,
                
                /**
                ### setRadsPerPixel(radsPerPixel, offsetX, offsetY)
                */
                setRadsPerPixel: function(radsPerPixel, offsetX, offsetY) {
                    var mercXY = self.mercXY;

                    // calculate the x and y
                    self.x = Math.abs(
                        ((mercXY.x / radsPerPixel) >> 0) + 
                        (offsetX ? offsetX : 0));
                        
                    self.y = Math.abs(
                        ((mercXY.y / radsPerPixel) >> 0) + 
                        (offsetY ? offsetY : 0));

                    // update the rads per pixel
                    self.radsPerPixel = radsPerPixel;
                },
                
                /**
                ### updatePos(pos)
                Update the position of the T5.Geo.GeoVector
                */
                updatePos: updatePos
            });
            
            // initialise the position
            updatePos(initPos);
            return self;
        },
        
        /* addressing and geocoding support */
        
        // TODO: probably need to include local support for addressing, but really don't want to bulk out T5 :/
        
        Address: Address,
        GeocodeFieldWeights: {
            streetDetails: 50,
            location: 50
        },
        
        AddressCompareFns: {
        },
        
        /**
        # T5.Geo.Engine

        TODO
        */
        Engine: function(params) {
            // if the id for the engine is not specified, throw an exception
            if (! params.id) {
                throw new Error("A GEO.Engine cannot be registered without providing an id.");
            } // if

            // map the parameters directly to self
            var self = T5.ex({
                remove: function() {
                    delete engines[self.id];
                }
            }, params);

            // register the engine
            engines[self.id] = self;

            return self;
        },
        
        /**
        # T5.Geo.GeoSearchResult
        
        TODO
        */
        GeoSearchResult: function(params) {
            params = T5.ex({
                id: null,
                caption: "",
                resultType: "",
                data: null,
                pos: null,
                matchWeight: 0
            }, params);
            
            return T5.ex(params, {
                toString: function() {
                    return params.caption + (params.matchWeight ? " (" + params.matchWeight + ")" : "");
                }
            });
        },
        
        /**
        # T5.Geo.GeoSearchAgent
        
        TODO
        */
        GeoSearchAgent: function(params) {
            return new T5.Dispatcher.Agent(params);
        },
        
        /**
        # T5.Geo.GeocodingAgent
        
        TODO
        */
        GeocodingAgent: function(params) {
            
            function rankResults(searchParams, results) {
                // if freeform parameters then rank
                if (searchParams.freeform) {
                    results = module.rankGeocodeResponses(searchParams.freeform, results, module.getEngine("geocode"));
                } // if
                // TODO: rank structured results
                else {
                    
                }

                return results;
            } // rankResults
            
            // extend parameters with defaults
            params = T5.ex({
                name: "Geocoding Search Agent",
                paramTranslator: null,
                execute: function(searchParams, callback) {
                    try {
                        // check for a freeform request
                        if ((! searchParams.reverse) && (! searchParams.freeform)) {
                            address = new Address(searchParams);
                        } // if
                        
                        // get the geocoding engine
                        var engine = module.getEngine("geocode");
                        if (engine) {
                            engine.geocode({
                                addresses: [searchParams.freeform ? searchParams.freeform : address],
                                complete: function(requestAddress, possibleMatches) {
                                    if (callback) {
                                        callback(rankResults(searchParams, possibleMatches), params);
                                    } // if
                                }
                            });
                        } // if
                    } 
                    catch (e) {
                        COG.Log.exception(e);
                    } // try..catch
                }
            }, params);
            
            var self = new module.GeoSearchAgent(params);
            
            return self;
        }
    }; // module

    return T5.ex(module, moduleConstants, exportedFunctions);
})();/**
# T5.Geo.GeoHash
_module_


Geohash module c/o and copyright David Troy 2008 (http://davetroy.com/)
Original codebase available on github @ http://github.com/davetroy/geohash-js/
*/

T5.Geo.GeoHash = (function() {
    /* Start Dave's original code */
    
    // geohash.js
    // Geohash library for Javascript
    // (c) 2008 David Troy
    // Distributed under the MIT License
    
    BITS = [16, 8, 4, 2, 1];

    BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    NEIGHBORS = { right  : { even :  "bc01fg45238967deuvhjyznpkmstqrwx" },
                  left   : { even :  "238967debc01fg45kmstqrwxuvhjyznp" },
                  top    : { even :  "p0r21436x8zb9dcf5h7kjnmqesgutwvy" },
                  bottom : { even :  "14365h7k9dcfesgujnmqp0r2twvyx8zb" } };
    BORDERS   = { right  : { even : "bcfguvyz" },
                  left   : { even : "0145hjnp" },
                  top    : { even : "prxz" },
                  bottom : { even : "028b" } };

    NEIGHBORS.bottom.odd = NEIGHBORS.left.even;
    NEIGHBORS.top.odd = NEIGHBORS.right.even;
    NEIGHBORS.left.odd = NEIGHBORS.bottom.even;
    NEIGHBORS.right.odd = NEIGHBORS.top.even;

    BORDERS.bottom.odd = BORDERS.left.even;
    BORDERS.top.odd = BORDERS.right.even;
    BORDERS.left.odd = BORDERS.bottom.even;
    BORDERS.right.odd = BORDERS.top.even;

    function refine_interval(interval, cd, mask) {
        if (cd&mask)
            interval[0] = (interval[0] + interval[1])/2;
      else
            interval[1] = (interval[0] + interval[1])/2;
    }

    function calculateAdjacent(srcHash, dir) {
        srcHash = srcHash.toLowerCase();
        var lastChr = srcHash.charAt(srcHash.length-1);
        var type = (srcHash.length % 2) ? 'odd' : 'even';
        var base = srcHash.substring(0,srcHash.length-1);
        if (BORDERS[dir][type].indexOf(lastChr)!=-1)
            base = calculateAdjacent(base, dir);
        return base + BASE32[NEIGHBORS[dir][type].indexOf(lastChr)];
    }

    function decodeGeoHash(geohash) {
        var is_even = 1;
        var lat = []; var lon = [];
        lat[0] = -90.0;  lat[1] = 90.0;
        lon[0] = -180.0; lon[1] = 180.0;
        lat_err = 90.0;  lon_err = 180.0;

        for (i=0; i<geohash.length; i++) {
            c = geohash[i];
            cd = BASE32.indexOf(c);
            for (j=0; j<5; j++) {
                mask = BITS[j];
                if (is_even) {
                    lon_err /= 2;
                    refine_interval(lon, cd, mask);
                } else {
                    lat_err /= 2;
                    refine_interval(lat, cd, mask);
                }
                is_even = !is_even;
            }
        }
        lat[2] = (lat[0] + lat[1])/2;
        lon[2] = (lon[0] + lon[1])/2;

        return { latitude: lat, longitude: lon};
    }

    // DJO: added requestedPrecision as an optional parameter
    function encodeGeoHash(latitude, longitude, requestedPrecision) {
        var is_even=1;
        var i=0;
        var lat = []; var lon = [];
        var bit=0;
        var ch=0;
        var precision = requestedPrecision ? requestedPrecision : 12;
        geohash = "";

        lat[0] = -90.0;  lat[1] = 90.0;
        lon[0] = -180.0; lon[1] = 180.0;

        while (geohash.length < precision) {
          if (is_even) {
                mid = (lon[0] + lon[1]) / 2;
            if (longitude > mid) {
                    ch |= BITS[bit];
                    lon[0] = mid;
            } else
                    lon[1] = mid;
          } else {
                mid = (lat[0] + lat[1]) / 2;
            if (latitude > mid) {
                    ch |= BITS[bit];
                    lat[0] = mid;
            } else
                    lat[1] = mid;
          }

            is_even = !is_even;
          if (bit < 4)
                bit++;
          else {
                geohash += BASE32[ch];
                bit = 0;
                ch = 0;
          }
        }
        return geohash;
    }
    
    /* end Dave's code */
    
    return {
        decode: decodeGeoHash,
        encode: encodeGeoHash
    };
})();

/**
# T5.Geo.JSON
_module_


This module provides GeoJSON support for Tile5.
*/
T5.Geo.JSON = (function() {
    
    // define some constants
    var FEATURE_TYPE_COLLECTION = 'geometrycollection',
        VECTORIZE_OPTIONS = {
            async: false
        };
    
    // define the feature processors
    // TODO: think about the most efficient way to handle points...
    var featureProcessors = {
        linestring: processLineString,
        multilinestring: processMultiLineString,
        polygon: processPolygon,
        multipolygon: processMultiPolygon
    };
    
    /* feature processor functions */
    // TODO: consider supporting continuations here...
    
    function processLineString(layer, coordinates) {
        // TODO: check this is ok...
        var vectors = readVectors(coordinates);
        
        layer.add(new T5.Poly(vectors));        
    } // processLineString
    
    function processMultiLineString(layer, coordinates) {
        for (var ii = 0; ii < coordinates.length; ii++) {
            processLineString(layer, coordinates[ii]);
        } // for
    } // processMultiLineString
    
    function processPolygon(layer, coordinates) {
        // TODO: check this is ok...
        var vectors = readVectors(coordinates[0]);
        layer.add(new T5.Poly(vectors, {
            fill: true
        }));
    } // processPolygon
    
    function processMultiPolygon(layer, coordinates) {
        for (var ii = 0; ii < coordinates.length; ii++) {
            processPolygon(layer, coordinates[ii]);
        } // for
    } // processMultiPolygon
    
    /* other module level functions */
    
    function readVectors(coordinates) {
        // iterate through the coordinates and create a vector array
        var positions = readCoordinates(coordinates);
        
        return T5.Geo.P.vectorize(positions, VECTORIZE_OPTIONS);
    } // getLineStringVectors
    
    function readCoordinates(coordinates) {
        var count = coordinates.length,
            positions = new Array(count);
            
        // COG.Log.info('read ' + count + ' positions');
            
        for (var ii = count; ii--; ) {
            positions[ii] = new T5.Geo.Position(coordinates[ii][1], coordinates[ii][0]);
        } // for
        
        return positions;
    } // coordinates
    
    /* define the GeoJSON parser */
    
    var GeoJSONParser = function(data, callback, options) {
        options = T5.ex({
            vectorsPerCycle: T5.Geo.VECTORIZE_PER_CYCLE,
            rowPreParse: null,
            targetLayer: null
        }, options);
        
        // initialise variables
        var vectorsPerCycle = options.vectorsPerCycle,
            targetLayer = options.targetLayer,
            rowPreParse = options.rowPreParse,
            featureIndex = 0,
            totalFeatures = 0,
            childWorker = null,
            worker;

        // if we have no data, then exit
        if (! data) {
            return null;
        } // if
        
        // check that the data is in an array, if not, then make one
        if (typeof data.length === 'undefined') {
            data = [data];
        } // if
            
        /* parser functions */
        
        function featureToPoly(feature, callback) {
        } // featureToPrimitives

        function processData(tickCount, worker) {
            var cycleCount = 0,
                ii = featureIndex;
                
            // if we have a child worker active, then don't do anything in this worker
            if (childWorker) {
                return;
            }
            
            // COG.Log.info('processing data, featureIndex = ' + featureIndex + ', total features = ' + totalFeatures);
            for (; ii < totalFeatures; ii++) {
                // get the feature data
                // if a row preparser is defined, then use that
                var featureData = rowPreParse ? 
                        rowPreParse(data[ii]) : 
                        data[ii],
                    featureType = featureData.type ? featureData.type.toLowerCase() : null,
                    isCollection = featureType ? 
                        featureType === FEATURE_TYPE_COLLECTION :
                        false,
                    processor = featureProcessors[featureType],
                    processedCount = null;
                
                // COG.Log.info('processing feature ' + ii + ', type = ' + featureData.type + ', id = ' + featureData.id);
                
                // if the processor is defined, then run it
                if (processor) {
                    processedCount = processor(targetLayer, featureData.coordinates);
                } // if
                
                // increment the cycle count
                cycleCount += processedCount ? processedCount : 1;
                
                // increase the cycle counter and check that we haven't processed too many
                if (cycleCount >= vectorsPerCycle) {
                    break;
                } // if
            } // for
            
            // increment the feature index to the next feature after this loop
            featureIndex = ii + 1;
            
            // if we have finished, then tell the worker we are done
            if (featureIndex >= totalFeatures) {
                worker.trigger('complete');
            } // if
        } // processData
        
        /* run the parser */
        
        // save the total feature count
        totalFeatures = data.length;
        
        // if we don't have a target layer, then create one
        if (! targetLayer) {
            targetLayer = new T5.PolyLayer();
        } // if
        
        // create the worker
        worker = COG.Loopage.join({
            frequency: 10,
            execute: processData
        });
        
        // when the worker has completed, fire the callback
        worker.bind('complete', function(evt) {
            if (callback) {
                callback(targetLayer);
            } // if
        });
        
        return worker;
    };
    
    
    /* exported functions */
    
    function parse(data, callback, options) {
        return new GeoJSONParser(data, callback, options);
    } // parse
    
    /* module definition */
    
    var module = {
        parse: parse
    };
    
    return module;
})();

T5.Geo.LocationSearch = function(params) {
    params = T5.ex({
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
        var currentPos = new T5.Geo.Position(
                position.coords.latitude, 
                position.coords.longitude);

        return new T5.Geo.GeoSearchResult({
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
        
        // if we have a location timeout reset that
        if (locationTimeout) {
            clearTimeout(locationTimeout);
            locationTimeout = 0;
        } // if

        if (callback) {
            callback([searchResult], params);
        } // if
    } // sendPosition
    
    function trackingError(error) {
        COG.Log.info('caught location tracking error:', error);
    } // trackingError
    
    // initialise the geosearch agent
    var self = new T5.Geo.GeoSearchAgent(T5.ex({
        execute: function(searchParams, callback) {
            if (navigator.geolocation && (! geoWatchId)) {
                // watch for position updates
                geoWatchId = navigator.geolocation.watchPosition(
                    function(position) {
                        var newPosition = parsePosition(position);
                        
                        // if the new position is better than the last
                        // then update the last position
                        if ((! lastPosition) || (newPosition.accuracy < lastPosition.accuracy)) {
                            lastPosition = newPosition;
                        } // if
                        
                        // if we don't have a required accuracy or the last
                        // position is at a sufficient accuracy, then fire the 
                        // callback
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

                // implement the search timeout
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
# T5.Map
_extends:_ T5.Tiler


The Map class is the entry point for creating a tiling map.  Creating a 
map is quite simple and requires two things to operate.  A containing HTML5 canvas
that will be used to display the map and a T5.Geo.MapProvider that will populate 
the map.

## Example Usage: Creating a Map
    
<pre lang='javascript'>
// create the map
map = new T5.Map({
    container: 'mapCanvas',
    provider: new T5.Geo.Decarta.MapProvider();
});
</pre>
    
Like all View descendants the map supports features such as intertial scrolling and
the like and is configurable through implementing the GRUNT.configurable interface. For 
more information on view level features check out the View documentation.

## Methods
*/
T5.Map = function(params) {
    params = T5.ex({
        tapExtent: 10, // TODO: remove and use the inherited value
        provider: null,
        crosshair: false,
        zoomLevel: 0,
        boundsChangeThreshold: 30,
        zoomAnimation: T5.easing('quad.out')
    }, params);

    // define the locate modes
    var LOCATE_MODE = {
        NONE: 0,
        SINGLE: 1,
        WATCH: 2
    };
    
    // initialise variables
    var lastBoundsChangeOffset = new T5.Vector(),
        locationWatchId = 0,
        locateMode = LOCATE_MODE.NONE,
        initialized = false,
        tappedPOIs = [],
        annotations = null, // annotations layer
        guideOffset = null,
        locationOverlay = null,
        geoWatchId = 0,
        initialTrackingUpdate = true,
        zoomLevel = params.zoomLevel;
        
    // if the data provider has not been created, 
    // then create a default one
    if (! params.provider) {
        params.provider = new T5.Geo.MapProvider();
    } // if

    /* tracking functions */
    
    function trackingUpdate(position) {
        try {
            var currentPos = new T5.Geo.Position(
                        position.coords.latitude, 
                        position.coords.longitude),
                accuracy = position.coords.accuracy / 1000;
                
            self.trigger('locationUpdate', position, accuracy);

            // if this is the initial tracking update then 
            // create the overlay
            if (initialTrackingUpdate) {
                // if the geolocation annotation has not 
                // been created then do that now
                if (! locationOverlay) {
                    locationOverlay = new T5.Geo.UI.LocationOverlay({
                        pos: currentPos,
                        accuracy: accuracy
                    });

                    // if we want to display the location annotation, t
                    // then put it onscreen
                    locationOverlay.update(self.getTileLayer());
                    self.setLayer('location', locationOverlay);
                } // if

                // TODO: fix the magic number
                var targetBounds = T5.Geo.B.createBoundsFromCenter(
                        currentPos, 
                        Math.max(accuracy, 1));
                        
                self.gotoBounds(targetBounds);
            }
            // otherwise, animate to the new position
            else {
                // update location annotation details
                locationOverlay.pos = currentPos;
                locationOverlay.accuracy = accuracy;

                // tell the location annotation to update 
                // it's xy coordinate
                locationOverlay.update(self.getTileLayer());

                // pan to the position
                self.panToPosition(
                    currentPos, 
                    null, 
                    T5.easing('sine.out'));
            } // if..else

            initialTrackingUpdate = false;
        }
        catch (e) {
            COG.Log.exception(e);
        }
    } // trackingUpdate
    
    function trackingError(error) {
        COG.Log.info('caught location tracking error:', error);
    } // trackingError
    
    /* event handlers */
    
    function handleMarkerUpdate(evt, markers) {
        var grid = self.getTileLayer();
        
        for (var ii = markers.length; ii--; ) {
            grid.syncVectors([markers[ii].xy]);
        } // for
    } // handleMarkerUpdate
    
    function handlePan(evt, x, y) {
        if (locateMode === LOCATE_MODE.SINGLE) {
            self.trackCancel();
        } // if
    } // handlePan
    
    function handleTap(evt, absXY, relXY) {
        var grid = self.getTileLayer();
        var tapBounds = null;

        if (grid) {
            var gridPos = self.viewPixToGridPix(
                    new T5.Vector(relXY.x, relXY.y)),
                tapPos = grid.pixelsToPos(gridPos),
                minPos = grid.pixelsToPos(
                    T5.V.offset(
                        gridPos, 
                        -params.tapExtent, 
                        params.tapExtent)),
                maxPos = grid.pixelsToPos(
                    T5.V.offset(
                        gridPos,
                         params.tapExtent, 
                         -params.tapExtent));

            // turn that into a bounds object
            tapBounds = new T5.Geo.BoundingBox(minPos, maxPos);

            // find the pois in the bounds area
            // tappedPOIs = self.pois.findByBounds(tapBounds);
            // COG.Log.info('TAPPED POIS = ', tappedPOIs);
            
            self.trigger('geotap', absXY, relXY, tapPos, tapBounds);
            // self.trigger('tapPOI', tappedPOIs);
        } // if
    } // handleTap
    
    function handleDoubleTap(evt, absXY, relXY) {
        self.animate(2, 
            T5.D.getCenter(self.getDimensions()), 
            new T5.Vector(relXY.x, relXY.y), 
            params.zoomAnimation);
    } // handleDoubleTap
    
    function handleScale(evt, scaleAmount, zoomXY) {
        var zoomChange = 0;

        // damp the scale amount
        scaleAmount = Math.sqrt(scaleAmount);

        if (scaleAmount < 1) {
            zoomChange = -(0.5 / scaleAmount);
        }
        else if (scaleAmount > 1) {
            zoomChange = scaleAmount;
        } // if..else

        self.gotoPosition(
            self.getXYPosition(zoomXY), 
            zoomLevel + zoomChange >> 0);
    } // handleScale
    
    function handleIdle(evt) {
        var changeDelta = T5.V.absSize(T5.V.diff(
                lastBoundsChangeOffset, self.getOffset()));
        
        if (changeDelta > params.boundsChangeThreshold) {
            lastBoundsChangeOffset = T5.V.copy(self.getOffset());
            self.trigger("boundsChange", self.getBoundingBox());
        } // if
    } // handleIdle
    
    function handleProviderUpdate(name, value) {
        self.cleanup();
        initialized = false;
    } // handleProviderUpdate
    
    /* internal functions */
    
    // TODO: evaluate whether this function can be used for 
    // all mapping providers or we need to route this call to the provider
    function radsPerPixelAtZoom(tileSize, gxZoom) {
        return 2 * Math.PI / (tileSize << gxZoom);
    } // radsPerPixelAtZoom
    
    function getLayerScaling(oldZoom, newZoom) {
        return radsPerPixelAtZoom(1, oldZoom) / 
                    radsPerPixelAtZoom(1, newZoom);
    } // getLayerScaling
    
    /* public methods */
    
    // TODO: make sure tile requests are returned in the correct 
    // order and if a new request is issued while a request is completing
    // the previous results don't create a tile layer
    function gotoPosition(position, newZoomLevel, callback) {
        
        function updateTileGrid(tileGrid) {
            // update the tile layer to the use the new layer
            self.setTileLayer(tileGrid);

            // pan to the correct position
            self.panToPosition(position, function() {
                self.unfreeze();

                // trigger the zoom level change event
                self.trigger('zoomLevelChange', zoomLevel);

                if (callback) {
                    callback();
                } // if
            });

            // flag as initialized
            initialized = true;
        } // updateTileGrid
        
        // save the current zoom level
        var currentZoomLevel = zoomLevel,
            zoomScaling = getLayerScaling(zoomLevel, newZoomLevel),
            reset = ! initialized,
            currentBounds = self.getBoundingBox();
            
        if (currentBounds) {
            reset = reset || !T5.Geo.P.inBounds(
                position, 
                currentBounds);
            /*
            // TODO: get this right...
            if (reset) {
                self.clearBackground();
            }
            */
        } // if                        

        // if a new zoom level is specified, then use it
        zoomLevel = newZoomLevel ? newZoomLevel : zoomLevel;

        // if the zoom level is not defined, 
        // then raise an exception
        if (! zoomLevel) {
            throw new Error('Zoom level required to goto' + 
            ' a position.');
        } // if

        // check the zoom level is ok
        if (params.provider) {
            zoomLevel = params.provider.checkZoomLevel(zoomLevel);
        } // if
        
        // if the zoom level is different from the 
        // current zoom level, then update the map tiles
        if (reset || (zoomLevel !== currentZoomLevel)) {
            // remove the grid layer
            T5.Images.cancelLoad();
            
            // get the grid and if available, then 
            // deactivate to prevent further image draws
            var grid = self.getTileLayer();
            if (grid) {
                grid.deactivate();
            } // if

            // cancel any animations
            T5.cancelAnimation();

            // if the map is initialise, then pan to 
            // the specified position
            if (initialized) {
                self.freeze();
            } // if
            
            // update the provider zoom level
            params.provider.zoomLevel = zoomLevel;
            params.provider.getMapTiles(
                self, 
                position, 
                updateTileGrid);
        }
        // otherwise, just pan to the correct position
        else {
            self.panToPosition(position, callback);
        } // if..else
    } // gotoPosition
    
    /* public object definition */
    
    // provide the tiler (and view) an adjust scale factor handler
    params.adjustScaleFactor = function(scaleFactor) {
        var roundFn = scaleFactor < 1 ? Math.floor : Math.ceil;
        return Math.pow(2, roundFn(Math.log(scaleFactor)));
    };
    
    // initialise self
    var self = T5.ex({}, new T5.Tiler(params), {
        annotations: null,
        
        /** 
        - `getBoundingBox()`
        
        Return a Geo.BoundingBox for the current map view area
        */
        getBoundingBox: function() {
            var grid = self.getTileLayer(),
                offset = self.getOffset(),
                dimensions = self.getDimensions();

            if (grid) {
                return grid.getBoundingBox(
                            offset.x, 
                            offset.y, 
                            dimensions.width, 
                            dimensions.height);
            } // if
            
            return null;
        },

        /**
        - `getCenterPosition()`
        
        Return a Geo.Position for the center position of the map
        */
        getCenterPosition: function() {
            // get the position for the grid position
            return self.getXYPosition(
                T5.D.getCenter(self.getDimensions()));
        },
        
        /**
        - `getXYPosition(xy)`
        
        Convert the Vector that has been passed to the function to a
        Geo.Position object
        */
        getXYPosition: function(xy) {
            return self.getTileLayer().pixelsToPos(
                self.viewPixToGridPix(xy));
        },
        
        /**
        - `gotoBounds(bounds, callback)`
        
        TODO
        */
        gotoBounds: function(bounds, callback) {
            // calculate the zoom level required for the 
            // specified bounds
            var zoomLevel = T5.Geo.B.getZoomLevel(
                                bounds, 
                                self.getDimensions());
            
            // goto the center position of the bounding box 
            // with the calculated zoom level
            self.gotoPosition(
                T5.Geo.B.getCenter(bounds), 
                zoomLevel, 
                callback);
        },
        
        /**
        - `gotoPosition(position, zoomLevel, callback)`
        
        TODO
        */
        gotoPosition: gotoPosition,

        /**
        - `panToPosition(position, callback, easingFn)`
        
        This method is used to tell the map to pan (not zoom) to the specified 
        T5.Geo.Position.  An optional callback can be passed as the second
        parameter to the function and this fires a notification once the map is
        at the new specified position.  Additionally, an optional easingFn parameter
        can be supplied if the pan operation should ease to the specified location 
        rather than just shift immediately.  An easingDuration can also be supplied.
        */
        panToPosition: function(position, callback, easingFn, easingDuration) {
            var grid = self.getTileLayer();
            if (grid) {
                // determine the tile offset for the 
                // requested position
                var centerXY = grid.getGridXYForPosition(position),
                    dimensions = self.getDimensions();

                // determine the actual pan amount, by 
                // calculating the center of the viewport
                centerXY.x -= (dimensions.width / 2);
                centerXY.y -= (dimensions.height / 2);
                
                // if we have a guide layer snap to that
                if (guideOffset) {
                    guideOffset = null;
                } // if
                
                self.updateOffset(centerXY.x, centerXY.y, easingFn, easingDuration, callback);
                self.trigger("wake");

                // trigger a bounds change event
                self.trigger("boundsChange", self.getBoundingBox());

                // if we have a callback defined, then run it
                if (callback && (typeof easingFn === 'undefined')) {
                    callback(self);
                } // if
            } // if
        },
        
        /**
        - `locate()`
        
        TODO
        */
        locate: function() {
            // run a track start, but only allow 
            // it to run for a maximum of 30s 
            self.trackStart(LOCATE_MODE.SINGLE);
            
            // stop checking for location after 10 seconds
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
            
            // reset the locate mode
            locateMode = LOCATE_MODE.NONE;
            
            // reset the watch
            geoWatchId = 0;
        },
        
        /**
        - `getZoomLevel()`
        
        Get the current zoom level for the map
        */
        getZoomLevel: function() {
            return zoomLevel;
        },

        /**
        - `setZoomLevel(value: Integer)`
        
        Update the map's zoom level to the specified zoom level
        */
        setZoomLevel: function(value) {
            // if the current position is set, 
            // then goto the updated position
            try {
                self.gotoPosition(self.getCenterPosition(), value);
            }
            catch (e) {
                COG.Log.exception(e);
            }
        },

        /**
        - `zoomIn()`
        
        Zoom in one zoom level
        */
        zoomIn: function() {
            // determine the required scaling
            var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / 
                    radsPerPixelAtZoom(1, zoomLevel + 1);
            
            if (! self.scale(2, T5.easing('sine.out'))) {
                self.setZoomLevel(zoomLevel + 1);
            } // if
        },

        /**
        - `zoomOut()`
        
        Zoom out one zoom level
        */
        zoomOut: function() {
            var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / 
                    radsPerPixelAtZoom(1, zoomLevel - 1);
            
            if (! self.scale(0.5, T5.easing('sine.out'))) {
                self.setZoomLevel(zoomLevel - 1);
            } // if
        },

        /**
        - `animateRoute(easing, duration, callback, center)`
        
        TODO
        */
        animateRoute: function(easing, duration, callback, center) {
            // get the routing layer
            var routeLayer = self.getLayer('route');
            if (routeLayer) {
                // create the animation layer from the route
                var animationLayer = routeLayer.getAnimation(
                                        easing, 
                                        duration, 
                                        callback, 
                                        center);
                
                // add the animation layer
                if (animationLayer) {
                    animationLayer.addToView(self);
                }
            } // if
        }
    });
    
    // bind some event handlers
    self.bind('pan', handlePan);
    self.bind('tap', handleTap);
    self.bind('doubleTap', handleDoubleTap);
    self.bind('scale', handleScale);
    
    // watch for marker updates
    self.markers.bind('markerUpdate', handleMarkerUpdate);
    
    /* ANNOTATIONS LAYER TO BE DEPRECATED */

    // if we are drawing the cross hair, then add a cross hair overlay
    if (params.crosshair) {
        self.setLayer('crosshair', new CrosshairOverlay());
    } // if

    // listen for the view idling
    self.bind("idle", handleIdle);
    
    // make a few parameter configurable
    COG.configurable(
        self, 
        ["provider"], 
        COG.paramTweaker(params, null, {
            "provider": handleProviderUpdate
        }), 
        true);

    return self;
}; // T5.Map
/**
# T5.Geo.MapProvider
The MapProvider class is the base class from which all map providers are implemented.
The class provides a number of common functions that can be expected in most 
implementations of a GIS map provider.

## Properties

- `zoomLevel`

## Methods
*/
T5.Geo.MapProvider = function() {
    var zoomMin = 1,
        zoomMax = 20;
    
    // initailise self
    var self = {
        zoomLevel: 0,
        
        /**
        - `checkZoomLevel(zoomLevel)`
        
        Return the passed in zoom level if valid for the map provider, otherwise
        return a zoom level that is valid
        */
        checkZoomLevel: function(zoomLevel) {
            return Math.min(Math.max(zoomLevel, zoomMin), zoomMax);
        },
        
        /**
        - `getCopyright()`
        
        Return the copyright message for this map provider
        */
        getCopyright: function() {
        },
        
        /**
        - `getLogoUrl()`
        
        Return the url for an image logo that can be used with this map provider
        */
        getLogoUrl: function() {
        },

        /**
        - `getMapTiles(tiler, position, callback)`
        
        This is the engine room of a map provider.  An implementation of a map
        provider will provide an implementation of this method to fill a grid
        of map tiles for the specified tiler at the specified position.  The _callback_
        that is supplied to the function will be called once a Geo.GeoTileGrid has been 
        created from the map provider and that tilegrid will be passed through as the 
        only parameter to the callback
        */
        getMapTiles: function(tiler, position, callback) {

        },

        /**
        - `getZoomRange()`
        
        Return an object containing the .min and .max for the zoom of the map provider
        */
        getZoomRange: function() {
            return {
                min: zoomMin,
                max: zoomMax
            };
        },
        
        /**
        - `setZoomRange(min, max)`
        
        Set the min and max zoom range
        */
        setZoomRange: function(min, max) {
            zoomMin = min;
            zoomMax = max;
        }
    };

    return self;
}; // MapProvider

/**
# T5.Geo.Routing
_module_


Define functionality to enable routing for mapping

## Module Functions
*/
T5.Geo.Routing = (function() {
    
    /* internal functions */
    
    /*
    This function is used to cleanup a turn instruction that has been passed
    back from a routing engine.  At present it has been optimized to work with
    decarta instructions but will be modified to work with others in time
    */
    function markupInstruction(text) {
        // firstly replace all non breaking descriptions with suitable spaces
        text = text.replace(/(\w)(\/)(\w)/g, '$1 $2 $3');
        
        return text;
    } // markupInstruction
    
    // define the module
    var module = {
        /* module functions */
        
        /**
        ### calculate(args)
        To be completed
        */
        calculate: function(args) {
            args = T5.ex({
                engineId: "",
                waypoints: [],
                map: null,
                error: null,
                autoFit: true,
                success: null,
                // TODO: reimplement generalization...
                generalize: false
            }, args);
            
            // find an available routing engine
            var engine = T5.Geo.getEngine("route");
            if (engine) {
                engine.route(args, function(routeData) {
                    if (args.generalize) {
                        routeData.geometry = T5.Geo.P.generalize(routeData.geometry, routeData.getInstructionPositions());
                    } // if
                    
                    // firstly, if we have a map defined, then let's place the route on the map
                    // you know, just because we are nice like that
                    if (args.map) {
                        module.createMapOverlay(args.map, routeData);
                        
                        // if we are to auto fit the map to the bounds, then do that now
                        if (args.autoFit) {
                            // COG.Log.info("AUTOFITTING MAP TO ROUTE: bounds = " + routeData.boundingBox);
                            args.map.gotoBounds(routeData.boundingBox);
                        } // if
                    } // if
                    
                    // if we have a success handler, then call it
                    if (args.success) {
                        args.success(routeData);
                    } // if
                });
            } // if
        },
        
        /**
        ### createMapOverlay(map, routeData)
        To be completed
        */
        createMapOverlay: function(map, routeData) {
            // get the map dimensions
            var dimensions = map.getDimensions();

            // COG.Log.info("creating route overlay with route data: ", routeData);

            // create a new route overlay for the specified data
            var overlay = new T5.Geo.UI.RouteOverlay({
                data: routeData,
                width: dimensions.width,
                height: dimensions.height
            });

            // add the overlay to the map
            map.setLayer("route", overlay);
        },
        
        /**
        ### parseTurnType(text)
        To be completed
        */
        parseTurnType: function(text) {
            var turnType = module.TurnType.Unknown,
                rules = T5.Geo.Routing.TurnTypeRules;
            
            // run the text through the manuever rules
            for (var ii = 0; ii < rules.length; ii++) {
                rules[ii].regex.lastIndex = -1;
                
                var matches = rules[ii].regex.exec(text);
                if (matches) {
                    // if we have a custom check defined for the rule, then pass the text in 
                    // for the manuever result
                    if (rules[ii].customCheck) {
                        turnType = rules[ii].customCheck(text, matches);
                    }
                    // otherwise, take the manuever provided by the rule
                    else {
                        turnType = rules[ii].turnType;
                    } // if..else
                    
                    break;
                } // if
            } // for
            
            return turnType;
        },
        
        /**
        # T5.Geo.Routing.TurnType
        
        */
        TurnType: {
            Unknown: "turn-unknown",
            
            // continue maneuver
            Start: "turn-none-start",
            Continue: "turn-none",
            Arrive: "turn-none-arrive",
            
            // turn left maneuvers
            TurnLeft: "turn-left",
            TurnLeftSlight: "turn-left-slight",
            TurnLeftSharp: "turn-left-sharp",
            
            // turn right maneuvers
            TurnRight: "turn-right",
            TurnRightSlight: "turn-right-slight",
            TurnRightSharp: "turn-right-sharp",
            
            // merge maneuvers
            Merge: "merge",
            
            // uturn
            UTurnLeft:  "uturn-left",
            UTurnRight: "uturn-right",
            
            // enter roundabout maneuver
            EnterRoundabout: "roundabout-enter",
            
            // ramp maneuvers
            Ramp: "ramp",
            RampExit: "ramp-exit"
        },
        
        /**
        # T5.Geo.Routing.Instruction
        
        */
        Instruction: function(params) {
            params = T5.ex({
                position: null,
                description: "",
                distance: 0,
                distanceTotal: 0,
                time: 0,
                timeTotal: 0,
                turnType: null
            }, params);
            
            // parse the description
            params.description = markupInstruction(params.description);
            
            // if the manuever has not been defined, then attempt to parse the description
            if (! params.turnType) {
                params.turnType = module.parseTurnType(params.description);
            } // if
            
            return params;
        },
        
        
        /**
        # T5.Geo.Routing.RouteData
        
        */
        RouteData: function(params) {
            params = T5.ex({
                geometry: [],
                instructions: [],
                boundingBox: null
            }, params);
            
            // update the bounding box
            if (! params.boundingBox) {
                params.boundingBox = T5.Geo.B.forPositions(params.geometry);
            } // if
            
            var self = T5.ex({
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

/**
# T5.Geo.Search
_module_


Define functions for geo search operations

## Functions
*/
T5.Geo.Search = (function() {
    var DEFAULT_MAXDIFF = 20;
    
    var module = {
        bestResults: function(searchResults, maxDifference) {
            // if the threshold is not defined, use the default 
            if (! maxDifference) {
                maxDifference = DEFAULT_MAXDIFF;
            }
            
            // initialise variables
            var bestMatch = searchResults.length > 0 ? searchResults[0] : null,
                fnresult = [];
                
            // iterate through the search results and cull those that are 
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
# T5.Geo.UI
_module_


This module defines user interface elements for Tile5 geo elements
*/
T5.Geo.UI = (function() {
    var lastAnnotationTween = null,
        lastAnnotationTweenTicks = null,
        routeAnimationCounter = 0;
    
    // some base64 images
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
    
    function CrosshairOverlay(params) {
        params = T5.ex({
            size: 12,
            zindex: 150
        }, params);
        
        function drawCrosshair(context, centerPos, size) {
            var strokeStyles = ['#FFFFFF', '#333333'],
                lineWidths = [3, 1.5];
                
            context.lineCap = 'round';
                
            for (var ii = 0; ii < strokeStyles.length; ii++) {
                var lineSize = size; //  - (ii*2);
                
                // initialise the context line style
                context.lineWidth = lineWidths[ii];
                context.strokeStyle = strokeStyles[ii];

                context.beginPath();
                context.moveTo(centerPos.x, centerPos.y - lineSize);
                context.lineTo(centerPos.x, centerPos.y + lineSize);
                context.moveTo(centerPos.x - lineSize, centerPos.y);
                context.lineTo(centerPos.x + lineSize, centerPos.y);
                
                context.arc(
                    centerPos.x, 
                    centerPos.y, 
                    size * 0.6666, 
                    0, 
                    2 * Math.PI, 
                    false);
                    
                context.stroke();
            } // for
        } // drawCrosshair
        
        function createCrosshair() { 
            var newCanvas = T5.Images.newCanvas(params.size * 4, params.size * 4);

            // draw the cross hair
            drawCrosshair(
                newCanvas.getContext('2d'), 
                new T5.Vector(newCanvas.width / 2, newCanvas.height / 2), 
                params.size);
            
            // return the cross hair canvas
            return newCanvas;
        }
        
        var drawPos = null,
            crosshair = createCrosshair();
        
        return T5.ex(new T5.ViewLayer(params), {
            draw: function(context, offset, dimensions, state, view) {
                if (! drawPos) {
                    drawPos = T5.D.getCenter(dimensions);
                    drawPos = new T5.Vector(
                        Math.round(drawPos.x - crosshair.width / 2), 
                        Math.round(drawPos.y - crosshair.height / 2));
                } // if

                context.drawImage(crosshair, drawPos.x, drawPos.y);
            }
        });
    } // CrosshairOverlay
    
    var module = {
        // change this value to have the annotations tween in 
        // (eg. T5.easing('sineout'))
        AnnotationTween: null,
        
        /**
        # T5.Geo.UI.GeoTileGrid
        _extends:_ T5.TileGrid
        
        
        The GeoTileGrid class is used to __wrap__ and extend a standard T5.TileGrid and make 
        it "Geospatially aware".  Essentially a GeoTileGrid is initialized by passing an existing 
        TileGrid and a center position (T5.Geo.Position) and center xy coordinate (T5.Vector) and 
        this allows it to translate screen coordinates into latitude / longitude pairs.
        
        ## Constructor
        `new T5.Geo.UI.GeoTileGrid(params);`
        
        ### Initialization Params
        
        - `grid` (T5.TileGrid, default = null) the grid to wrap and make Geospatial aware
        
        - `centerPos` (T5.Geo.Position, default = empty pos) the latitude and longitude of the 
        center of the grid
        
        - `centerXY` (T5.Vector, default = empty vector) the center xy coordinate of the grid (relative 
        to the top left tile, xy coordinate = 0,0)
        
        - `radsPerPixel` (float, default = 0) the number of radians per pixel.  This value is used in 
        the calculation of screen coordinates to real world positions.  While for both the current map 
        provider implementations this value is the same, I expect it could vary from provider to provider.
        
        ## Methods
        */
        GeoTileGrid: function(params) {
            // extend the params with some defaults
            params = T5.ex({
                grid: null,
                centerPos: new T5.Geo.Position(),
                centerXY: new T5.Vector(),
                radsPerPixel: 0
            }, params);
            
            // determine the mercator 
            var radsPerPixel = params.radsPerPixel,
                centerMercatorPix = T5.Geo.P.toMercatorPixels(params.centerPos);
                
            // COG.Log.info("tile grid created, rads per pixel = " + radsPerPixel);
            
            // calculate the bottom left mercator pix
            // the position of the bottom left mercator pixel is 
            // determined by params.subtracting the actual 
            var blPixX = ((centerMercatorPix.x / radsPerPixel) - params.centerXY.x) >> 0,
                blPixY = ((centerMercatorPix.y / radsPerPixel) - params.centerXY.y) >> 0,
                tlPixY = null;
            
            // initialise self
            var self = T5.ex({}, params.grid, {
                /** 
                ### getBoundingBox(x, y, width, height)
                Return a T5.Geo.BoundingBox for specified area on the grid
                */
                getBoundingBox: function(x, y, width, height) {
                    return new T5.Geo.BoundingBox(
                        self.pixelsToPos(new T5.Vector(x, y + height)),
                        self.pixelsToPos(new T5.Vector(x + width, y)));
                },
                
                /** 
                ### getGridXYForPosition(pos)
                Returns a T5.Vector that relates to the grid position of the T5.Geo.Position value passed in 
                the pos parameter to the method.  This method is used extensively to calculate the position 
                that shapes / points should be drawn to the grid based on their geospatial position.
                */
                getGridXYForPosition: function(pos) {
                    var vector = new T5.Geo.GeoVector(pos);
                    self.syncVectors([vector]);
                    
                    return vector;
                },
                
                /**
                ### syncVectors
                This function iterates through the specified vectors and if they are
                of type T5.Geo.GeoVector, they are provided the rads per pixel of the
                grid so they can perform their calculations
                */
                syncVectors: function(vectors) {
                    for (var ii = vectors.length; ii--; ) {
                        if (vectors[ii] && vectors[ii].setRadsPerPixel) {
                            vectors[ii].setRadsPerPixel(radsPerPixel, -blPixX, -tlPixY);
                        } // if
                    }
                },
                
                /**
                ### getPixelDistance(distance)
                Convert a pixel distance to a real world distance
                */
                getPixelDistance: function(distance) {
                    var radians = T5.Geo.dist2rad(distance);
                    return radians / radsPerPixel >> 0;
                },
                
                /**
                ### pixelsToPos(vector)
                CBasically the opposite of the `getGridXYForPosition`.  Returns a T5.Geo.Position based on 
                the xy value of the T5.Vector that is passed to the method.  Very useful when you need to 
                translate screen / grid coordinates into a latitude longitude.  For instance, in the case 
                where the user clicks on the map and you need to know the latitude and longitude of that 
                click / touch.
                */
                pixelsToPos: function(vector) {
                    return T5.Geo.P.fromMercatorPixels(
                        (blPixX + vector.x) * radsPerPixel, 
                        ((blPixY + self.gridDimensions.height) -
                            vector.y) * radsPerPixel);
                }
            });
            
            tlPixY = blPixY + self.gridDimensions.height;
            return self;
        },
        
        /** 
        # T5.Geo.UI.RouteOverlay
        _extends:_ T5.PathLayer
        
        
        The RouteOverlay class is used to render the route geometry to the map.
        
        ## Constructor
        `new T5.Geo.UI.RouteOverlay(params)`
        
        ### Initialization Parameters
        To be completed
        */
        RouteOverlay: function(params) {
            params = T5.ex({
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

                    T5.Geo.P.vectorize(positions).bind(
                        'complete',
                        function(evt, coords) {
                            instructionCoords = coords;
                        });
                } // if
                
                if (params.data && params.data.geometry) {
                    T5.Geo.P.vectorize(params.data.geometry).bind(
                        'complete', 
                        function(evt, coords) {
                            coordinates = coords;
                            
                            // now update the coordinates
                            self.updateCoordinates(coordinates, instructionCoords, true);
                        });
                } // if
            } // vectorizeRoute
            
            // create the view layer the we will draw the view
            var self = new T5.PathLayer(params);
            
            // vectorize the data
            vectorizeRoute();
            return self;
        },
        
        /**
        # T5.Geo.UI.Poly
        _extends:_ T5.Poly
        
        
        This is a special type of T5.Poly that will take positions for the first
        argument of the constructor rather than vectors.  If the initialization
        parameter `autoParse` is set to true (which it is by default), this will 
        parsed by the T5.Geo.P.parse function and converted into a T5.Geo.GeoVector.
        
        ## Constructor
        `new T5.Geo.UI.Poly(positions, params);`
        
        ### Initialization Parameters
        - autoParse (boolean, default = true) - whether or not the values in the 
        positions array that is the first constructor argument should be run through
        the T5.Geo.P.parse function or not.  Note that this function is capable of 
        handling both string and T5.Geo.Position values as position values are
        simply passed straight through.
        
        */
        Poly: function(positions, params) {
            params = T5.ex({
                autoParse: true
            }, params);
            
            // initialise variables
            var vectors = new Array(positions.length),
                autoParse = params.autoParse,
                GeoVector = T5.Geo.GeoVector,
                parse = T5.Geo.P.parse;

            // iterate through the vectors and convert to geovectors
            for (var ii = positions.length; ii--; ) {
                vectors[ii] = new GeoVector(
                    autoParse ? parse(positions[ii]) : positions[ii]
                );
            } // for
            
            return new T5.Poly(vectors, params);
        },
        
        /**
        # T5.Geo.UI.Annotation
        
        __deprecated__ (see T5.ImageAnnotation)
        
        */
        Annotation: function(params) {
            params = T5.ex({
                pos: null
            }, params);
            
            params.xy = new T5.Geo.GeoVector(params.pos);
            return new T5.ImageAnnotation(params);
        },
        
        /**
        # T5.Geo.UI.LocationOverlay
        
        */
        LocationOverlay: function(params) {
            params = T5.ex({
                pos: null,
                accuracy: null,
                zindex: 90
            }, params);
            
            // initialise the locator icon image
            var iconImage = new Image(),
                iconOffset = new T5.Vector(),
                centerXY = new T5.Vector(),
                indicatorRadius = null;
                
            // load the image
            iconImage.src = LOCATOR_IMAGE;
            iconImage.onload = function() {
                iconOffset = new T5.Vector(
                    iconImage.width / 2, 
                    iconImage.height / 2);
            };
            
            var self = T5.ex(new T5.ViewLayer(params), {
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
                        indicatorRadius = Math.floor(grid.getPixelDistance(self.accuracy) * 0.5);
                        centerXY = grid.getGridXYForPosition(self.pos);
                        
                        self.changed();
                    } // if
                }
            });
            
            self.bind('gridUpdate', function(evt, grid) {
                self.update(grid);
            });
            
            return self;
        },
        
        /**
        # T5.Geo.UI.AnnotationsOverlay
        
        __deprecated__ (see T5.MarkerLayer)
        
        */
        AnnotationsOverlay: function(params) {
            params = T5.ex({
                pois: null,
                map: null,
                zindex: 100
            }, params);
            
            var annotations = [],
                animating = false,
                staticAnnotations = [];
                
            function createAnnotationForPOI(poi) {
                if (poi && poi.pos) {
                    var evt = {
                        poi: poi,
                        annotation: null
                    };
                    
                    if (params.map) {
                        params.map.trigger('getAnnotationForPOI', evt);
                    } // if
                        
                    if (! evt.annotation) {
                        evt.annotation = new T5.Annotation({
                            xy: new T5.Geo.GeoVector(poi.pos)
                        });
                    } // if
                    
                    if (evt.annotation) {
                        evt.annotation.isNew = poi.isNew;
                        poi.isNew = false;
                    } // if
                    
                    return evt.annotation;
                } // if
            } // createAnnotationForPOI
            
            function updateAnnotations(newPOIs) {
                try {
                    // reset the annotations array
                    annotations = [];
                    
                    // iterate through the pois and generate the annotations
                    for (var ii = 0; ii < newPOIs.length; ii++) {
                        if (newPOIs[ii].pos) {
                            var newAnnotation =
                                createAnnotationForPOI(newPOIs[ii]);
                                
                            if (newAnnotation) {
                                annotations.push(newAnnotation); 
                            } // if
                        } // if
                    } // for
                    
                    updateAnnotationCoordinates(annotations);
                }
                catch (e) {
                    COG.Log.exception(e);
                }
            } // updateAnnotations
            
            function updateAnnotationCoordinates(annotationsArray, grid) {
                var annotationsCount = annotationsArray.length,
                    parent = self.getParent();
                
                grid = grid ? grid : (parent ? parent.getTileLayer() : null);
                
                // iterate through the annotations and 
                // calculate the xy coordinates
                if (grid) {
                    for (var ii = annotationsCount; ii--; ) {
                        // update the annotation xy coordinates
                        grid.syncVectors([annotationsArray[ii].xy]);
                    } // for
                } // if
                
                // sort the array in the appropriate order
                annotationsArray.sort(function(itemA, itemB) {
                    var diff = itemB.xy.y - itemA.xy.y;
                    if (diff === 0) {
                        diff = itemB.xy.x - itemA.xy.x;
                    } // if
                    
                    return diff;
                });
            }

            // create the view layer the we will draw the view
            var self = T5.ex(new T5.ViewLayer(params), {
                cycle: function(tickCount, offset, state, redraw) {
                    return animating;
                },
                
                draw: function(context, offset, dimensions, state, view) {
                    // initialise variables
                    var ii;
                    
                    // reset animating to false
                    animating = false;
                    context.fillStyle = 'rgba(255, 0, 0, 0.75)';
                    context.globalCompositeOperation = 'source-over';
                
                    // iterate through the annotations and draw them
                    for (ii = annotations.length; ii--; ) {
                        annotations[ii].draw(
                            context, 
                            offset, 
                            state, 
                            self, 
                            view);
                            
                        animating = animating ||
                            annotations[ii].isAnimating();
                    } // for

                    for (ii = staticAnnotations.length; ii--; ) {
                        staticAnnotations[ii].draw(
                            context, 
                            offset, 
                            state, 
                            self, 
                            view);
                            
                        animating = animating ||
                            staticAnnotations[ii].isAnimating();
                    } // for
                    
                    return animating ? 1 : 0;
                },
                
                add: function(annotation) {
                    // if annotation is an array, then iterate through and add them
                    if (annotation && annotation.length) {
                        for (var ii = annotation.length; ii--; ) {
                            staticAnnotations[staticAnnotations.length] = annotation[ii];
                        } // for
                    }
                    else if (annotation) {
                        staticAnnotations[staticAnnotations.length] = annotation;
                    } // if..else
                    
                    // update the annotation coordinates
                    updateAnnotationCoordinates(staticAnnotations);
                    
                    // wake and invalidate the parent
                    self.changed();
                },
                
                clear: function(includeNonStatic) {
                    staticAnnotations = [];
                    updateAnnotationCoordinates(staticAnnotations);
                    
                    // if non static annotations should be cleared 
                    // also, then do it
                    if (includeNonStatic) {
                        annotations = [];
                        updateAnnotationCoordinates(annotations);
                    } // if
                    
                    // wake the parent
                    self.changed();
                }
            });

            COG.listen('geo.pois-updated', function(args) {
                // if the event source id matches our current 
                // poi storage, then apply updates
                if (params.pois && (params.pois.id == args.srcID)) {
                    updateAnnotations(args.pois);
                    self.changed();
                } // if
            });
            
            self.bind('gridUpdate', function(evt, grid) {
                updateAnnotationCoordinates(annotations, grid);
                updateAnnotationCoordinates(staticAnnotations, grid);
                
                self.changed();
            });
            
            return self;
        }
    };
    
    // TODO: remove this once clients have removed references
    module.ImageAnnotation = module.Annotation;
    
    return module;
})();
// EN-* manuever text matching rules 
T5.Geo.Routing.TurnTypeRules = (function() {
    var m = T5.Geo.Routing.TurnType,
        rules = [];
        
    rules.push({
        regex: /continue/i,
        turnType: m.Continue
    });
    
    rules.push({
        regex: /(take|bear|turn)(.*?)left/i,
        customCheck: function(text, matches) {
            var isSlight = (/bear/i).test(matches[1]);
            
            return isSlight ? m.TurnLeftSlight : m.TurnLeft;
        }
    });
    
    rules.push({
        regex: /(take|bear|turn)(.*?)right/i,
        customCheck: function(text, matches) {
            var isSlight = (/bear/i).test(matches[1]);
            
            return isSlight ? m.TurnRightSlight : m.TurnRight;
        }
    });
    
    rules.push({
        regex: /enter\s(roundabout|rotaty)/i,
        turnType: m.EnterRoundabout
    });
    
    rules.push({
        regex: /take.*?ramp/i,
        turnType: m.Ramp
    });
    
    rules.push({
        regex: /take.*?exit/i,
        turnType: m.RampExit
    });
    
    rules.push({
        regex: /make(.*?)u\-turn/i,
        customCheck: function(text, matches) {
            return (/right/i).test(matches[1]) ? m.UTurnRight : m.UTurnLeft;
        }
    });
    
    rules.push({
        regex: /proceed/i,
        turnType: m.Start
    });
    
    rules.push({
        regex: /arrive/i,
        turnType: m.Arrive
    });
    
    // "FELL THROUGH" - WTF!
    rules.push({
        regex: /fell\sthrough/i,
        turnType: m.Merge
    });
    
    return rules;
})();

