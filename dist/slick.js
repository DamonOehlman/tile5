/*!
 * Sidelab Slick Javascript Library v0.4.0

 * http://sidelab.com/projects/slick/
 *
 * Copyright 2010, Damon Oehlman
 * Licensed under the MIT licence
 * http://sidelab.com/projects/slick/license
 *
 * Date: ${date}
 */
 /* GRUNTJS START */
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

/* initialise javascript extensions */

if (! String.format) {
    String.format = function( text )
    {
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
    };    
} // if

String.prototype.containsWord = function(word) {
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
    
    return regex.test(this);
};

Number.prototype.toRad = function() {  // convert degrees to radians 
  return this * Math.PI / 180; 
}; // 

// include the secant method for Number
// code from the excellent number extensions library:
// http://safalra.com/web-design/javascript/number-object-extensions/
Number.prototype.sec = function() {
  return 1 / Math.cos(this);
};

/** @namespace */
GRUNT = (function() {
    var hasOwn = Object.prototype.hasOwnProperty,
        objectCounter = 0;
    
    // define the GRUNT module
    var module = {
        /** @lends GRUNT */
        
        id: "GRUNT.core",
        
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
        GRUNT.contains(foo, 'name'). 
        
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
        generateObjectID: function(prefix) {
            return (prefix ? prefix : "obj") + objectCounter++;
        }
    }; // module definition
    
    return module;
})();

GRUNT.Log = (function() {
    var listeners = [];
    var jsonAvailable = (typeof JSON !== 'undefined'),
        traceAvailable = window.console && window.console.markTimeline;
    
    function writeEntry(level, entryDetails) {
        // initialise variables
        var ii;
        var message = entryDetails && (entryDetails.length > 0) ? entryDetails[0] : "";
        
        // iterate through the remaining arguments and append them as required
        for (ii = 1; entryDetails && (ii < entryDetails.length); ii++) {
            message += " " + (jsonAvailable && GRUNT.isPlainObject(entryDetails[ii]) ? JSON.stringify(entryDetails[ii]) : entryDetails[ii]);
        } // for
        
        if (typeof console !== 'undefined') {
            console[level](message);
        } // if
        
        // if we have listeners, then tell them about the event
        for (ii = 0; ii < listeners.length; ii++) {
            listeners[ii].call(module, message, level);
        } // for
    } // writeEntry
    
    function detectCallerSection(target) {
        return null;
    } // detectCallerSection
    
    // define the module
    var module = {
        id: "GRUNT.log",
        
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

GRUNT.Data = (function() {
    
    var pdon = {
        determineObjectMapping: function(line) {
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
        },
        
        mapLineToObject: function(line, mapping) {
            // split the line on the pipe character
            var fields = line.split("|");
            var objectData = {};
            
            // iterate through the mapping and pick up the fields and assign them to the object
            for (var fieldName in mapping) {
                var fieldIndex = mapping[fieldName];
                objectData[fieldName] = fields.length > fieldIndex ? fields[fieldIndex] : null;
            } // for
            
            return objectData;
        },
        
        parse: function(data) {
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
                    objectMapping = pdon.determineObjectMapping(lineData);
                }
                // otherwise create an object from the object mapping
                else {
                    results.push(pdon.mapLineToObject(lineData, objectMapping));
                } // if..else
            } // for

            return results;
        }
    }; // pdon
    
    // define the module
    var module = {
        supportedFormats: {
            JSON: {
                parse: function(data) {
                    return JSON.parse(data);
                }
            },
            
            PDON: {
                parse: function(data) {
                    return pdon.parse(data);
                }
            }
        },
        
        parse: function(params) {
            params = GRUNT.extend({
                data: "",
                format: "JSON"
            }, params);
            
            // check that the format is supported, if not raise an exception
            if (! module.supportedFormats[params.format]) {
                throw new Error("Unsupported data format: " + params.format + ", cannot parse data in javascript object");
            } // if
            
            try {
                return module.supportedFormats[params.format].parse(params.data);
            } 
            catch (e) {
                GRUNT.Log.error("ERROR PARSING DATA FROM FORMAT: " + params.format, params.data);
                GRUNT.Log.exception(e);
            } // try..catch
            
            return {};
        }
    };
    
    return module;
})();


GRUNT.Template = (function() {
    var REGEX_TEMPLATE_VAR = /\$\{(.*?)\}/ig;
    
    // initialise module
    var module = {
        parse: function(template_html, data) {
            // initialise variables
            var fnresult = template_html;
            
            // look for template variables in the html
            var matches = REGEX_TEMPLATE_VAR.exec(fnresult);
            while (matches) {
                // remove the variable from the text
                fnresult = fnresult.replace(matches[0], GRUNT.XPath.first(matches[1], data));
                
                // find the next match
                REGEX_TEMPLATE_VAR.lastIndex = 0;
                matches = REGEX_TEMPLATE_VAR.exec(fnresult);
            } // while
            
            return fnresult;
        }
    };
    
    return module;
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
GRUNT.JSONP = (function(){
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
    
    function prepAndLoad(url, callback) {
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
 
        load(url + "callback=" + jsonp);
        return jsonp;
    } // jsonp
    
    return {
        get:prepAndLoad
    };
    
}());


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
GRUNT.XHR = (function() {
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
            // use the JSON object to convert the responseText to a JS object
            try {
                return JSON.parse(xhr.responseText);
            }
            catch (e) {
                GRUNT.Log.error("Error parsing JSON data: ", xhr.responseText);
                GRUNT.Log.exception(e);
            }
            
            return "";
        },
        
        PDON: function(xhr, requestParams) {
            return GRUNT.Data.parse({
                data: xhr.responseText,
                format: "PDON"
            });
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

    function processResponseData(xhr, requestParams) {
        // get the content type of the response
        var contentType = xhr.getResponseHeader(HEADERS.CONTENT_TYPE),
            processorId,
            matchedType = false;
        
        // GRUNT.Log.info("processing response data, content type = " + contentType);
        
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
            // GRUNT.Log.info("using processor: " + processorId + " to process response");
            return RESPONSE_TYPE_PROCESSORS[processorId](xhr, requestParams);
        }
        catch (e) {
            GRUNT.Log.warn("error applying processor '" + processorId + "' to response type, falling back to default");
            return RESPONSE_TYPE_PROCESSORS.DEFAULT(xhr, requestParams);
        } // try..catch
    } // processResponseData
    
    // define self
    var module = GRUNT.newModule({
        id: "GRUNT.xhr",
        
        ajaxSettings: {
            xhr: null
        },
        
        ajax: function(params) {
            // given that I am having to write my own AJAX handling, I think it's safe to assume that I should
            // do that in the context of a try catch statement to catch the things that are going to go wrong...
            try {
                params = GRUNT.extend({
                    method: "GET",
                    data: null,
                    url: null,
                    async: true,
                    success: null,
                    handleResponse: null,
                    error: null,
                    contentType: "application/x-www-form-urlencoded"
                }, module.ajaxSettings, params);
                
                // determine if this is a remote request (as per the jQuery ajax calls)
                var parts = REGEX_URL.exec(params.url),
                    remote = parts && (parts[1] && parts[1] !== location.protocol || parts[2] !== location.host);                
                
                // if we have data, then update the method to POST
                if (params.data) {
                    params.method = "POST";
                } // if

                // if the url is empty, then log an error
                if (! params.url) {
                    GRUNT.Log.warn("ajax request issued with no url - that ain't going to work...");
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

                // GRUNT.Log.info("opening request: " + JSON.stringify(params));

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
                
                xhr.onreadystatechange = function() {
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
                            GRUNT.Log.exception(e, "PROCESSING AJAX RESPONSE");
                        } // try..catch

                        // if the success callback is defined, then call it
                        // GRUNT.Log.info("received response, calling success handler: " + params.success);
                        if (success && responseData && params.success) {
                            params.success.call(this, responseData);
                        } // if
                    } // if
                }; // onreadystatechange

                // send the request
                // GRUNT.Log.info("sending request with data: " + module.param(params.data));
                xhr.send(params.method == "POST" ? module.param(params.data) : null);
            } 
            catch (e) {
                GRUNT.Log.exception(e);
            } // try..catch                    
        }, // ajax
        
        param: function(data) {
            // iterate through the members of the data and convert to a paramstring
            var params = [];
            var addKeyVal = function (key, value) {
                // If value is a function, invoke it and return its value
                value = GRUNT.isFunction(value) ? value() : value;
                params[ params.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
            };

            // If an array was passed in, assume that it is an array of form elements.
            if (GRUNT.isArray(data)) {
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
        }
    }); // self
    
    return module;
})();

GRUNT.XPath = (function() {
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
        GRUNT.Log.warn("No XPATH support, this is going to cause problems");
    } // if
    
    function xpath(expression, context, resultType) {
        // if the result type is not specified, then use any type
        if (! resultType) {
            resultType = XPathResult.ANY_TYPE;
        } // if
        
        try {
            // if the context node is not xml, then return null and raise a warning
            if (! GRUNT.isXmlDocument(context)) {
                GRUNT.Log.warn("attempted xpath expression: " + expression + " on a non-xml document");
                return null;
            } // if
            
            // return the value of the expression
            return context.evaluate(expression, context, namespaceResolver, resultType, null);
        } 
        catch (e) {
            GRUNT.Log.warn("attempted to run invalid xpath expression: " + expression + " on node: " + context);
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
                            GRUNT.Log.info("invoking match handler for result type: " + matches.resultType);
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

GRUNT.WaterCooler = (function() {
    // initialise variables
    var messageListeners = {};
    
    // define the module
    var module = {
        listen: function(message, callback) {
            // if we don't have a message listener array configured, then create one now
            if (! messageListeners[message]) {
                messageListeners[message] = [];
            } // if
            
            // add the callback to the listener queue
            if (callback) {
                messageListeners[message].push(callback);
            } // if
        },
        
        say: function(message, args) {
            // if we don't have any message listeners for that message, then return
            if (! messageListeners[message]) { return; }
            
            // iterate through the message callbacks
            for (var ii = 0; ii < messageListeners[message].length; ii++) {
                messageListeners[message][ii](args);
            } // for
        },
        
        leave: function() {
            
        }
    };
    
    return module;
})();

/* GRUNTJS END */
/**
@namespace 

The top level SLICK namespace.  This module contains core types and functionality for implementing 
*/
SLICK = (function () {
    var module = {
        /** @lends SLICK */
        
        copyRect: function(src) {
            return src ? new module.Rect(src.origin.x, src.origin.y, src.dimensions.width, src.dimensions.height) : null;
        },

        /** @namespace
        Core SLICK module for setting and retrieving application settings.
        - should possibly be moved to GRUNT as it's pretty useful for most applications
        */
        Settings: (function() {
            var currentSettings = {};
            
            // define self
            var self = {
                /** @lends SLICK.Settings */
                
                /** 
                @static
                Get a setting with the specified name
                
                @param {String} name the name of the setting to retrieve
                @returns the value of the setting if definied, undefined otherwise
                */
                get: function(name) {
                    return currentSettings[name];
                },
                
                /** @static */
                set: function(name, value) {
                    currentSettings[name] = value;
                },
                
                /** static */
                extend: function(params) {
                    GRUNT.extend(currentSettings, params);
                }
            };
            
            return self;
        })(),
        
        Clock: (function() {
            var ticks = null;
            
            return {
                // TODO: reduce the number of calls to new date get time
                getTime: function(cached) {
                    return (cached && ticks) ? ticks : ticks = new Date().getTime();
                }
            };
        })(),
        
        /**
        Initialise a new Vector instance
        
        @param {Number} init_x the Initial x value for the Vector
        @param {Number} init_y the Initial y value for the Vector

        @class 
        @name SLICK.Vector
        */
        Vector: function(initX, initY) {
            return {
                x: initX ? initX : 0,
                y: initY ? initY : 0
            };
        }, // Vector
        
        V: (function() {
            return {
                create: function(x, y) {
                    return new module.Vector(x, y);
                },
                
                add: function() {
                    var fnresult = new module.Vector();
                    for (var ii = arguments.length; ii--; ) {
                        fnresult.x += arguments[ii].x;
                        fnresult.y += arguments[ii].y;
                    } // for
                    
                    return fnresult;
                },
                
                absSize: function(vector) {
                    return Math.max(Math.abs(vector.x), Math.abs(vector.y));
                },
                
                diff: function(v1, v2) {
                    return new module.Vector(v1.x - v2.x, v1.y - v2.y);
                },
                
                copy: function(src) {
                    return src ? new module.Vector(src.x, src.y) : null;
                },
                
                invert: function(vector) {
                    return new SLICK.Vector(-vector.x, -vector.y);
                },
                
                offset: function(vector, offsetX, offsetY) {
                    return new SLICK.Vector(vector.x + offsetX, vector.y + (offsetY ? offsetY : offsetX));
                }
            };
        })(),
        
        VectorArray: function(srcArray, copy) {
            var data = new Array(srcArray.length);
            
            // copy the source array
            for (var ii = srcArray.length; ii--; ) {
                data[ii] = copy ? module.V.copy(srcArray[ii]) : srcArray[ii];
            } // for
            
            return {
                applyOffset: function(offset) {
                    for (var ii = data.length; ii--; ) {
                        data[ii].x += offset.x;
                        data[ii].y += offset.y;
                    } // for
                },
                
                getRect: function() {
                    return new SLICK.Rect(
                        Math.min(data[0].x, data[1].x),
                        Math.min(data[0].y, data[1].y),
                        Math.abs(data[0].x - data[1].x),
                        Math.abs(data[0].y - data[1].y)
                    );
                },
                
                toString: function() {
                    var fnresult = "";
                    for (var ii = data.length; ii--; ) {
                        fnresult += "[" + data[ii].toString() + "] ";
                    } // for
                    
                    return fnresult;
                }
            };
        },
        
        VectorMath: (function() {
            function edges(vectors) {
                if ((! vectors) || (vectors.length <= 1)) {
                    throw new Error("Cannot determine edge distances for a vector array of only one vector");
                } // if
                
                var fnresult = {
                    edges: new Array(vectors.length - 1),
                    accrued: new Array(vectors.length - 1),
                    total: 0
                };
                
                var diffFn = SLICK.V.diff;
                
                // iterate through the vectors and calculate the edges
                // OPTMIZE: look for speed up opportunities
                for (var ii = 0; ii < vectors.length-1; ii++) {
                    var diff = diffFn(vectors[ii], vectors[ii + 1]);
                    
                    fnresult.edges[ii] = Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
                    fnresult.accrued[ii] = fnresult.total + fnresult.edges[ii];
                    fnresult.total += fnresult.edges[ii];
                } // for
                
                return fnresult;
            } // edges
            
            return {
                edges: edges,
                distance: function(vectors) {
                    return edges(vectors).total;
                },
                
                theta: function(v1, v2, distance) {
                    var theta = Math.asin((v1.y - v2.y) / distance);
                    return v1.x > v2.x ? theta : Math.PI -theta;
                },
                
                pointOnEdge: function(v1, v2, theta, delta) {
                    var xyDelta = new SLICK.Vector(Math.cos(theta) * delta, Math.sin(theta) * delta);
                    
                    return new SLICK.Vector(v1.x - xyDelta.x, v1.y - xyDelta.y);
                }
            };
        })(),
        
        /**
        @class
        */
        Dimensions: function(init_width, init_height) {
            // initialise variables

            // calculate the aspect ratio
            var init_aspect_ratio = init_height ? (init_width / init_height) : 1;

            // intiialise self
            var self = {
                /** lends SLICK.Dimensions */
                
                width: init_width,
                height: init_height,
                aspect_ratio: init_aspect_ratio,
                inv_aspect_ratio: 1 / init_aspect_ratio,

                getAspectRatio: function() {
                    return self.height !== 0 ? self.width / self.height : 1;
                },

                getCenter: function() {
                    return new SLICK.Vector(self.width >> 1, self.height >> 1);
                },
                
                grow: function(widthDelta, heightDelta) {
                    return new SLICK.Dimensions(self.width + widthDelta, self.height + heightDelta);
                },
                
                matches: function(test) {
                    return test && (self.width == test.width) && (self.height == test.height);
                },
                
                toString: function() {
                    return self.width + " x " + self.height;
                }
            }; // self

            return self;
        }, // Dimensions
        
        /** @class */
        Rect: function(x, y, width, height) {
            // TODO: move dimensions access through setters and getters so half width can be calculated once and only when required
            
            var self = {
                /** @lends SLICK.Rect */
                
                origin: new SLICK.Vector(x, y),
                dimensions: new SLICK.Dimensions(width, height),
                
                getCenter: function() {
                    return new SLICK.Vector(self.origin.x + (self.dimensions.width >> 1), self.origin.y + (self.dimensions.height >> 1));
                },
                
                getSize: function() {
                    return Math.sqrt(Math.pow(self.dimensions.width, 2) + Math.pow(self.dimensions.height, 2));
                },
                
                grow: function(new_width, new_height) {
                    var growFactor = new SLICK.Dimensions(new_width - self.dimensions.width, new_height - self.dimensions.height);
                    
                    self.dimensions.width = new_width;
                    self.dimensions.height = new_height;
                    
                    return growFactor;
                },
                
                expand: function(amountX, amountY) {
                    self.origin.x -= amountX;
                    self.origin.y -= amountY;
                    self.dimensions.width += amountX;
                    self.dimensions.height += amountY;
                },
                
                offset: function(offsetVector) {
                    return new module.Rect(
                                    self.origin.x + offsetVector.x, 
                                    self.origin.y + offsetVector.y,
                                    self.dimensions.width,
                                    self.dimensions.height);
                },
                
                /**
                The alignTo function is used to determine the 
                delta amounts required to adjust the rect to the specified target rect.  
                
                @returns a hash object containing the following parameters
                 - top: the delta change to adjust the top to the target rect,
                 - left: the delta change to adjust the left
                 - bottom: the delta bottom change
                 - right: the delta right change
                */
                getRequiredDelta: function(targetRect, offset) {
                    var delta = {
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0
                    }; // delta
                    
                    // calculate the top left delta
                    delta.top = targetRect.origin.y - self.origin.y + (offset ? offset.y : 0);
                    delta.left = targetRect.origin.x - self.origin.x + (offset ? offset.x : 0);
                    
                    // calculate the bottom right delta
                    delta.right = (targetRect.origin.x + targetRect.dimensions.width) - (self.origin.x + self.dimensions.width) - delta.left;
                    delta.bottom = (targetRect.origin.y + targetRect.dimensions.height) - (self.origin.y + self.dimensions.height) - delta.top;

                    return delta;
                },
                
                /**
                Apply a delta that was previously calculated using the getRequiredDelta function or one you determined
                yourself, given you are of course smart enough ;)
                
                @memberOf SLICK.Rect#
                @param {Object} delta the delta to apply in the form of a named hash (top, left, bottom, right)
                @param {Number} scalingFactor a scaling factor to apply to the delta transformation (optional)
                @param {Number} aspectRatio the aspect ratio to constrain the transformation by - if specified, the height will be automatically calculated (optional)
                */
                applyDelta: function(delta, scalingFactor, aspectRatio) {
                    // check the delta
                    if ((! delta) || (! GRUNT.contains(delta, ["top", "left", "bottom", "right"]))) {
                        throw new Error("Invalid delta - cannot apply to SLICK.Rect");
                    } // if
                    
                    // if the scaling factor is not assigned, then default to 1
                    if (! scalingFactor) {
                        scalingFactor = 1;
                    } // if
                    
                    // adjust the top left
                    self.origin.x += (delta.left * scalingFactor);
                    self.origin.y += (delta.top * scalingFactor);
                    
                    // adjust the width and height
                    self.dimensions.width += (delta.right * scalingFactor);
                    self.dimensions.height += (delta.bottom * scalingFactor);
                    
                    // if the aspect ratio is specified, then calculate the difference required to match the aspect ratio
                    // and apply a subsequent delta
                    if (aspectRatio) {
                        self.constrainAspectRatio(aspectRatio);
                    } // if
                },
                
                /**
                Calculate and apply a delta to keep the rect at the specified aspect ratio.  In all cases, the size 
                of the rect is increased to match the aspect ratio and not reduced.
                
                // TODO: update this function to keep the rect centered...
                */
                constrainAspectRatio: function(aspectRatio) {
                    // get the current aspect ratio
                    var adjustment = 0;
                    var currentAspect = self.dimensions.getAspectRatio();
                    var delta = {top: 0, left: 0, bottom: 0, right: 0};
                    
                    // if the current aspect ratio is less than the desired, then increase the width
                    if (currentAspect < aspectRatio) {
                        adjustment = Math.abs(self.dimensions.width - (self.dimensions.height * aspectRatio));
                        
                        // apply the adjustments
                        delta.left = -adjustment;
                        delta.right = adjustment;
                    }
                    // otherwise, increase the height
                    else {
                        adjustment = Math.abs(self.dimensions.height - (self.dimensions.width / aspectRatio));
                        
                        delta.top = -adjustment;
                        delta.bottom = adjustment;
                    } // if..else
                    
                    // apply the delta
                    self.applyDelta(delta);
                },
                
                moveTo: function(x, y) {
                    var offsetFactor = new SLICK.Vector(x - self.origin.x, y - self.origin.y);
                    
                    self.origin.x = x;
                    self.origin.y = y;
                    
                    return offsetFactor;
                },
                
                toString: function() {
                    return String.format("(origin: {0}, dimensions: {1})", self.origin, self.dimensions);
                }
            };
            
            return self;
        }
    };
    
    return module;
})();

SLICK.Device = (function() {
    var deviceConfigs = null,
        deviceCheckOrder = [],
        detectedConfig = null;
    
    function loadDeviceConfigs() {
        deviceConfigs = {
            base: {
                name: "Unknown",
                eventTarget: document,
                supportsTouch: "createTouch" in document,
                // TODO: remove this (it's just for testing)
                imageCacheMaxSize: 4 * 1024,
                getScaling: function() {
                    return 1;
                },
                // TODO: reset this back to null after testing
                maxImageLoads: 4,
                requireFastDraw: false
            },
            
            ipod: {
                name: "iPod Touch",
                regex: /ipod/i,
                imageCacheMaxSize: 6 * 1024,
                maxImageLoads: 4,
                requireFastDraw: true
            },

            iphone: {
                name: "iPhone",
                regex: /iphone/i,
                imageCacheMaxSize: 6 * 1024,
                maxImageLoads: 4
            },

            ipad: {
                name: "iPad",
                regex: /ipad/i,
                imageCacheMaxSize: 6 * 1024
            },

            android: {
                name: "Android OS <= 2.1",
                regex: /android/i,
                eventTarget: document.body,
                supportsTouch: true,
                getScaling: function() {
                    // TODO: need to detect what device dpi we have instructed the browser to use in the viewport tag
                    return 1 / window.devicePixelRatio;
                }
            },
            
            froyo: {
                name: "Android OS >= 2.2",
                regex: /froyo/i,
                eventTarget: document.body,
                supportsTouch: true
            }
        };
        
        // initilaise the order in which we will check configurations
        deviceCheckOrder = [
            deviceConfigs.froyo,
            deviceConfigs.android,
            deviceConfigs.ipod,
            deviceConfigs.iphone,
            deviceConfigs.ipad
        ];
    } // loadDeviceConfigs
    
    var module = {
        getConfig: function() {
            if (! deviceConfigs) {
                loadDeviceConfigs();
            } // if
            
            // if the device configuration hasn't already been detected do that now
            if (! detectedConfig) {
                GRUNT.Log.info("ATTEMPTING TO DETECT PLATFORM: UserAgent = " + navigator.userAgent);

                // iterate through the platforms and run detection on the platform
                for (var ii = 0; ii < deviceCheckOrder.length; ii++) {
                    var testPlatform = deviceCheckOrder[ii];

                    if (testPlatform.regex && testPlatform.regex.test(navigator.userAgent)) {
                        detectedConfig = GRUNT.extend({}, deviceConfigs.base, testPlatform);
                        GRUNT.Log.info("PLATFORM DETECTED AS: " + detectedConfig.name);
                        break;
                    } // if
                } // for

                if (! detectedConfig) {
                    GRUNT.Log.warn("UNABLE TO DETECT PLATFORM, REVERTING TO BASE CONFIGURATION");
                    detectedConfig = deviceConfigs.base;
                }
                
                GRUNT.Log.info("CURRENT DEVICE PIXEL RATIO = " + window.devicePixelRatio);
            } // if
            
            return detectedConfig;
        }
    };
    
    return module;
})();

SLICK.Resources = (function() {
    var basePath = "",
        cachedSnippets = {},
        cachedResources = {};
        
    var ImageLoader = (function() {
        // initialise image loader internal variables
        var images = {},
            loadWatchers = {},
            imageCounter = 0,
            queuedImages = [],
            loadingImages = [],
            cachedImages = [],
            imageCacheFullness = 0,
            clearingCache = false;
            
        function handleImageLoad() {
            // get the image data
            var imageData = loadWatchers[this.id];
            if (imageData) {
                imageData.loaded = true;
                imageData.hitCount = 1;
                
                // remove the image data from the loading images array
                for (var ii = loadingImages.length; ii--; ) {
                    if (loadingImages[ii].image.src == this.src) {
                        loadingImages.splice(ii, 1);
                        break;
                    } // if
                } // for
                
                // if the image data has a callback, fire it
                if (imageData.loadCallback) {
                    imageData.loadCallback(this, false);
                } // if
                
                // add the image to the cached images
                cachedImages.push({
                    url: this.src,
                    created: imageData.requested
                });
                
                // remove the item from the load watchers
                delete loadWatchers[this.id];
                
                // load the next image
                loadNextImage();
            } // if
        } // handleImageLoad
        
        function loadNextImage() {
            var maxImageLoads = SLICK.Device.getConfig().maxImageLoads;

            // if we have queued images and a loading slot available, then start a load operation
            while ((queuedImages.length > 0) && ((! maxImageLoads) || (loadingImages.length < maxImageLoads))) {
                var imageData = queuedImages.shift();
                
                // add the image data to the loading images
                loadingImages.push(imageData);

                // reset the queued flag and attempt to load the image
                imageData.image.onload = handleImageLoad;
                imageData.image.src = imageData.url;
                imageData.requested = new Date().getTime();
            } // if
        } // loadNextImage
        
        function cleanupImageCache() {
            clearingCache = true;
            try {
                var halfLen = Math.floor(cachedImages.length * 0.5);
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
            
            GRUNT.WaterCooler.say("imagecache.cleared");
        } // cleanupImageCache

        function checkTimeoutsAndCache() {
            var currentTickCount = new Date().getTime(),
                timedOutLoad = false, ii = 0,
                config = SLICK.Device.getConfig();
            
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
        
        var subModule = {
            loadingImages: loadingImages,
            queuedImages: queuedImages,
            
            getCacheFullness: function() {
                return imageCacheFullness;
            },
            
            getImage: function(url) {
                var imageData = null;
                if (! clearingCache) {
                    imageData = images[url];
                } // if

                // return the image from the image data
                return imageData ? imageData.image : null;
            },
            
            loadImage: function(url, callback) {
                // look for the image data
                var imageData = images[url];

                // if the image data is not defined, then create new image data
                if (! imageData) {
                    // initialise the image data
                    imageData = {
                        url: module.getPath(url),
                        image: new Image(),
                        loaded: false,
                        created: new Date().getTime(),
                        requested: null,
                        hitCount: 0,
                        loadCallback: callback
                    };
                    
                    // initialise the image id
                    imageData.image.id = "resourceLoaderImage" + (imageCounter++);
                    
                    // add the image to the images lookup
                    images[url] = imageData;
                    loadWatchers[imageData.image.id] = imageData;
                    
                    // add the image to the queued images
                    queuedImages.push(imageData);
                    
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
            },
            
            resetLoadingQueue: function() {
                loadingImages = [];
            }
        }; // 
        
        setInterval(checkTimeoutsAndCache, 1000);
        
        return subModule;
    })();
    
    var module = {
        avgImageSize: 25,
        loadTimeout: 10,
        
        Cache: (function() {
            // initailise self
            var self = {
                read: function(key) {
                    return null;
                },

                write: function(key, data) {
                },
                
                getUrlCacheKey: function(url, sessionParamRegex) {
                    // get the url parameters
                    var queryParams = (url ? url.replace(/^.*\?/, "") : "").split("&");
                    var coreUrl = url ? url.replace(/\?.*$/, "?") : "";

                    // iterate through the query params and weed out any session params
                    for (var ii = 0; ii < queryParams.length; ii++) {
                        var kv = queryParams[ii].split("=");

                        if ((! sessionParamRegex) || (! sessionParamRegex.test(kv[0]))) {
                            coreUrl += queryParams[ii] + "&";
                        } // if
                    } // for

                    return coreUrl.replace(/\W/g, "");
                },

                isValidCacheKey: function(cacheKey) {
                    GRUNT.Log.info("cache key = " + cacheKey);

                    return false;
                }
            };
            
            return self;
        })(),
        
        // TODO: if we have something like phonegap available, maybe look at using it to get the resource and save it locally
        getCachedUrl: function(url, sessionParams) {
           return url;
        },
        
        getPath: function(path) {
            // if the path is an absolute url, then just return that
            if (/^(https?|\/)/.test(path)) {
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

        getImage: function(url) {
            return ImageLoader.getImage(url);
        },

        loadImage: function(url, callback) {
            ImageLoader.loadImage(url, callback);
        },
        
        resetImageLoadQueue: function() {
            ImageLoader.resetLoadingQueue();
        },
        
        getStats: function() {
            return {
                imageLoadingCount: ImageLoader.loadingImages.length,
                queuedImageCount: ImageLoader.queuedImages.length,
                imageCacheFullness: ImageLoader.getCacheFullness()
            };
        },
        
        loadResource: function(params) {
            // extend parameters with defaults
            params = GRUNT.extend({
                filename: "",
                cacheable: true,
                dataType: null,
                callback: null
            }, params);
            
            var callback = function(data) {
                if (params.callback) {
                    GRUNT.Log.watch("CALLING RESOURCE CALLBACK", function() {
                        params.callback(data);
                    });
                } // if
            };
            
            if (params.cacheable && cachedResources[params.filename]) {
                callback(cachedResources[params.filename]); 
            }
            else {
                GRUNT.XHR.ajax({
                    url: module.getPath(params.filename),
                    dataType: params.dataType,
                    success: function(data) {
                        // GRUNT.Log.info("got data: " + data);
                        // add the snippet to the cache
                        if (params.cacheable) {
                            cachedResources[params.filename] = data;
                        }
                        
                        // trigger the callback
                        callback(data);
                    },
                    error: function(raw_request, textStatus, error_thrown) {
                        GRUNT.Log.error("error loading resource [" + params.filename + "], error = " + error_thrown);
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

SLICK.Touch = (function() {
    // initialise constants
    var PANREFRESH = 5;
    var TOUCH_MODES = {
        TAP: 0,
        MOVE: 1, 
        PINCHZOOM: 2
    }; // TOUCH_MODES

    // TODO: configure the move distance to be screen size sensitive....
    var MIN_MOVEDIST = 7;

    var elementCounter = 0,
        listenerCount = 0;
    
    function calcDistance(touches) {
        return SLICK.VectorMath.distance(touches);
    } // calcDistance
    
    function calcChange(first, second) {
        var srcVector = (first && (first.length > 0)) ? first[0] : null;
        if (srcVector && second && (second.length > 0)) {
            return SLICK.V.diff(srcVector, second[0]);
        } // if
        
        return null;
    } // calcChange
    
    function preventDefaultTouch(evt) {
        evt.preventDefault();
        evt.stopPropagation();
    } // preventDefaultTouch
    
    function getTouchPoints(touches) {
        var fnresult = new Array(touches.length);
        for (var ii = touches.length; ii--; ) {
            fnresult[ii] = new SLICK.Vector(touches[ii].pageX, touches[ii].pageY);
        } // for
        
        return fnresult;
    } // getTouchPoints
    
    function getMousePos(event) {
        return [new SLICK.Vector(event.pageX, event.pageY)];
    } // getMousePos
    
    function debugTouchEvent(evt, title) {
        GRUNT.Log.info("TOUCH EVENT '" + title + "':", evt);
        GRUNT.Log.info("TOUCH EVENT '" + title + "': touches = ", evt.touches);
        GRUNT.Log.info("TOUCH EVENT '" + title + "': targetTouches = ", evt.targetTouches);
        GRUNT.Log.info("TOUCH EVENT '" + title + "': changedTouches = ", evt.changeTouches);
    } // debugTouchEvent
    
    var module_types = {
        TouchHelper: function(params) {
            params = GRUNT.extend({
                element: null,
                inertiaTrigger: 20,
                maxDistDoubleTap: 20,
                panEventThreshhold: 0,
                pinchZoomThreshold: 5,
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
                supportsTouch = SLICK.Device.getConfig().supportsTouch,
                touchesStart = null,
                touchesLast = null,
                touchDelta = null,
                totalDelta = null,
                panDelta = new SLICK.Vector(),
                touchMode = null,
                touchDown = false,
                listeners = [],
                ticks = {
                    current: 0,
                    last: 0
                },
                config = SLICK.Device.getConfig(),
                BENCHMARK_INTERVAL = 300;
                
            function relativeTouches(touches) {
                var fnresult = new SLICK.VectorArray(touches, true);
                
                // apply the offset
                if (params.element) {
                    fnresult.applyOffset(new SLICK.Vector(-params.element.offsetLeft, -params.element.offsetTop));
                } // if
                
                return fnresult;
            } // relativeTouches
            
            function fireEvent(eventName) {
                var eventArgs = new Array(arguments.length - 1);
                var ii = 0;
                
                for (ii = 1; ii < arguments.length; ii++) {
                    eventArgs[ii - 1] = arguments[ii];
                } // for
                
                for (ii = listeners.length; ii--; ) {
                    if (listeners[ii][eventName]) {
                        listeners[ii][eventName].apply(self, eventArgs);
                    } // if
                } // for
            } // fireEvent
            
            function firePositionEvent(eventName, absVector) {
                var offsetVector = null;
                
                // if an element is defined, then determine the element offset
                if (params.element) {
                    offsetVector = SLICK.V.offset(absVector, -params.element.offsetLeft, -params.element.offsetTop);
                } // if
                
                // fire the event
                fireEvent(eventName, absVector, offsetVector);
            } // firePositionEvent
            
            function touchStart(evt) {
                // debugTouchEvent(evt, 'touch start');
                touchesStart = supportsTouch ? getTouchPoints(evt.touches) : getMousePos(evt);
                touchDelta = new SLICK.Vector();
                totalDelta = new SLICK.Vector();
                touchDown = true;
                doubleTap = false;
                
                if (evt.target && (evt.target === params.element)) {
                    // cancel event propogation
                    preventDefaultTouch(evt);

                    // clear the inertia interval if it is running
                    // clearInterval(inertiaInterval);
            
                    // log the current touch start time
                    ticks.current = SLICK.Clock.getTime();
            
                    // fire the touch start event handler
                    var touchVector = touchesStart.length > 0 ? touchesStart[0] : null;
            
                    // if we don't have a touch vector, then log a warning, and exit
                    if (! touchVector) {
                        GRUNT.Log.warn("Touch start fired, but no touch vector found");
                        return;
                    } // if
            
                    // fire the touch start handler
                    fireEvent('touchStartHandler', touchVector.x, touchVector.y);
            
                    // check to see whether this is a double tap (if we are watching for them)
                    if (ticks.current - ticks.last < self.THRESHOLD_DOUBLETAP) {
                        // calculate the difference between this and the last touch point
                        var touchChange = touchesLast ? SLICK.V.diff(touchesStart[0], touchesLast[0]) : null;
                        if (touchChange && (Math.abs(touchChange.x) < params.maxDistDoubleTap) && (Math.abs(touchChange.y) < params.maxDistDoubleTap)) {
                            doubleTap = true;
                        } // if
                    } // if

                    // reset the touch mode to unknown
                    touchMode = TOUCH_MODES.TAP;
            
                    // update the last touches
                    touchesLast = [].concat(touchesStart);
                } // if
            } // touchStart
            
            function touchMove(evt) {
                if (! touchDown) { return; }
                
                if (evt.target && (evt.target === params.element)) {
                    try {
                        // cancel event propogation
                        preventDefaultTouch(evt);

                        // get the current touches
                        var touchesCurrent = supportsTouch ? getTouchPoints(evt.touches) : getMousePos(evt),
                            zoomDistance = 0;

                        // check to see if we are pinching or zooming
                        if (touchesCurrent.length > 1) {
                            // if the start touches does have two touch points, then reset to the current
                            if (touchesStart.length === 1) {
                                touchesStart = [].concat(touchesCurrent);
                            } // if

                            zoomDistance = calcDistance(touchesStart) - calcDistance(touchesLast);
                        } // if

                        // if the touch mode is tap, then check to see if we have gone beyond a move threshhold
                        if (touchMode === TOUCH_MODES.TAP) {
                            // get the delta between the first touch and the current touch
                            var tapDelta = calcChange(touchesCurrent, touchesStart);

                            // if the delta.x or delta.y is greater than the move threshhold, we are no longer moving
                            if (tapDelta && ((Math.abs(tapDelta.x) >= MIN_MOVEDIST) || (Math.abs(tapDelta.y) >= MIN_MOVEDIST))) {
                                touchMode = TOUCH_MODES.MOVE;
                            } // if
                        } // if


                        // if we aren't in tap mode, then let's see what we should do
                        if (touchMode !== TOUCH_MODES.TAP) {
                            // TODO: queue touch count history to enable an informed decision on touch end whether
                            // a single or multitouch event is completing...

                            // if we aren't pinching or zooming then do the move 
                            if ((! zoomDistance) || (Math.abs(zoomDistance) < params.pinchZoomThreshold)) {
                                // calculate the pan delta
                                touchDelta = calcChange(touchesCurrent, touchesLast);

                                // update the total delta
                                if (touchDelta) {
                                    totalDelta.x += touchDelta.x; totalDelta.y += touchDelta.y;
                                    panDelta.x += touchDelta.x; panDelta.y += touchDelta.y;
                                } // if

                                // if the pan_delta is sufficient to fire an event, then do so
                                if (SLICK.V.absSize(panDelta) > params.panEventThreshhold) {
                                    fireEvent('moveHandler', panDelta.x, panDelta.y);
                                    panDelta = SLICK.V.create();
                                } // if

                                // set the touch mode to move
                                touchMode = TOUCH_MODES.MOVE;

                                // TODO: investigate whether it is more efficient to animate on a timer or not
                            }
                            else {
                                fireEvent('pinchZoomHandler', relativeTouches(touchesStart), relativeTouches(touchesCurrent));

                                // set the touch mode to pinch zoom
                                touchMode = TOUCH_MODES.PINCHZOOM;
                            } // if..else
                        } // if..else

                        touchesLast = [].concat(touchesCurrent);                        
                    }
                    catch (e) {
                        GRUNT.Log.exception(e);
                    } // try..catch
                } // if
            } // touchMove
            
            function touchEnd(evt) {
                if (evt.target && (evt.target === params.element)) {
                    try {
                        // cancel event propogation
                        preventDefaultTouch(evt);

                        // get the end tick
                        var endTick = SLICK.Clock.getTime();

                        // save the current ticks to the last ticks
                        ticks.last = ticks.current;

                        // if tapping, then first the tap event
                        if (touchMode === TOUCH_MODES.TAP) {
                            // start the timer to fire the tap handler, if 
                            if (! tapTimer) {
                                tapTimer = setTimeout(function() {
                                    // reset the timer 
                                    tapTimer = 0;

                                    // fire the appropriate tap event
                                    firePositionEvent(doubleTap ? 'doubleTapHandler' : 'tapHandler', touchesStart[0]);
                                }, self.THRESHOLD_DOUBLETAP + 50);
                            }
                        }
                        // if moving, then fire the move end
                        else if (touchMode == TOUCH_MODES.MOVE) {
                            fireEvent('moveEndHandler', totalDelta.x, totalDelta.y);
                        }
                        // if pinchzooming, then fire the pinch zoom end
                        else if (touchMode == TOUCH_MODES.PINCHZOOM) {
                            // TODO: pass the total zoom amount
                            fireEvent('pinchZoomEndHandler', relativeTouches(touchesStart), relativeTouches(touchesLast));
                        } // if..else

                        touchDown = false;
                    }
                    catch (e) {
                        GRUNT.Log.exception(e);
                    } // try..catch
                } // if
            } // touchEnd

            // initialise self
            var self = {
                supportsTouch: supportsTouch,

                /* define mutable constants (yeah, I know that's a contradiction) */

                THRESHOLD_DOUBLETAP: 300,

                /* define methods */
                
                addListeners: function(args) {
                    listeners.push(args);
                },
                
                decoupleListeners: function(listenerId) {
                    // iterate through the listeners and look for the matching listener id
                    for (var ii = 0; listenerId && (ii < listeners.length); ii++) {
                        if (listeners[ii].listenerId === listenerId) {
                            listeners.splice(ii, 1);
                            GRUNT.Log.info("successfully decoupled touch listener: " + listenerId);

                            break;
                        } // if
                    } // for
                },
                
                release: function() {
                    config.eventTarget.removeEventListener(config.supportsTouch ? 'touchstart' : 'mousedown', touchStart, false);
                    config.eventTarget.removeEventListener(config.supportsTouch ? 'touchmove' : 'mousemove', touchMove, false);
                    config.eventTarget.removeEventListener(config.supportsTouch ? 'touchend' : 'mouseup', touchEnd, false);
                },
                
                wheelie: function(evt) {
                    var delta = new SLICK.Vector(evt.wheelDeltaX, evt.wheelDeltaY),
                        xy = new SLICK.Vector(evt.clientX, evt.clientY),
                        zoomAmount = delta.y !== 0 ? Math.abs(delta.y / 120) : 0;
                        
                    if (zoomAmount !== 0) {
                        fireEvent("wheelZoomHandler", xy, delta.y > 0 ? zoomAmount + 0.5 : 0.5 / zoomAmount);
                    } // if
                    
                    GRUNT.Log.info("capture mouse wheel event, delta = " + delta + ", position = " + xy);
                }
            };
            
            // wire up the events
            config.eventTarget.addEventListener(config.supportsTouch ? 'touchstart' : 'mousedown', touchStart, false);
            config.eventTarget.addEventListener(config.supportsTouch ? 'touchmove' : 'mousemove', touchMove, false);
            config.eventTarget.addEventListener(config.supportsTouch ? 'touchend' : 'mouseup', touchEnd, false);
            
            /*
            // handle mouse wheel events by
            eventTarget.addEventListener(
                "mousewheel",
                function (evt) {
                    touchHelper.wheelie(evt);
                }, false);
            */

            return self;
        } // TouchHelper
    };
    
    // initialise touch helpers array
    var touchHelpers = [];
    
    // define the module members
    return {
        // TODO: add the release touch method
        captureTouch: function(element, params) {
            try {
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
                    touchHelper = module_types.TouchHelper(GRUNT.extend({ element: element}, params));
                    touchHelpers[element.id] = touchHelper;
                    
                    GRUNT.Log.info("CREATED TOUCH HELPER. SUPPORTS TOUCH = " + touchHelper.supportsTouch);
                } // if
                
                // if we already have an association with listeners, then remove first
                if (params.listenerId) {
                    touchHelper.decoupleListeners(params.listenerId);
                } // if
                
                // flag the parameters with touch listener ids so they can be removed later
                params.listenerId = (++listenerCount);

                // add the listeners to the helper
                touchHelper.addListeners(params);
            }
            catch (e) {
                GRUNT.Log.exception(e);
            }
        },
        
        resetTouch: function(element) {
            if (element && element.id && touchHelpers[element.id]) {
                touchHelpers[element.id].release();
                delete touchHelpers[element.id];
            } // if
        }
    }; // module
})();

// if jquery is defined, then add the plugins
if (typeof(jQuery) !== 'undefined') {
    jQuery.fn.canTouchThis = function(params) {
        // bind the touch events
        return this.each(function() {
            SLICK.Touch.captureTouch(this, params);
        });
    }; // canTouchThis

    jQuery.fn.untouchable = function() {
        // define acceptable touch items
        var TAGS_CANTOUCH = /^(A|BUTTON)$/i;

        return this
            /*
            .bind("touchstart", function(evt) {
                if (! (evt.target && TAGS_CANTOUCH.test(evt.target.tagName))) {
                    // check to see whether a click handler has been assigned for the current object
                    if (! (evt.target.onclick || evt.target.ondblclick)) {
                        GRUNT.Log.info("no touch for: " + evt.target.tagName);
                        evt.preventDefault();
                    } // if
                } // if
            })
            */
            .bind("touchmove", function(evt) {
                evt.preventDefault();
            });
    }; // untouchable
} // if

/*
File:  slick.behaviours.js
This file implements mixins that describe behaviour for a particular display class

Section:  Version History
2010-06-03 (DJO) - Created File
*/

SLICK.Pannable = function(params) {
    params = GRUNT.extend({
        container: null,
        onPan: null,
        onPanEnd: null,
        onAnimate: null,
        checkOffset: null
    }, params);
    
    var animating = false,
        offset = new SLICK.Vector();
    
    // initialise self
    var self = {
        pannable: true,
        
        getOffset: function() {
            return new SLICK.Vector(offset.x, offset.y);
        },
        
        setOffset: function(x, y) {
            offset.x = x; offset.y = y;
        },
        
        pan: function(x, y, tweenFn) {
            // if no tween function is defined, then go ahead
            if (! tweenFn) {
                self.updateOffset(offset.x + x, offset.y + y);

                // if the on pan event is defined, then hook into it
                if (params.onPan) {
                    params.onPan(x, y);
                } // if
            }
            // otherwise, apply the tween function to the offset
            else {
                self.updateOffset(offset.x + x, offset.y + y, tweenFn);
            } // if..else
        },
        
        isAnimating: function() {
            return animating;
        },
        
        panEnd: function(x, y) {
            if (params.onPanEnd) {
                params.onPanEnd(x, y);
            } // if
        },
        
        updateOffset: function(x, y, tweenFn) {
            if (tweenFn) {
                var endPosition = new SLICK.Vector(x, y);

                animating = true;
                var tweens = SLICK.Animation.tweenVector(offset, endPosition.x, endPosition.y, tweenFn, function() {
                    animating = false;
                    self.panEnd(0, 0);
                });

                // set the tweens to cancel on interact
                for (var ii = tweens.length; ii--; ) {
                    tweens[ii].cancelOnInteract = true;
                    tweens[ii].requestUpdates(function(updatedValue, complete) {
                        if (params.onAnimate) {
                            params.onAnimate(offset.x, offset.y);
                        } // if
                    });
                } // for
            }
            else {
                self.setOffset(x, y);
            } // if..else
        }
    };
    
    var container = document.getElementById(params.container);
    if (container) {
        SLICK.Touch.captureTouch(container, {
            moveHandler: function(x, y) {
                self.pan(-x, -y);
            },
            
            moveEndHandler: function(x, y) {
                self.panEnd(x, y);
            }
        });
    } // if
    
    return self;
}; // SLICK.Pannable

SLICK.Scalable = function(params) {
    params = GRUNT.extend({
        container: null,
        onAnimate: null,
        onPinchZoom: null,
        onScale: null,
        scaleDamping: false
    }, params);

    var scaling = false,
        startRect = null,
        endRect = null,
        scaleFactor = 1,
        aniProgress = null,
        tweenStart = null,
        startCenter = null,
        zoomCenter = null;
    
    function checkTouches(start, end) {
        startRect = start.getRect();
        endRect = end.getRect();
        
        // get the sizes of the rects
        var startSize = startRect.getSize(),
            endSize = endRect.getSize();
            
        // update the zoom center
        zoomCenter = endRect.getCenter();
        
        // determine the ratio between the start rect and the end rect
        scaleFactor = (startRect && (startSize !== 0)) ? (endSize / startSize) : 1;
    } // checkTouches
    
    // initialise self
    var self = {
        scalable: true,
        
        animate: function(targetScaleFactor, startXY, targetXY, tweenFn, callback) {
            
            function finishAnimation() {
                // if we have a callback to complete, then call it
                if (callback) {
                    callback();
                } // if
                
                scaling = false;
                if (params.onScale) {
                    params.onScale(scaleFactor, zoomCenter);
                } // if
                
                // reset the scale factor
                scaleFactor = 1;
                aniProgress = null;
            } // finishAnimation
            
            // update the zoom center
            scaling = true;
            startCenter = SLICK.V.copy(startXY);
            zoomCenter = SLICK.V.copy(targetXY);
            startRect = null;
            
            // if tweening then update the targetXY
            if (tweenFn) {
                tweenStart = scaleFactor;
                
                var tween = SLICK.Animation.tweenValue(0, targetScaleFactor - tweenStart, tweenFn, finishAnimation, 1000);
                tween.requestUpdates(function(updatedValue, completed) {
                    // calculate the completion percentage
                    aniProgress = updatedValue / (targetScaleFactor - tweenStart);
                    
                    // update the scale factor
                    scaleFactor = tweenStart + updatedValue;
                    
                    // trigger the on animate handler
                    if (params.onAnimate) {
                        params.onAnimate();
                    } // if
                });
            }
            // otherwise, update the scale factor and fire the callback
            else {
                scaleFactor = targetScaleFactor;
                finishAnimation();
            }  // if..else
        },

        getScaleInfo: function() {
            return {
                factor: scaleFactor,
                startRect: SLICK.copyRect(startRect),
                endRect: SLICK.copyRect(endRect),
                start: startCenter,
                center: zoomCenter,
                progress: aniProgress
            };
        },
        
        getScaling: function() {
            return scaling;
        },
        
        getScaleFactor: function() {
            return scaleFactor;
        }
    };
    
    var container = document.getElementById(params.container);
    if (container) {
        SLICK.Touch.captureTouch(container, {
            pinchZoomHandler: function(touchesStart, touchesCurrent) {
                checkTouches(touchesStart, touchesCurrent);
                
                scaling = scaleFactor !== 1;
                if (scaling && params.onPinchZoom) {
                    params.onPinchZoom(touchesStart, touchesCurrent);
                } // if
            },
            
            pinchZoomEndHandler: function(touchesStart, touchesEnd) {
                checkTouches(touchesStart, touchesEnd);
                
                scaling = false;
                if (params.onScale) {
                    params.onScale(scaleFactor, zoomCenter, true);
                } // if
                
                // restore the scale amount to 1
                scaleFactor = 1;
            },
            
            wheelZoomHandler: function(xy, scaleFactor) {
                scaleFactor = scaleFactor;
             
                // nullify the start rect
                startRect = endRect = null;
                
                // update the xy position
                zoomCenter = SLICK.V.copy(xy);
            }
        });
    } // if    
    
    return self;
}; // SLICK.Scalable
SLICK.Dispatcher = (function() {
    // initialise variables
    var registeredActions = [];
    
    // initialise the module
    var module = {
        
        /* actions */
        
        execute: function(actionId) {
            // find the requested action
            var action = module.findAction(actionId);
            
            GRUNT.Log.info("looking for action id: " + actionId + ", found: " + action);
            
            // if we found the action then execute it
            if (action) {
                // get the trailing arguments from the call
                var actionArgs = [].concat(arguments).slice(0, 1);
                
                GRUNT.Log.watch("EXECUTING ACTION: " + actionId, function() {
                    action.execute(actionArgs);
                });
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
            params = GRUNT.extend({
                autoRegister: true,
                id: '',
                title: '',
                icon: '',
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
                    return String.format("{0} [title = {1}, icon = {2}]", self.id, params.title, params.icon);
                }
            };
            
            // if the action has been set to auto register, then add it to the registry
            if (params.autoRegister) {
                module.registerAction(self);
            } // if
            
            return self;
        },
        
        /* agents */
        
        createAgent: function(params) {
            params = GRUNT.extend({
                name: "Untitled",
                trashOrphanedResults: true,
                translator: null,
                execute: null
            }, params);
            
            // last run time
            var lastRunTicks = null;
            
            // define the wrapper for the agent
            var self = {
                getName: function() {
                    return params.name;
                },
                
                getParam: function(key) {
                    return params[key];
                },
                
                getId: function() {
                    return GRUNT.toID(self.getName());
                },
                
                run: function(args, callback) {
                    if (params.execute) {
                        // update the last run ticks
                        lastRunTicks = SLICK.Clock.getTime(true);
                        
                        // save the run instance ticks to a local variable so we can check it in the callback
                        var runInstanceTicks = lastRunTicks,
                            searchArgs = params.translator ? params.translator(args) : args;
                        
                        // execute the agent
                        params.execute.call(self, searchArgs, function(data, agentParams) {
                            if ((! params.trashOrphanedResults) || (runInstanceTicks == lastRunTicks)) {
                                if (callback) {
                                    callback(data, agentParams, searchArgs);
                                } // if
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

/**
@namespace 

The concept behind SLICK messaging, is to enable client-side javascript to send messages and have
those messages be handled in some way.  In some cases, a message being handled will involve moving
to another part of the application (which is handled by the native bridge in a mobile application)
or potentially a message could actually have some action taken on the server side, message data 
updated and then the creating context could be notified of the change.  Currently, the messaging
section of SLICK is evolving, and is likely to change over time as the requirements of this module
become clear.
*/
SLICK.Messaging = (function() {
    var handlers = [];
    var messageQueue = [];
    
    function getMessage(index) {
        return (index >= 0) && (index < messageQueue.length) ? messageQueue[index] : null;
    }
    
    function fireMessageUpdate(index, updateSource) {
        // get the message instance
        var message = getMessage(index);
        GRUNT.Log.info("firing message update, index = " + index + ", message = " + message);
        
        // iterate through the handlers, and allow them to action the message
        var ii = 0;
        while (message && (ii < handlers.length) && (message.status !== module.STATUS.handled)) {
            // TODO: check that the current handler is not the update source
            
            var statusChange = handlers[ii].processUpdate(messageQueue[index]);
            if (statusChange) {
                updateMessageStatus(index, statusChange, handlers[ii].getId());
            } // if
            
            ii++;
        } // while
    } // fireMessageUpdate
    
    function updateMessageStatus(index, newStatus, updateSource) {
        var message = getMessage(index);
        
        if (message) {
            // update the message status
            message.status = newStatus;
            
            // if the message has an status changed event handler, then trigger that now
            if (message.statusChange) {
                message.statusChange(message);
            } // if
        } // if
    } // updateMessageStatus
    
    var module = GRUNT.newModule({
        id: "slick.messaging",
        requires: ["slick.core"],

        // message status updates
        STATUS: {
            none: 0,
            created: 1,
            updated: 2,
            handled: 3
        },
        
        /**
        The send function is used to push a new message onto the message queue.  Registered
        message listeners will be passed the message details and will have the opportunity
        to respond to the message, if they have handled the message they can update the message
        status and add message log entries.  
        
        @param {Hash} params a hashed array containing message details
        */
        send: function(params) {
            params = GRUNT.extend({
                type: "",
                payload: {},
                index: 0,
                status: module.STATUS.created,
                statusChange: null
            }, params);
            
            // add the message to the message queue
            params.index = messageQueue.push(params) - 1;
            
            // trigger a message update
            fireMessageUpdate(params.index);
        },
        
        Handler: function(params) {
            params = GRUNT.extend({
                id: "",
                processUpdate: null
            }, params);
            
            // define self
            var self = {
                getId: function() {
                    return params.id;
                },
                
                processUpdate: function(message) {
                    if (params.processUpdate) {
                        return params.processUpdate(message);
                    } // if
                    
                    return module.STATUS.none;
                }
            };
            
            // add the handler to the list of handlers
            handlers.push(self);
            
            return self;
        }
    });
    
    return module;
})();

/**
SLICK Animation module
*/
SLICK.Animation = (function() {
    // initialise variables
    var tweens = [],
        updating = false,
        tweenTimer = 0;
        
    function wake() {
        if (tweenTimer !== 0) { return; }
        
        tweenTimer = setInterval(function() {
            if (module.update(SLICK.Clock.getTime()) === 0) {
                clearInterval(tweenTimer);
                tweenTimer = 0;
            } // if
        }, 20);
    } // wake
    
    // define the module
    var module = {
        DURATION: 2000,
        
        tweenValue: function(startValue, endValue, fn, callback, duration) {
            // create a tween that doesn't operate on a property
            var fnresult = new module.Tween({
                startValue: startValue,
                endValue: endValue,
                tweenFn: fn,
                complete: callback,
                duration: duration
            });
            
            // add the the list return the new tween
            tweens.push(fnresult);
            return fnresult;
        },
        
        tween: function(target, property, targetValue, fn, callback, duration) {
            var fnresult = new module.Tween({
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
        },
        
        tweenVector: function(target, dstX, dstY, fn, callback, duration) {
            var fnresult = [];
            
            if (target) {
                var xDone = target.x == dstX;
                var yDone = target.y == dstY;
                
                if (! xDone) {
                    fnresult.push(module.tween(target, "x", dstX, fn, function() {
                        xDone = true;
                        if (xDone && yDone) { callback(); }
                    }, duration));
                } // if
                
                if (! yDone) {
                    fnresult.push(module.tween(target, "y", dstY, fn, function() {
                        yDone = true;
                        if (xDone && yDone) { callback(); }
                    }, duration));
                } // if
            } // if
            
            return fnresult;
        },
        
        cancel: function(checkCallback) {
            if (updating) { return ; }
            
            updating = true;
            try {
                var ii = 0;

                // trigger the complete for the tween marking it as cancelled
                while (ii < tweens.length) {
                    if ((! checkCallback) || checkCallback(tweens[ii])) {
                        GRUNT.Log.info("CANCELLING ANIMATION");
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
        },
        
        isTweening: function() {
            return tweens.length > 0;
        },
        
        update: function(tickCount) {
            if (updating) { return tweens.length; }
            
            updating = true;
            try {
                // iterate through the active tweens and update each
                var ii = 0;
                while (ii < tweens.length) {
                    if (tweens[ii].isComplete()) {
                        tweens[ii].triggerComplete(false);
                        tweens.splice(ii, 1);
                    
                        GRUNT.WaterCooler.say("animation.complete");
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
            
            return tweens.length;
        },
        
        Tween: function(params) {
            params = GRUNT.extend({
                target: null,
                property: null,
                startValue: 0,
                endValue: null,
                duration: module.DURATION,
                tweenFn: module.DEFAULT,
                complete: null,
                cancelOnInteract: false
            }, params);
            
            // get the start ticks
            var startTicks = SLICK.Clock.getTime(),
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
                            updatedValue = params.tweenFn(elapsed, beginningValue, change, params.duration);
                    
                        // update the property value
                        if (params.target) {
                            params.target[params.property] = updatedValue;
                        } // if
                    
                        // iterate through the update listeners and let them know the updated value
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
                        GRUNT.Log.exception(e);
                    } // try..catch
                },
                
                requestUpdates: function(callback) {
                    updateListeners.push(callback);
                }
            };
            
            // calculate the beginning value
            beginningValue = (params.target && params.property && params.target[params.property]) ? params.target[params.property] : params.startValue;

            // calculate the change and beginning position
            if (typeof params.endValue !== 'undefined') {
                change = (params.endValue - beginningValue);
            } // if
            
            // GRUNT.Log.info("creating new tween. change = " + change, params);

            // if no change is required, then mark as complete so the update method will never be called
            if (change == 0) {
                complete = true;
            } // if..else
            
            // wake the tween timer
            wake();
            
            return self;
        },
        
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
        Easing: (function() {
            var s = 1.70158;
            
            return {
                Linear: function(t, b, c, d) {
                    return c*t/d + b;
                },
                
                Back: {
                    In: function(t, b, c, d) {
                        return c*(t/=d)*t*((s+1)*t - s) + b;
                    },
                    
                    Out: function(t, b, c, d) {
                        return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
                    },
                    
                    InOut: function(t, b, c, d) {
                        return ((t/=d/2)<1) ? c/2*(t*t*(((s*=(1.525))+1)*t-s))+b : c/2*((t-=2)*t*(((s*=(1.525))+1)*t+s)+2)+b;
                    }
                },
                
                Bounce: {
                    In: function(t, b, c, d) {
                        return c - module.Easing.Bounce.Out(d-t, 0, c, d) + b;
                    },
                    
                    Out: function(t, b, c, d) {
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
                    
                    InOut: function(t, b, c, d) {
                        if (t < d/2) return module.Easing.Bounce.In(t*2, 0, c, d) * 0.5 + b;
                        else return module.Easing.Bounce.Out(t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
                    }
                },
                
                Cubic: {
                    In: function(t, b, c, d) {
                        return c*(t/=d)*t*t + b;
                    },
                    
                    Out: function(t, b, c, d) {
                        return c*((t=t/d-1)*t*t + 1) + b;
                    },
                    
                    InOut: function(t, b, c, d) {
                        if ((t/=d/2) < 1) return c/2*t*t*t + b;
                        return c/2*((t-=2)*t*t + 2) + b;
                    }
                },
                
                Elastic: {
                    In: function(t, b, c, d, a, p) {
                        var s;
                        
                        if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
                        if (!a || a < Math.abs(c)) { a=c; s=p/4; }
                        else s = p/(2*Math.PI) * Math.asin (c/a);
                        return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
                    },
                    
                    Out: function(t, b, c, d, a, p) {
                        var s;
                        
                        if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
                        if (!a || a < Math.abs(c)) { a=c; s=p/4; }
                        else s = p/(2*Math.PI) * Math.asin (c/a);
                        return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
                    },
                    
                    InOut: function(t, b, c, d, a, p) {
                        var s;
                        
                        if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
                        if (!a || a < Math.abs(c)) { a=c; s=p/4; }
                        else s = p/(2*Math.PI) * Math.asin (c/a);
                        if (t < 1) return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
                        return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
                    }
                },
                
                Quad: {
                    In: function(t, b, c, d) {
                        return c*(t/=d)*t + b;
                    },
                    
                    Out: function(t, b, c, d) {
                        return -c *(t/=d)*(t-2) + b;
                    },
                    
                    InOut: function(t, b, c, d) {
                        if ((t/=d/2) < 1) return c/2*t*t + b;
                        return -c/2 * ((--t)*(t-2) - 1) + b;
                    }
                },
                
                Sine: {
                    In: function(t, b, c, d) {
                        return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
                    },
                    
                    Out: function(t, b, c, d) {
                        return c * Math.sin(t/d * (Math.PI/2)) + b;
                    },
                    
                    InOut: function(t, b, c, d) {
                        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
                    }
                }
            };
        })()
    };
    
    return GRUNT.extend(module, {
        DEFAULT: module.Easing.Back.Out
    });
})();

/*
File:  slick.tiler.js
This file is used to define the tiler and supporting classes for creating a scrolling
tilable grid using the HTML canvas.  At this stage, the Tiler is designed primarily for
mobile devices, however, if the demand is there it could be tweaked to also support other
HTML5 compatible browsers

Section: Version History
21/05/2010 (DJO) - Created File
*/

// define the slick tile borders
SLICK.Border = {
    NONE: 0,
    TOP: 1,
    RIGHT: 2,
    BOTTOM: 3,
    LEFT: 4
}; // Border

SLICK.Graphics = (function() {
    // initialise display state constants that will be exposed through the module
    var DISPLAY_STATE = {
        NONE: 0,
        ACTIVE: 1,
        ANIMATING: 4,
        PAN: 8,
        PINCHZOOM: 16,
        FREEZE: 128
    };
    
    // initialise variables
    var viewCounter = 0;
    
    var module = {
        DisplayState: DISPLAY_STATE,
        
        // some precanned display states
        AnyDisplayState: 255,
        ActiveDisplayStates: DISPLAY_STATE.ACTIVE | DISPLAY_STATE.ANIMATING,
        DefaultDisplayStates: DISPLAY_STATE.ACTIVE | DISPLAY_STATE.ANIMATING | DISPLAY_STATE.PAN | DISPLAY_STATE.PINCHZOOM,
        
        ViewLayer: function(params) {
            params = GRUNT.extend({
                id: "",
                centerOnScale: true,
                created: new Date().getTime(),
                scalePosition: true,
                zindex: 0,
                supportFastDraw: false,
                validStates: module.DefaultDisplayStates
            }, params);
            
            var parent = null;

            var self = GRUNT.extend({
                isAnimating: function() {
                    return false;
                },
                
                addToView: function(view) {
                    view.setLayer(params.id, self);
                },
                
                shouldDraw: function(displayState) {
                    var stateValid = (displayState & params.validStates) !== 0,
                        fastDraw = parent ? (parent.fastDraw && (displayState !== DISPLAY_STATE.ACTIVE)) : false;

                    return stateValid && (fastDraw ? params.supportFastDraw : true);
                },
                
                cycle: function(tickCount, offset) {
                    return 0;
                },
                
                draw: function(context, offset, dimensions, state, view) {
                },
                
                notify: function(eventType) {
                    
                },
                
                /**
                The remove method enables a view to flag that it is ready or should be removed
                from any views that it is contained in.  This was introduced specifically for
                animation layers that should only exist as long as an animation is active.
                */
                remove: function() {
                    GRUNT.WaterCooler.say("layer.remove", { id: params.id });
                },
                
                wakeParent: function() {
                    // if we have a parent, then wake them, if we have no parent, well just panic and wake everybody up
                    GRUNT.WaterCooler.say("view.wake", { id: parent ? parent.id : null });
                },
                
                getParent: function() {
                    return parent;
                },
                
                setParent: function(view) {
                    parent = view;
                }
            }, params); // self
            
            return self;
        },
        
        StatusViewLayer: function(params) {
            return new module.ViewLayer({
                validStates: module.AnyDisplayState,
                zindex: 5000,
                draw: function(context, offset, dimensions, state, view) {
                    context.fillStyle = "#FF0000";
                    context.fillRect(10, 10, 50, 50);
                    
                    context.fillStyle = "#FFFFFF";
                    context.font = "bold 10px sans";
                    context.fillText(view.getDisplayState(), 20, 20);
                }
            });
        },
        
        AnimatedPathLayer: function(params) {
            params = GRUNT.extend({
                path: [],
                id: GRUNT.generateObjectID("pathAnimation"),
                easing: SLICK.Animation.Easing.Sine.InOut,
                canCache: false,
                validStates: module.ActiveDisplayStates | DISPLAY_STATE.PAN | DISPLAY_STATE.PINCHZOOM,
                drawIndicator: null,
                duration: 2000,
                autoCenter: false
            }, params);
            
            // generate the edge data for the specified path
            var edgeData = SLICK.VectorMath.edges(params.path), 
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
            tween = SLICK.Animation.tweenValue(
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
            var self =  GRUNT.extend(new module.ViewLayer(params), {
                cycle: function(tickCount, offset) {
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

                        theta = SLICK.VectorMath.theta(v1, v2, edgeData.edges[edgeIndex]);
                        indicatorXY = SLICK.VectorMath.pointOnEdge(v1, v2, theta, extra);

                        if (params.autoCenter) {
                            var parent = self.getParent();
                            if (parent) {
                                parent.centerOn(indicatorXY);
                            } // if
                        } // if
                    } // if

                    return indicatorXY ? 1 : 0;
                },
                
                draw: function(context, offset, dimensions, state, view) {
                    if (indicatorXY) {
                        // if the draw indicator method is specified, then draw
                        (params.drawIndicator ? params.drawIndicator : drawDefaultIndicator)(
                            context,
                            offset,
                            new SLICK.Vector(indicatorXY.x - offset.x, indicatorXY.y - offset.y),
                            theta
                        );
                    } // if
                }
            });

            return self;
        },
        
        FPSLayer: function(params) {
            params = GRUNT.extend({
                zindex: 1000,
                scalePosition: false
            }, params);
            
            // initialise variables
            var fps = null;
            
            function determineFPS() {
                var sumFPS = 0,
                    delaysLen = self.delays.length;
                    
                for (var ii = delaysLen; ii--; ) {
                    sumFPS += self.delays[ii];
                } // for
                
                if (delaysLen !== 0) {
                    fps = Math.floor(1000 / (sumFPS / delaysLen));
                } // if
            } // determineFPS
            
            // initialise self
            var self = GRUNT.extend(new module.ViewLayer(params), {
                delays: [],
                
                draw: function(context, offset, dimensions, state, view) {
                    context.font = "bold 8pt Arial";
                    context.textAlign = "right";
                    context.fillStyle = "rgba(0, 0, 0, 0.8)";
                    context.fillText((fps ? fps : "?") + " fps", dimensions.width - 20, 20);
                }
            });
            
            setInterval(determineFPS, 1000);
            
            return self;
        },
        
        ResourceStatsLayer: function(params) {
            params = GRUNT.extend({
                zindex: 500,
                indicatorSize: 5,
                scalePosition: false,
                validStates: DISPLAY_STATE.ACTIVE | DISPLAY_STATE.PAN
            }, params);
            
            // initialise self
            var self = GRUNT.extend(new module.ViewLayer(params), {
                fps: null,
                
                draw: function(context, offset, dimensions, state, view) {
                    // get the stats from the resource loaded
                    var stats = SLICK.Resources.getStats(),
                        ledSize = params.indicatorSize,
                        indicatorLeft = 10,
                        spacing = 2,
                        ii,
                        ypos;
                        
                    if (stats.imageCacheFullness) {
                        context.strokeStyle = "rgba(0, 0, 255, 1)";
                        
                        context.beginPath();
                        context.arc(15, 15, 5, 0, Math.PI * 2 * stats.imageCacheFullness, false);
                        context.stroke();
                        
                        indicatorLeft = 30;
                    } // if
                    
                    if (stats.imageLoadingCount >= 0) {
                        // draw indicators for the number of images loading
                        context.fillStyle = "rgba(0, 255, 0, 0.7)";
                        for (ii = stats.imageLoadingCount; ii--; ) {
                            context.fillRect(indicatorLeft + (ii * (ledSize+spacing)), 10, ledSize, ledSize);
                        } // for
                    } // if

                    if (stats.queuedImageCount >= 0) {
                        // draw indicators for the number of images queued
                        context.fillStyle = "rgba(255, 0, 0, 0.7)";
                        for (ii = stats.queuedImageCount; ii--; ) {
                            context.fillRect(indicatorLeft + (ii * (ledSize+spacing)), 10 + ledSize + spacing, ledSize, ledSize);
                        } // for
                    } // if
                }
            });
            
            return self;
        },
        
        LoadingLayer: function(params) {
            params = GRUNT.extend({
                
            }, params);
            
            
        },
        
        View: function(params) {
            // initialise defaults
            params = GRUNT.extend({
                id: "view_" + viewCounter++,
                container: "",
                pannable: false,
                scalable: false,
                clearOnDraw: false,
                // TODO: move these into a different option location
                displayFPS: false,
                displayResourceStats: false,
                scaleDamping: false,
                fastDraw: false,
                fillStyle: "rgb(200, 200, 200)",
                initialDrawMode: "source-over",
                bufferRefresh: 100,
                defaultFreezeDelay: 500,
                onPan: null,
                onPinchZoom: null,
                onScale: null,
                onDraw: null,
                autoSize: false
            }, params);
            
            // get the container context
            var layers = [],
                canvas = document.getElementById(params.container),
                mainContext = null,
                offset = new SLICK.Vector(),
                clearBackground = false,
                lastScaleFactor = 1,
                lastTickCount = null,
                lastInteraction = 0,
                frozen = false,
                deviceScaling = 1,
                translateDelta = new SLICK.Vector(),
                dimensions = null,
                centerPos = null,
                wakeTriggers = 0,
                fpsLayer = null,
                endCenter = null,
                pannable = null,
                scalable = null,
                idle = false,
                paintTimeout = 0,
                idleTimeout = 0,
                bufferTime = 0,
                zoomCenter = null,
                tickCount = 0,
                state = module.DisplayState.ACTIVE;
                
            GRUNT.Log.info("Creating a new view instance, attached to container: " + params.container + ", canvas = ", canvas);

            if (canvas) {
                SLICK.Touch.resetTouch(canvas);
                
                // if we are autosizing the set the size
                if (params.autoSize) {
                    GRUNT.Log.info("autosizing view: window.height = " + window.innerHeight + ", width = " + window.innerWidth);
                    canvas.height = window.innerHeight - canvas.offsetTop - 49;
                    canvas.width = window.innerWidth - canvas.offsetLeft;
                } // if
                
                try {
                    mainContext = canvas.getContext('2d');
                    mainContext.globalCompositeOperation = params.initialDrawMode;
                } 
                catch (e) {
                    GRUNT.Log.exception(e);
                    throw new Error("Could not initialise canvas on specified view element");
                }
            } // if
            
            if (params.pannable) {
                pannable = new SLICK.Pannable({
                    container: params.container,
                    onAnimate: function(x, y) {
                        wake();
                    },
                    onPan: function(x, y) {
                        lastInteraction = SLICK.Clock.getTime(true);
                        wake();
                        
                        // add the current pan on the vector
                        translateDelta = SLICK.V.offset(translateDelta, x, y);
                        
                        if (params.onPan) {
                            params.onPan(x, y);
                        } // if
                        
                        state = DISPLAY_STATE.PAN;
                    },
                    
                    onPanEnd: function(x, y) {
                        wake();
                        
                        state = DISPLAY_STATE.ACTIVE;
                    }
                });
            } // if
            
            if (params.scalable) {
                scalable = new SLICK.Scalable({
                    scaleDamping: params.scaleDamping,
                    container: params.container,
                    
                    onAnimate: function() {
                        // flag that we are scaling
                        state = module.DisplayState.PINCHZOOM;
                        
                        wake();
                    },
                    
                    onPinchZoom: function(touchesStart, touchesCurrent) {
                        lastInteraction = SLICK.Clock.getTime(true);
                        wake();
                        
                        if (params.onPinchZoom) {
                            params.onPinchZoom(touchesStart, touchesCurrent);
                        } // if
                        
                        // flag that we are scaling
                        state = module.DisplayState.PINCHZOOM;
                    },
                    
                    onScale: function(endScaleFactor, zoomXY, keepCenter) {
                        GRUNT.WaterCooler.say("view.scale", { id: self.id });
                        
                        /*
                        // take a snapshot
                        if (endScaleFactor > 1) {
                            self.snapshot();
                        }
                        else {
                            self.clearBackground();
                        } // if..else
                        */
                        
                        // reset the status flag
                        state = module.DisplayState.ACTIVE;
                        wake();
                        
                        // if we are attempting to keep the center of the control
                        // FIXME: GET THIS RIGHT!!!!
                        if (keepCenter) {
                        } // if

                        if (params.onScale) {
                            params.onScale(endScaleFactor, zoomXY);
                        }
                    }
                });
            } // if
            
            function addLayer(id, value) {
                // make sure the layer has the correct id
                value.id = id;
                
                // tell the layer that I'm going to take care of it
                value.setParent(self);
                
                // add the new layer
                layers.push(value);
                
                // sort the layers
                layers.sort(function(itemA, itemB) {
                    var result = itemB.zindex - itemA.zindex;
                    if (result === 0) {
                        result = itemB.created - itemA.created;
                    } // if
                    
                    return result;
                });
            } // addLayer
            
            function getLayerIndex(id) {
                for (var ii = layers.length; ii--; ) {
                    if (layers[ii].id == id) {
                        return ii;
                    } // if
                } // for
                
                return -1;
            } // getLayerIndex
            
            /* draw code */
            
            function calcZoomCenter() {
                var scaleInfo = scalable.getScaleInfo(),
                    displayCenter = self.getDimensions().getCenter(),
                    shiftFactor = (scaleInfo.progress ? scaleInfo.progress : 1) * 0.5;
                    
                // update the end center
                endCenter = scaleInfo.center;

                if (scaleInfo.startRect) {
                    var startCenter = scaleInfo.startRect.getCenter(),
                        centerOffset = SLICK.V.diff(startCenter, endCenter);

                    zoomCenter = new SLICK.Vector(endCenter.x + centerOffset.x, endCenter.y + centerOffset.y);
                } 
                else {
                    var offsetDiff = SLICK.V.diff(scaleInfo.start, endCenter);
                        
                    zoomCenter = new SLICK.Vector(endCenter.x - offsetDiff.x * shiftFactor, endCenter.y - offsetDiff.y * shiftFactor);
                } // if..else
            } // calcZoomCenter
            
            function triggerIdle() {
                GRUNT.WaterCooler.say("view-idle", { id: self.id });
                
                idle = true;
                idleTimeout = 0;
            } // idle
            
            function drawView(context, offset) {
                var changeCount = 0,
                    scaleFactor = self.getScaleFactor(),
                    drawState = self.getDisplayState(),
                    startTicks = new Date().getTime(),
                    isPinchZoom = (drawState & DISPLAY_STATE.PINCHZOOM) !== 0,
                    delayDrawLayers = [];
                
                // update the last scale factor
                lastScaleFactor = self.getScaleFactor();

                var savedDrawn = false,
                    ii = 0;
                    
                if (clearBackground || isPinchZoom) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    clearBackground = false;
                } // if
                
                // if we are scaling then do some calcs
                if (isPinchZoom) {
                    calcZoomCenter();
                    
                    // offset the draw args
                    if (zoomCenter) {
                        offset = SLICK.V.offset(offset, zoomCenter.x, zoomCenter.y);
                    } // if
                } // if
                
                context.save();
                try {
                    // if the device dpi has scaled, then apply that to the display
                    if (deviceScaling !== 1) {
                        context.scale(deviceScaling, deviceScaling);
                    }
                    // if we are scaling, then tell the canvas to scale
                    else if (isPinchZoom) {
                        context.translate(endCenter.x, endCenter.y);
                        context.scale(scaleFactor, scaleFactor);
                    }
                    
                    for (ii = layers.length; ii--; ) {
                        // draw the layer output to the main canvas
                        // but only if we don't have a scale buffer or the layer is a draw on scale layer
                        if (layers[ii].shouldDraw(drawState)) {
                            var layerChanges = layers[ii].draw(context, offset, dimensions, drawState, self);
                            changeCount += layerChanges ? layerChanges : 0;
                        } // if
                    } // for
                }
                finally {
                    context.restore();
                } // try..finally
                
                GRUNT.Log.trace("draw complete", startTicks);
                
                return changeCount;
            } // drawView
            
            function cycle() {
                // check to see if we are panning
                var changeCount = 0,
                    interacting = (state === DISPLAY_STATE.PINCHZOOM) || (state === DISPLAY_STATE.PAN);
                    
                // get the tickcount
                tickCount = new Date().getTime();
                
                // get the updated the offset
                offset = pannable ? pannable.getOffset() : new SLICK.Vector();
                
                // if we have an fps layer, then update the fps
                if (fpsLayer && lastTickCount) {
                    fpsLayer.delays.push(tickCount - lastTickCount);
                } // if
                    
                if (interacting) {
                    SLICK.Animation.cancel(function(tweenInstance) {
                        return tweenInstance.cancelOnInteract;
                    });
                    
                    idle = false;
                    if (idleTimeout !== 0) {
                        clearTimeout(idleTimeout);
                        idleTimeout = 0;
                    } // if
                }  // if

                // check that all is right with each layer
                for (var ii = layers.length; ii--; ) {
                    var cycleChanges = layers[ii].cycle(tickCount, offset);
                    changeCount += cycleChanges ? cycleChanges : 0;
                } // for
                
                // draw the view
                changeCount += drawView(mainContext, offset);

                // update the last tick count
                lastTickCount = tickCount;
                
                // include wake triggers in the change count
                paintTimeout = 0;
                if (wakeTriggers + changeCount > 0) {
                    wake();
                } 
                else {
                    if ((! idle) && (idleTimeout === 0)) {
                        idleTimeout = setTimeout(triggerIdle, 500);
                    } // if
                } // if..else
                
                GRUNT.Log.trace("Completed draw cycle", tickCount);
            } // cycle
            
            function wake() {
                wakeTriggers++;
                if (frozen || (paintTimeout !== 0)) { return; }
            
                wakeTriggers = 0;
                paintTimeout = setTimeout(cycle, 0);
            } // wake
            
            // initialise self
            var self = GRUNT.extend({}, params, pannable, scalable, {
                id: params.id,
                deviceScaling: deviceScaling,
                fastDraw: params.fastDraw || SLICK.Device.getConfig().requireFastDraw,
                
                centerOn: function(offset) {
                    pannable.setOffset(offset.x - (canvas.width * 0.5), offset.y - (canvas.height * 0.5));
                },
                
                getDimensions: function() {
                    if (canvas) {
                        return new SLICK.Dimensions(canvas.width, canvas.height);
                    } // if
                },
                
                getZoomCenter: function() {
                    return zoomCenter;
                },
                
                /* layer getter and setters */
                
                getLayer: function(id) {
                    // look for the matching layer, and return when found
                    for (var ii = 0; ii < layers.length; ii++) {
                        if (layers[ii].id == id) {
                            if (! (/^grid/i).test(id)) {
                                GRUNT.Log.info("found layer: " + id);
                            } // if
                            
                            return layers[ii];
                        } // if
                    } // for
                    
                    return null;
                },
                
                setLayer: function(id, value) {
                    // if the layer already exists, then remove it
                    for (var ii = 0; ii < layers.length; ii++) {
                        if (layers[ii].id === id) {
                            layers.splice(ii, 1);
                            break;
                        } // if
                    } // for
                    
                    if (value) {
                        addLayer(id, value);
                    } // if
                    
                    // iterate through the layer update listeners and fire the callbacks
                    GRUNT.WaterCooler.say("layer.update", {
                        value: value
                    }); 

                    // wake up
                    wake();
                },
                
                eachLayer: function(callback) {
                    // iterate through each of the layers and fire the callback for each 
                    for (var ii = 0; ii < layers.length; ii++) {
                        callback(layers[ii]);
                    } // for
                },
                
                clearBackground: function() {
                    clearBackground = true;
                },
                
                freeze: function() {
                    frozen = true;
                },
                
                unfreeze: function() {
                    frozen = false;
                    
                    wake();
                },
                
                snapshot: function(zindex) {
                },
                
                getDisplayState: function() {
                    return frozen ? DISPLAY_STATE.FROZEN : state;
                },
                
                scale: function(targetScaling, tweenFn, callback, startXY, targetXY) {
                    // if the start XY is not defined, used the center
                    if (! startXY) {
                        startXY = self.getDimensions().getCenter();
                    } // if
                    
                    // if the target xy is not defined, then use the canvas center
                    if (! targetXY) {
                        targetXY = self.getDimensions().getCenter();
                    } // if
                    
                    // if the view is scalable then go for it
                    if (scalable) {
                        scalable.animate(targetScaling, startXY, targetXY, tweenFn, callback);
                    }
                    
                    return scalable;
                },
                
                removeLayer: function(id, timeout) {
                    // if timeout not set, then set to fire instantly
                    setTimeout(function() {
                        var layerIndex = getLayerIndex(id);
                        if ((layerIndex >= 0) && (layerIndex < layers.length)) {
                            GRUNT.WaterCooler.say("layer.remove", { layer: layers[layerIndex] });

                            layers.splice(layerIndex, 1);
                        } // if
                    }, timeout ? timeout : 1);
                }
            });
            
            // get the dimensions
            dimensions = self.getDimensions();
            centerPos = dimensions.getCenter();
            
            // listen for layer removals
            GRUNT.WaterCooler.listen("layer.remove", function(args) {
                if (args.id) {
                    self.removeLayer(args.id);
                } // if
            });
            
            GRUNT.WaterCooler.listen("view.wake", function(args) {
                if ((! args.id) || (args.id === self.id)) {
                    wake();
                } // if
            });
            
            deviceScaling = SLICK.Device.getConfig().getScaling();
            
            // if we need to display the fps for the view, then create a suitable layer
            if (params.displayFPS) {
                fpsLayer =  new module.FPSLayer();
                self.setLayer("fps", fpsLayer);
            } // if
            
            if (params.displayResourceStats) {
                self.setLayer("resourceStats", new module.ResourceStatsLayer());
            } // if
            
            // add a status view layer for experimentation sake
            // self.setLayer("status", new module.StatusViewLayer());
            wake();
            return self;
        }
    }; 
    
    return module;
})();


SLICK.Tiling = (function() {
    TileStore = function(params) {
        // initialise the parameters with the defaults
        params = GRUNT.extend({
            gridSize: 20,
            center: new SLICK.Vector(),
            onPopulate: null
        }, params);
        
        // initialise the storage array
        var storage = new Array(Math.pow(params.gridSize, 2)),
            gridHalfWidth = Math.ceil(params.gridSize >> 1),
            topLeftOffset = SLICK.V.offset(params.center, -gridHalfWidth),
            lastTileCreator = null,
            tileShift = new SLICK.Vector(),
            lastNotifyListener = null;
        
        function getTileIndex(col, row) {
            return (row * params.gridSize) + col;
        } // getTileIndex
        
        function copyStorage(dst, src, delta) {
            // set the length of the destination to match the source
            dst.length = src.length;

            for (var xx = 0; xx < params.gridSize; xx++) {
                for (var yy = 0; yy < params.gridSize; yy++) {
                    dst[getTileIndex(xx, yy)] = self.getTile(xx + delta.x, yy + delta.y);
                } // for
            } // for
        } // copyStorage
        
        // initialise self
        var self = {
            getGridSize: function() {
                return params.gridSize;
            },
            
            getNormalizedPos: function(col, row) {
                return SLICK.V.add(new SLICK.Vector(col, row), SLICK.V.invert(topLeftOffset), tileShift);
            },
            
            getTileShift: function() {
                return SLICK.V.copy(tileShift);
            },
            
            getTile: function(col, row) {
                return (col >= 0 && col < params.gridSize) ? storage[getTileIndex(col, row)] : null;
            },
            
            setTile: function(col, row, tile) {
                storage[getTileIndex(col, row)] = tile;
            },
            
            /*
            What a cool function this is.  Basically, this goes through the tile
            grid and creates each of the tiles required at that position of the grid.
            The tileCreator is a callback function that takes a two parameters (col, row) and
            can do whatever it likes but should return a Tile object or null for the specified
            column and row.
            */
            populate: function(tileCreator, notifyListener) {
                // take a tick count as we want to time this
                var startTicks = GRUNT.Log.getTraceTicks(),
                    tileIndex = 0,
                    centerPos = new SLICK.Vector(params.gridSize * 0.5, params.gridSize * 0.5);
                
                if (tileCreator) {
                    for (var row = 0; row < params.gridSize; row++) {
                        for (var col = 0; col < params.gridSize; col++) {
                            if (! storage[tileIndex]) {
                                var tile = tileCreator(col, row, topLeftOffset, params.gridSize);

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
                GRUNT.Log.trace("tile grid populated", startTicks);
                
                // if we have an onpopulate listener defined, let them know
                if (params.onPopulate) {
                    params.onPopulate();
                } // if
            },
            
            getShiftDelta: function(topLeftX, topLeftY, cols, rows) {
                // initialise variables
                var shiftAmount = Math.floor(params.gridSize * 0.2),
                    shiftDelta = new SLICK.Vector();
                    
                // test the x
                if (topLeftX < 0 || topLeftX + cols > params.gridSize) {
                    shiftDelta.x = topLeftX < 0 ? -shiftAmount : shiftAmount;
                } // if

                // test the y
                if (topLeftY < 0 || topLeftY + rows > params.gridSize) {
                    shiftDelta.y = topLeftY < 0 ? -shiftAmount : shiftAmount;
                } // if
                
                return shiftDelta;
            },
            
            
            shift: function(shiftDelta, shiftOriginCallback) {
                // if the shift delta x and the shift delta y are both 0, then return
                if ((shiftDelta.x === 0) && (shiftDelta.y === 0)) { return; }
                
                var ii, startTicks = GRUNT.Log.getTraceTicks();
                // GRUNT.Log.info("need to shift tile store grid, " + shiftDelta.x + " cols and " + shiftDelta.y + " rows.");

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
                    topLeftOffset = SLICK.V.add(topLeftOffset, shiftDelta);
                } // if..else

                // create the tile shift offset
                tileShift.x += (-shiftDelta.x * params.tileSize);
                tileShift.y += (-shiftDelta.y * params.tileSize);
                GRUNT.Log.trace("tile storage shifted", startTicks);

                // populate with the last tile creator (crazy talk)
                self.populate(lastTileCreator, lastNotifyListener);
            },
            
            /*
            The setOrigin method is used to tell the tile store the position of the center tile in the grid
            */
            setOrigin: function(col, row) {
                if (! tileOrigin) {
                    topLeftOffset = SLICK.V.offset(new SLICK.Vector(col, row), -tileHalfWidth);
                }
                else {
                    shiftOrigin(col, row);
                } // if..else
            }
        };
        
        GRUNT.WaterCooler.listen("imagecache.cleared", function(args) {
            // reset all the tiles loaded state
            for (var ii = storage.length; ii--; ) {
                if (storage[ii]) {
                    storage[ii].loaded = false;
                } // if
            } // for
        });
        
        return self;
    };

    // initialise variables
    var emptyTile = null,
        panningTile = null;
    
    function getEmptyTile() {
        if (! emptyTile) {
            emptyTile = document.createElement('canvas');
            emptyTile.width = module.Config.TILESIZE;
            emptyTile.height = module.Config.TILESIZE;
            
            var tileContext = emptyTile.getContext('2d');
            
            tileContext.fillStyle = "rgba(150, 150, 150, 0.05)";
            tileContext.fillRect(0, 0, emptyTile.width, emptyTile.height);
        } // if
        
        return emptyTile;
    } // getEmptyTile
    
    function getPanningTile() {
        if (! panningTile) {
            panningTile = document.createElement('canvas');
            panningTile.width = module.Config.TILESIZE;
            panningTile.height = module.Config.TILESIZE;
            
            var tileContext = panningTile.getContext('2d'),
                lineDiff = Math.sqrt(module.Config.TILESIZE);
            
            tileContext.fillStyle = "rgba(200, 200, 200, 1)";
            tileContext.strokeStyle = "rgb(190, 190, 190)";
            tileContext.lineWidth = 0.5;
            tileContext.fillRect(0, 0, panningTile.width, panningTile.height);
            
            // draw the tile background
            tileContext.beginPath();
            for (var xx = 0; xx < panningTile.width; xx += lineDiff) {
                tileContext.moveTo(xx, 0);
                tileContext.lineTo(xx, panningTile.height);
                
                for (var yy = 0; yy < panningTile.height; yy += lineDiff) {
                    tileContext.moveTo(0, yy);
                    tileContext.lineTo(panningTile.width, yy);
                }
            } // for
            tileContext.stroke();
        } // if
        
        return panningTile;
    } // getLoadingTile
    
    // define the module
    var module = {
        // define the tiler config
        Config: {
            TILESIZE: 256,
            // TODO: put some logic in to determine optimal buffer size based on connection speed...
            TILEBUFFER: 1,
            TILEBUFFER_LOADNEW: 0.2
        },
        
        Tile: function(params) {
            params = GRUNT.extend({
                x: 0,
                y: 0,
                size: 256
            }, params);
            
            return params;
        },
        
        ImageTile: function(params) {
            // initialise parameters with defaults
            params = GRUNT.extend({
                url: "",
                sessionParamRegex: null,
                loaded: false
            }, params);
            
            return new module.Tile(params);
        },
        
        TileGrid: function(params) {
            // extend the params with the defaults
            params = GRUNT.extend({
                tileSize: SLICK.Tiling.Config.TILESIZE,
                drawGrid: false,
                center: new SLICK.Vector(),
                shiftOrigin: null,
                supportFastDraw: true,
                checkChange: 100
            }, params);
            
            // create the tile store
            var tileStore = new TileStore(GRUNT.extend({
                onPopulate: function() {
                    gridDirty = true;
                    self.wakeParent();
                }
            }, params));
            
            // initialise varibles
            var halfTileSize = Math.round(params.tileSize >> 1),
                invTileSize = params.tileSize ? 1 / params.tileSize : 0,
                lastOffset = null,
                gridDirty = false,
                tileDrawQueue = [],
                loadedTileCount = 0,
                lastCheckOffset = new SLICK.Vector(),
                shiftDelta = new SLICK.Vector(),
                reloadTimeout = 0,
                gridHeightWidth = tileStore.getGridSize() * params.tileSize;
            
            function updateDrawQueue(context, offset, dimensions, view) {
                // calculate offset change since last draw
                var offsetChange = lastOffset ? SLICK.V.absSize(SLICK.V.diff(lastOffset, offset)) : halfTileSize;
                
                // TODO: optimize
                if (offsetChange >= 20) {
                    var tile, tileShift = tileStore.getTileShift(),
                        tileStart = new SLICK.Vector(
                                        Math.floor((offset.x + tileShift.x) * invTileSize), 
                                        Math.floor((offset.y + tileShift.y) * invTileSize)),
                        tileCols = Math.ceil(dimensions.width * invTileSize) + 1,
                        tileRows = Math.ceil(dimensions.height * invTileSize) + 1,
                        centerPos = new SLICK.Vector((tileCols-1) * 0.5, (tileRows-1) * 0.5),
                        tileOffset = new SLICK.Vector((tileStart.x * params.tileSize), (tileStart.y * params.tileSize)),
                        viewAnimating = view.isAnimating();
                    
                    // reset the tile draw queue
                    tileDrawQueue = [];
                    tilesNeeded = false;
                
                    // right, let's draw some tiles (draw rows first)
                    for (var yy = tileRows; yy--; ) {
                        // initialise the y position
                        var yPos = yy * params.tileSize + tileOffset.y;

                        // iterate through the columns and draw the tiles
                        for (var xx = tileCols; xx--; ) {
                            // get the tile
                            tile = tileStore.getTile(xx + tileStart.x, yy + tileStart.y);
                            var xPos = xx * params.tileSize + tileOffset.x,
                                centerDiff = new SLICK.Vector(xx - centerPos.x, yy - centerPos.y);
                        
                            if (! tile) {
                                shiftDelta = tileStore.getShiftDelta(tileStart.x, tileStart.y, tileCols, tileRows);
                            } // if
                        
                            // add the tile and position to the tile draw queue
                            tileDrawQueue.push({
                                tile: tile,
                                coordinates: new SLICK.Vector(xPos, yPos),
                                centerness: SLICK.V.absSize(centerDiff)
                            });
                        } // for
                    } // for
                
                    // sort the tile queue by "centerness"
                    tileDrawQueue.sort(function(itemA, itemB) {
                        return itemB.centerness - itemA.centerness;
                    });
                    
                    lastOffset = SLICK.V.copy(offset);
                } // if
            } // updateDrawQueue
            
            // initialise self
            var self = GRUNT.extend(new SLICK.Graphics.ViewLayer(params), {
                gridDimensions: new SLICK.Dimensions(gridHeightWidth, gridHeightWidth),
                
                cycle: function(tickCount, offset) {
                    var needTiles = shiftDelta.x + shiftDelta.y !== 0,
                        changeCount = 0;

                    if (needTiles) {
                        tileStore.shift(shiftDelta, params.shiftOrigin);

                        // reset the delta
                        shiftDelta = new SLICK.Vector();
                        
                        // things need to happen
                        changeCount++;
                    } // if
                    
                    // if the grid is dirty let the calling view know
                    return changeCount + gridDirty ? 1 : 0;
                },
                
                drawTile: function(context, tile, x, y, state) {
                },
                
                draw: function(context, offset, dimensions, state, view) {
                    // initialise variables
                    var startTicks = GRUNT.Log.getTraceTicks(),
                        tileShift = tileStore.getTileShift(),
                        xShift = offset.x + tileShift.x,
                        yShift = offset.y + tileShift.y;

                    if (state !== SLICK.Graphics.DisplayState.PINCHZOOM) {
                        updateDrawQueue(context, offset, dimensions, view);
                        GRUNT.Log.trace("updated draw queue", startTicks);
                    } // if

                    // set the context stroke style for the border
                    if (params.drawGrid) {
                        context.strokeStyle = "rgba(50, 50, 50, 0.3)";
                    } // if

                    // begin the path for the tile borders
                    context.beginPath();

                    // iterate through the tiles in the draw queue
                    for (var ii = tileDrawQueue.length; ii--; ) {
                        var tile = tileDrawQueue[ii].tile,
                            x = tileDrawQueue[ii].coordinates.x - xShift,
                            y = tileDrawQueue[ii].coordinates.y - yShift;

                        // if the tile is loaded, then draw, otherwise load
                        if (tile) {
                            // draw the tile
                            self.drawTile(context, tile, x, y, state);
                            
                            // update the tile position
                            tile.x = x;
                            tile.y = y;
                        } // if

                        // if we are drawing borders, then draw that now
                        if (params.drawGrid) {
                            context.rect(x, y, params.tileSize, params.tileSize);
                        } // if
                    } // for

                    // draw the borders if we have them...
                    context.stroke();
                    GRUNT.Log.trace("drawn tiles", startTicks);                        
                    
                    // flag the grid as not dirty
                    gridDirty = false;
                },
                
                getTileSize: function() {
                    return params.tileSize;
                },
                
                getTileVirtualXY: function(col, row, getCenter) {
                    // get the normalized position from the tile store
                    var pos = tileStore.getNormalizedPos(col, row),
                        fnresult = new SLICK.Vector(pos.x * params.tileSize, pos.y * params.tileSize);
                    
                    if (getCenter) {
                        fnresult.x += halfTileSize;
                        fnresult.y += halfTileSize;
                    } // if
                    
                    return fnresult;
                },
                
                getCenterXY: function() {
                    // get the center column and row index
                    var midIndex = Math.ceil(tileStore.getGridSize() >> 1);
                    
                    return self.getTileVirtualXY(midIndex, midIndex, true);
                },
                
                populate: function(tileCreator) {
                    tileStore.populate(tileCreator, function(tile) {
                    });
                }
            });
            
            // listen for tiles loading
            GRUNT.WaterCooler.listen("tile.loaded", function(args) {
                gridDirty = true;
                self.wakeParent();
            });
            
            return self;
        },
        
        ImageTileGrid: function(params) {
            params = GRUNT.extend({
                
            }, params);
            
            function handleImageLoad(loadedImage, fromCache) {
                GRUNT.WaterCooler.say("tile.loaded");
            } // handleImageLoad
            
            var self = GRUNT.extend(new module.TileGrid(params), {
                drawTile: function(context, tile, x, y, state) {
                    var image = SLICK.Resources.getImage(tile.url);
                    
                    // TODO: remove this for performance but work out how to make remove problem areas
                    if (state === SLICK.Graphics.DisplayState.PAN) {
                        context.drawImage(getPanningTile(), x, y);
                    } // if

                    if (image && image.complete) {
                        context.drawImage(image, x, y);
                    }
                    else {
                        context.drawImage(getEmptyTile(), x, y);
                        
                        // load the image if not loaded
                        if (! image) {
                            SLICK.Resources.loadImage(tile.url, handleImageLoad);
                        } // if
                    } // if..else
                }
            });
            
            return self;
        },
        
        Tiler: function(params) {
            params = GRUNT.extend({
                container: "",
                drawCenter: false,
                onPan: null,
                onPanEnd: null,
                tapHandler: null,
                doubleTapHandler: null,
                zoomHandler: null,
                onDraw: null,
                datasources: {},
                tileLoadThreshold: "first"
            }, params);
            
            // initialise layers
            var gridIndex = 0;
            var lastTileLayerLoaded = "";
            var actualTileLoadThreshold = 0;
            
            var tileCountLoaderFns = {
                first: function(tileCount) {
                    return 1;
                },
                auto: function(tileCount) {
                    return tileCount >> 1;
                },
                
                all: function(tileCount) {
                    return tileCount;
                }
            };
            
            // create the parent
            var self = new SLICK.Graphics.View(GRUNT.extend({}, params, {
                // define panning and scaling properties
                pannable: true,
                scalable: true,
                scaleDamping: true
            }));
            
            // handle tap and double tap events
            SLICK.Touch.captureTouch(document.getElementById(params.container), params);
            
            // initialise self
            GRUNT.extend(self, {
                getTileLayer: function() {
                    return self.getLayer("grid" + gridIndex);
                },

                setTileLayer: function(value) {
                    // watch the layer
                    self.setLayer("grid" + gridIndex, value);
                    
                    // update the tile load threshold
                    GRUNT.WaterCooler.say("grid.updated", { grid: value });
                },

                gridPixToViewPix: function(vector) {
                    var offset = self.getOffset();
                    return new SLICK.Vector(vector.x - offset.x, vector.y - offset.y);
                },

                viewPixToGridPix: function(vector) {
                    var offset = self.getOffset();
                    return new SLICK.Vector(vector.x + offset.x, vector.y + offset.y);
                },
                
                cleanup: function() {
                    self.removeLayer("grid" + gridIndex);
                }
            }); // self

            return self;
        } // Tiler
    };
    
    return module;
    
})();/*
File:   slick.geo.js
File is used to define geo namespace and classes for implementing GIS classes and operations
*/

/* GEO Basic Type definitions */

SLICK.Geo = (function() {
    // define constants
    var LAT_VARIABILITIES = [
        1.406245461070741,
        1.321415085624082,
        1.077179995861952,
        0.703119412486786,
        0.488332580888611
    ];
    
    var REGEX_NUMBERRANGE = /(\d+)\s?\-\s?(\d+)/,
        REGEX_BUILDINGNO = /^(\d+).*$/,
        ROADTYPE_REGEX = null,
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
        };
    
    
    // define the engines array
    var engines = {};
    
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
    
    /**
    This function is used to determine the match weight between a freeform geocoding
    request and it's structured response.
    */
    function plainTextAddressMatch(request, response, compareFns, fieldWeights) {
        var matchWeight = 0;
        
        // uppercase the request for comparisons
        request = request.toUpperCase();
        
        // GRUNT.Log.info("CALCULATING MATCH WEIGHT FOR [" + request + "] = [" + response + "]");
        
        // iterate through the field weights
        for (var fieldId in fieldWeights) {
            // get the field value
            var fieldVal = response[fieldId];

            // if we have the field value, and it exists in the request address, then add the weight
            if (fieldVal) {
                // get the field comparison function
                var compareFn = compareFns[fieldId],
                    matchStrength = compareFn ? compareFn(request, fieldVal) : (request.containsWord(fieldVal) ? 1 : 0);

                // increment the match weight
                matchWeight += (matchStrength * fieldWeights[fieldId]);
            } // if
        } // for
        
        return matchWeight;
    } // plainTextAddressMatch
   
    // define the module
    var module = {
        
        /* geo engine class */
        
        Engine: function(params) {
            // if the id for the engine is not specified, throw an exception
            if (! params.id) {
                throw new Error("A GEO.Engine cannot be registered without providing an id.");
            } // if

            // map the parameters directly to self
            var self = GRUNT.extend({
                remove: function() {
                    delete engines[self.id];
                }
            }, params);
            
            // register the engine
            engines[self.id] = self;
            
            return self;
        },
        
        /**
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
        
        /* geo type definitions */
        
        Distance: function(pos1, pos2) {
            // define some constants
            var M_PER_KM = 1000;
            var KM_PER_RAD = 6371;

            // initialise private members
            var dist = 0;

            /* calculate the distance */

            // if both position 1 and position 2 are passed and valid
            if ((! module.emptyPos(pos1)) && (! module.emptyPos(pos2))) {
                var halfdelta_lat = (pos2.lat - pos1.lat).toRad() >> 1;
                var halfdelta_lon = (pos2.lon - pos1.lon).toRad() >> 1;

                // TODO: find out what a stands for, I don't like single char variables in code (same goes for c)
                var a = (Math.sin(halfdelta_lat) * Math.sin(halfdelta_lat)) + 
                        (Math.cos(pos1.lat.toRad()) * Math.cos(pos2.lat.toRad())) * 
                        (Math.sin(halfdelta_lon) * Math.sin(halfdelta_lon));

                // calculate c (whatever c is)
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                // calculate the distance
                dist = KM_PER_RAD * c;
            } // if

            // initialise self
            var self = {
                toM: function() {
                    return dist * M_PER_KM;
                },

                toKM: function() {
                    return dist;
                },

                toString: function() {
                    return dist + "km";
                }
            }; // 


            return self;
        }, // Distance
        
        Radius: function(init_dist, init_uom) {
            // initialise variables

            // TODO: actually make this class useful

            // initialise self
            var self = {
                distance: parseInt(init_dist, 10),
                uom: init_uom
            }; 

            return self;
        }, // Radius
        
        Position: function(initLat, initLon) {
            // initialise self
            return {
                lat: parseFloat(initLat ? initLat : 0),
                lon: parseFloat(initLon ? initLon : 0)
            };
        }, // Position
        
        BoundingBox: function(initMin, initMax) {
            // initialise self
            var self = {
                min: module.parsePosition(initMin),
                max: module.parsePosition(initMax),

                expand: function(amount) {
                    self.min.lat -= amount;
                    self.min.lon -= module.Utilities.normalizeLon(amount);
                    self.max.lat += amount;
                    self.max.lon += module.Utilities.normalizeLon(amount);
                },
                
                getDistance: function() {
                    return new module.Distance(self.min, self.max);
                },
                
                getCenter: function() {
                    // calculate the bounds size
                    var size = module.calculateBoundsSize(self.min, self.max);
                    
                    // create a new position offset from the current min
                    return new SLICK.Geo.Position(self.min.lat + (size.y * 0.5), self.min.lon + (size.x * 0.5));
                },

                transform: function(transformers) {
                    // create a new instance of the BoundingBox to transform
                    var target = new SLICK.Geo.BoundingBox(self.min, self.max);

                    GRUNT.Log.info("applying " + transformers.length + " transformers");
                    // iterate through the transformers, and call them
                    for (var ii = 0; transformers && (ii < transformers.length); ii++) {
                        transformers[ii].apply(target);
                    } // for

                    return target;
                },

                toString: function() {
                    return String.format("({0}, {1})", self.min, self.max);
                }
            }; // self

            return self;
        }, // BoundingBox
        
        Transforms: (function() {
            return {
                Shrink: function(new_width, new_height) {
                    return function() {
                        //GRUNT.Log.info(String.format("SHRINKING {2} to {0} x {1}", new_width, new_height, this));
                    };
                },

                Offset: function(x_offset, y_offset) {
                    return function() {
                        //GRUNT.Log.info(String.format("OFFSETING {2} by {0}, {1}", x_offset, y_offset, this));
                    };
                }
            };
        })(),
        
        /* addressing and geocoding support */
        
        // TODO: probably need to include local support for addressing, but really don't want to bulk out slick :/
        
        Address: function(params) {
            params = GRUNT.extend({
                streetDetails: "",
                location: "",
                country: "",
                postalCode: "",
                pos: null,
                boundingBox: null
            }, params);
            
            // define self
            var self = GRUNT.extend(params, {
                getPos: function() {
                    return params.pos;
                },
                
                toString: function() {
                    return params.streetDetails + " " + params.location;
                }
            });
            
            return self;
        },
        
        GeocodeFieldWeights: {
            streetDetails: 50,
            location: 50
        },
        
        AddressCompareFns: {
        },
        
        /* utilities */
        
        
        /*
        Module:  SLICK.Geo.Utilities
        This module contains GIS utility functions that apply across different mapping platforms.  Credit 
        goes to the awesome team at decarta for providing information on many of the following functions through
        their forums here (http://devzone.decarta.com/web/guest/forums?p_p_id=19&p_p_action=0&p_p_state=maximized&p_p_mode=view&_19_struts_action=/message_boards/view_message&_19_messageId=43131)
        */
        Utilities: (function() {
            // define some constants
            var ECC = 0.08181919084262157;

            var self = {
                lat2pix: function(lat, scale) {
                    var radLat = (parseFloat(lat)*(2*Math.PI))/360;
                    var sinPhi = Math.sin(radLat);
                    var eSinPhi = ECC * sinPhi;
                    var retVal = Math.log(((1.0 + sinPhi) / (1.0 - sinPhi)) * Math.pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ECC)) / 2.0;

                    return (retVal / scale);
                },

                lon2pix: function(lon, scale) {
                    return ((parseFloat(lon)/180)*Math.PI) / scale;
                },

                pix2lon: function(x, scale) {
                    return self.normalizeLon((x * scale)*180/Math.PI);
                },

                pix2lat: function(y, scale) {
                    var phiEpsilon = 1E-7;
                    var phiMaxIter = 12;
                    var t = Math.pow(Math.E, -y * scale);
                    var prevPhi = self.mercatorUnproject(t);
                    var newPhi = self.findRadPhi(prevPhi, t);
                    var iterCount = 0;

                    while (iterCount < phiMaxIter && Math.abs(prevPhi - newPhi) > phiEpsilon) {
                        prevPhi = newPhi;
                        newPhi = self.findRadPhi(prevPhi, t);
                        iterCount++;
                    } // while

                    return newPhi*180/Math.PI;
                },

                mercatorUnproject: function(t) {
                    return (Math.PI / 2) - 2 * Math.atan(t);
                },

                findRadPhi: function(phi, t) {
                    var eSinPhi = ECC * Math.sin(phi);

                    return (Math.PI / 2) - (2 * Math.atan (t * Math.pow((1 - eSinPhi) / (1 + eSinPhi), ECC / 2)));
                },
                
                normalizeLon: function(lon) {
                    // return lon;
                    while (lon < -180) {
                        lon += 360;
                    } // while
                    
                    while (lon > 180) {
                        lon -= 360;
                    } // while
                    
                    return lon;
                }
            }; // self

            return self;
        })(), // Utilitities
        
        GeoSearchResult: function(params) {
            params = GRUNT.extend({
                id: null,
                caption: "",
                resultType: "",
                data: null,
                pos: null,
                matchWeight: 0
            }, params);
            
            return GRUNT.extend(params, {
                toString: function() {
                    return params.caption + (params.matchWeight ? " (" + params.matchWeight + ")" : "");
                }
            });
        },
        
        GeoSearchAgent: function(params) {
            params = GRUNT.extend({
            }, params);

            // initialise self
            var self = GRUNT.extend({
                
            }, SLICK.Dispatcher.createAgent(params));
            
            return self;
        },
        
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
            params = GRUNT.extend({
                name: "Geocoding Search Agent",
                paramTranslator: null,
                execute: function(searchParams, callback) {
                    try {
                        // check for a freeform request
                        if ((! searchParams.reverse) && (! searchParams.freeform)) {
                            address = new module.Address(searchParams);
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
                        GRUNT.Log.exception(e);
                    } // try..catch
                }
            }, params);
            
            var self = new module.GeoSearchAgent(params);
            
            return self;
        },
        
        /* Point of Interest Objects */
        
        PointOfInterest: function(params) {
            params = GRUNT.extend({
                id: 0,
                title: "",
                pos: null,
                lat: "",
                lon: "",
                group: "",
                retrieved: 0,
                isNew: true
            }, params);

            // if the position is not defined, but we have a lat and lon, create a new position
            if ((! params.pos) && params.lat && params.lon) {
                params.pos = new SLICK.Geo.Position(params.lat, params.lon);
            } // if
            
            return GRUNT.extend({
                toString: function() {
                    return params.id + ": '" + params.title + "'";
                }
            }, params);
        },
        
        POIStorage: function(params) {
            params = GRUNT.extend({
                visibilityChange: null,
                onPOIDeleted: null,
                onPOIAdded: null
            }, params);

            // initialise variables
            var storageGroups = {},
                visible = true;
                
            function getStorageGroup(groupName) {
                // first get storage group for the poi based on type
                var groupKey = groupName ? groupName : "default";
                
                // if the storage group does not exist, then create it
                if (! storageGroups[groupKey]) {
                    storageGroups[groupKey] = [];
                } // if                
                
                return storageGroups[groupKey];
            } // getStorageGroup
                
            function findExisting(poi) {
                if (! poi) { return null; }
                
                // iterate through the specified group and look for the key by matching the id
                var group = getStorageGroup(poi.group);
                for (var ii = 0; ii < group.length; ii++) {
                    if (group[ii].id == poi.id) {
                        return group[ii];
                    } // if
                } // for
                
                return null;
            } // findExisting
            
            function addPOI(poi) {
                getStorageGroup(poi.group).push(poi);
            } // addPOI
            
            function removeFromStorage(poi) {
                var group = getStorageGroup(poi.group);
                
                for (var ii = 0; ii < group.length; ii++) {
                    if (group[ii].id == poi.id) {
                        group.splice(ii, 1);
                        break;
                    }
                } // for
            } // removeFromStorage
            
            function poiGrabber(test) {
                var matchingPOIs = [];
                
                // iterate through the groups and pois within each group
                for (var groupKey in storageGroups) {
                    for (var ii = 0; ii < storageGroups[groupKey].length; ii++) {
                        if ((! test) || test(storageGroups[groupKey][ii])) {
                            matchingPOIs.push(storageGroups[groupKey][ii]);
                        } // if
                    } // for
                } // for
                
                return matchingPOIs;
            } // poiGrabber
            
            function triggerUpdate() {
                GRUNT.WaterCooler.say("geo.pois-updated", {
                    srcID: self.id,
                    pois: self.getPOIs()
                });
            } // triggerUpdate

            // initialise self
            var self = {
                id: GRUNT.generateObjectID(),
                
                getPOIs: function() {
                    return poiGrabber();
                },

                getOldPOIs: function(groupName, testTime) {
                    return poiGrabber(function(testPOI) {
                        return (testPOI.group == groupName) && (testPOI.retrieved < testTime);
                    });
                },

                getVisible: function() {
                    return visible;
                },

                setVisible: function(value) {
                    if (value != visible) {
                        visible = value;

                        // fire the visibility change event
                        if (params.visibilityChange) {
                            params.visibilityChange();
                        } // if
                    } // if
                },

                findById: function(searchId) {
                    var matches = poiGrabber(function(testPOI) {
                        return testPOI.id == searchId;
                    });
                    
                    return matches.length > 0 ? matches[0] : null;
                },

                /*
                Method:  findByBounds
                Returns an array of the points of interest that have been located within
                the bounds of the specified bounding box
                */
                findByBounds: function(searchBounds) {
                    return poiGrabber(function(testPOI) {
                        return SLICK.Geo.posInBounds(testPOI.pos, searchBounds);
                    });
                },

                addPOIs: function(newPOIs, clearExisting) {
                    // if we need to clear existing, then reset the storage
                    if (clearExisting) {
                        storageGroups = {};
                    } // if

                    // iterate through the new pois and put into storage
                    for (var ii = 0; newPOIs && (ii < newPOIs.length); ii++) {
                        newPOIs[ii].retrieved = SLICK.Clock.getTime(true);
                        addPOI(newPOIs[ii]);
                    } // for
                },
                
                removeGroup: function(group) {
                    if (storageGroups[group]) {
                        delete storageGroups[group];
                        triggerUpdate();
                    } // if
                },
                
                update: function(refreshedPOIs) {
                    // initialise arrays to receive the pois
                    var newPOIs = [],
                        ii = 0,
                        groupName = refreshedPOIs.length > 0 ? refreshedPOIs[0].group : '',
                        timeRetrieved = SLICK.Clock.getTime(true);
                        
                    // iterate through the pois and determine state
                    for (ii = 0; ii < refreshedPOIs.length; ii++) {
                        // look for the poi in the poi layer
                        var foundPOI = findExisting(refreshedPOIs[ii]);

                        // add the poi to either the update or new array according to whether it was found
                        if (foundPOI) {
                            // GRUNT.Log.info("FOUND EXISTING POI");
                            foundPOI.retrieved = timeRetrieved;
                            foundPOI.isNew = false;
                        }
                        else {
                            newPOIs.push(refreshedPOIs[ii]);
                        }
                    } // for
                    
                    // now all we have left are deleted pois transpose those into the deleted list
                    var deletedPOIs = self.getOldPOIs(groupName, timeRetrieved);

                    // add new pois to the poi layer
                    self.addPOIs(newPOIs);
                    // GRUNT.Log.info(String.format("POI-UPDATE: {0} new, {1} deleted", newPOIs.length, deletedPOIs.length));

                    // fire the on poi added event when appropriate
                    for (ii = 0; params.onPOIAdded && (ii < newPOIs.length); ii++) {
                        params.onPOIAdded(newPOIs[ii]);
                    } // for

                    for (ii = 0; ii < deletedPOIs.length; ii++) {
                        // trigger the event if assigned
                        if (params.onPOIDeleted) {
                            params.onPOIDeleted(deletedPOIs[ii]);
                        } // if

                        // remove the poi from storage
                        removeFromStorage(deletedPOIs[ii]);
                    } // for
                    
                    // if we have made updates, then fire the geo pois updated event
                    if (newPOIs.length + deletedPOIs.length > 0) {
                        triggerUpdate();
                    } // if
                }
            };

            return self;
        },
          
        MapProvider: function() {
            // initailise self
            var self = {
                zoomLevel: 0,
                
                checkZoomLevel: function(zoomLevel) {
                    return zoomLevel;
                },
                
                getCopyright: function() {
                },

                getMapTiles: function(tiler, position, zoom_level, callback) {

                },

                getPositionForXY: function(x, y) {
                    return null;
                }
            };

            return self;
        }, // MapProvider
        
        /* static functions */
        
        copyPos: function(src) {
            return src ? new module.Position(src.lat, src.lon) : null;
        },
        
        emptyPos: function(pos) {
            return (! pos) || ((pos.lat === 0) && (pos.lon === 0));
        },
        
        posToStr: function(pos) {
            return pos.lat + " " + pos.lon;
        },
        
        parsePosition: function(pos) {
            // first case, null value, create a new empty position
            if (! pos) {
                return new module.Position();
            }
            else if (GRUNT.isPlainObject(pos) && (pos.lat !== 'undefined')) {
                return pos;
            }
            // now attempt the various different types of splits
            else if (pos.split) {
                var sepChars = [' ', ','];
                for (var ii = 0; ii < sepChars.length; ii++) {
                    var coords = pos.split(sepChars[ii]);
                    if (coords.length === 2) {
                        return new module.Position(coords[0], coords[1]);
                    } // if
                } // for
            } // if..else
            
            return null;
        },
        
        parsePositionArray: function(sourceData) {
            var sourceLen = sourceData.length,
                positions = new Array(sourceLen);
                
            for (var ii = sourceLen; ii--; ) {
                positions[ii] = module.parsePosition(sourceData[ii]);
            } // for
            
            return positions;
        },
        
        posToMercatorPixels: function(pos, radsPerPixel) {
            return new SLICK.Vector(SLICK.Geo.Utilities.lon2pix(pos.lon, radsPerPixel), SLICK.Geo.Utilities.lat2pix(pos.lat, radsPerPixel));
        },

        mercatorPixelsToPos: function(x, y, radsPerPixel) {
            // return the new position
            return new module.Position(
                SLICK.Geo.Utilities.pix2lat(y, radsPerPixel),
                SLICK.Geo.Utilities.normalizeLon(SLICK.Geo.Utilities.pix2lon(x, radsPerPixel))
            );
        },
        
        emptyBounds: function(bounds) {
            return (! bounds) || module.emptyPos(bounds.min) || module.emptyPos(bounds.max);
        },
        
        
        /*
        Method: inBounds
        This method is used to determine whether or not the position is
        within the bounds rect supplied. 
        */
        posInBounds: function(pos, bounds) {
            // initialise variables
            var fnresult = ! (module.emptyPos(pos) || module.emptyBounds(bounds));

            // check the pos latitude
            fnresult = fnresult && (pos.lat >= bounds.min.lat) && (pos.lat <= bounds.max.lat);

            // check the pos longitude
            fnresult = fnresult && (pos.lon >= bounds.min.lon) && (pos.lon <= bounds.max.lon);

            return fnresult;
        },
        
        calculateBoundsSize: function(min, max, normalize) {
            var size = new SLICK.Vector(0, max.lat - min.lat);
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
        Function adapted from the following code:
        http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/43958790eafe037f/66e889029c555bee
        */
        getBoundingBoxZoomLevel: function(bounds, displaySize) {
            // get the constant index for the center of the bounds
            var boundsCenter = bounds.getCenter(),
                variabilityIndex = Math.min(Math.round(Math.abs(boundsCenter.lat) * 0.05), LAT_VARIABILITIES.length),
                variability = LAT_VARIABILITIES[variabilityIndex],
                delta = module.calculateBoundsSize(bounds.min, bounds.max),
                // interestingly, the original article had the variability included, when in actual reality it isn't, 
                // however a constant value is required. must find out exactly what it is.  At present, though this
                // works fine.
                bestZoomH = Math.ceil(Math.log(LAT_VARIABILITIES[3] * displaySize.height / delta.y) / Math.log(2)),
                bestZoomW = Math.ceil(Math.log(variability * displaySize.width / delta.x) / Math.log(2));
            
            GRUNT.Log.info("constant index for bbox: " + bounds + " (center = " + boundsCenter + ") is " + variabilityIndex);
            GRUNT.Log.info("distances  = " + delta);
            GRUNT.Log.info("optimal zoom levels: height = " + bestZoomH + ", width = " + bestZoomW);
            
            // return the lower of the two zoom levels
            return Math.min(bestZoomH, bestZoomW);
        },
        
        getBoundsForPositions: function(positions, padding) {
            var bounds = null,
                startTicks = SLICK.Clock.getTime();
                
            // if padding is not specified, then set to auto
            if (! padding) {
                padding = "auto";
            } // if
            
            for (var ii = positions.length; ii--; ) {
                if (! bounds) {
                    bounds = new SLICK.Geo.BoundingBox(module.copyPos(positions[ii]), module.copyPos(positions[ii]));
                }
                else {
                    var minDiff = module.calculateBoundsSize(bounds.min, positions[ii], false),
                        maxDiff = module.calculateBoundsSize(positions[ii], bounds.max, false);

                    if (minDiff.x < 0) { bounds.min.lon = positions[ii].lon; }
                    if (minDiff.y < 0) { bounds.min.lat = positions[ii].lat; }
                    if (maxDiff.x < 0) { bounds.max.lon = positions[ii].lon; }
                    if (maxDiff.y < 0) { bounds.max.lat = positions[ii].lat; }
                } // if..else
            } // for
            
            // expand the bounds to give us some padding
            if (padding) {
                if (padding == "auto") {
                    var size = module.calculateBoundsSize(bounds.min, bounds.max);
                    
                    // update padding to be a third of the max size
                    padding = Math.max(size.x, size.y) * 0.3;
                } // if
                
                bounds.expand(padding);
            } // if
            
            GRUNT.Log.info("bounds calculated in " + (SLICK.Clock.getTime() - startTicks) + " ms");

            return bounds;
        },
        
        /**
        The normalizeAddress function is used to take an address that could be in a variety of formats
        and normalize as many details as possible.  Text is uppercased, road types are replaced, etc.
        */
        normalizeAddress: function(addressText) {
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
        
        rankGeocodeResponses: function(requestAddress, responseAddresses, engine) {
            var matches = [],
                compareFns = module.AddressCompareFns;
                
            // if the engine is specified and the engine has compare fns, then extend them
            if (engine && engine.compareFns) {
                compareFns = GRUNT.extend({}, compareFns, engine.compareFns);
            } // if
            
            // iterate through the response addresses and compare against the request address
            for (var ii = 0; ii < responseAddresses.length; ii++) {
                matches.push(new module.GeoSearchResult({
                    caption: responseAddresses[ii].toString(),
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
        }
    }; // module

    return module;
})();SLICK.Geo.Location = (function() {
    // initialise some defaults
    var DEFAULT_GEOLOCATION_TIMEOUT = 3000,
        HIGH_ACCURACY_CUTOFF = 10;
    
    
    /* not supported handlers */
    
    function notSupported(args) {
        throw new Error("No geolocation APIs supported.");
    } // getPositionNotSupported
    
    /* geolocation api implementation */
    
    /**
    This function is used to get the current location using the geolocation API.  The default values for
    args are configured to run through the default position acquision phased process as described in the 
    documentation (to be completed).   In essence the phases are:
    
    0 - look for a cached location of high accuracy, if found, call callback and finish
    1 - look for a non-cached position of any accuracy, if found, invoke callback and move to phase 2
    2 - look for a non-cached position of high accuracy, if found, invoke callback and finish
    */
    function geolocationAPI(args) {
        args = GRUNT.extend({
            autoPhasing: true,
            maximumAge: 300000,
            timeout: 0,
            highAccuracyCutoff: 10,
            enableHighAccuracy: true,
            successCallback: null,
            errorCallback: null
        }, args);
        
        var phase = 0,
            lastPosition = null,
            lastAccuracy = 1000000;
            
        function fireErrorCallback(error) {
            if (args.errorCallback) {
                args.errorCallback(error);
            } // if
        } // fireErrorCallback
        
        function getAccuracy(coords) {
            if (GRUNT.isPlainObject(coords.accuracy) && coords.accuracy.horizontal) {
                return coords.accuracy.horizontal;
            }
            else {
                return coords.accuracy;
            } // if..else
        }
        
        function positionSuccess(position) {
            try {
                var pos = new SLICK.Geo.Position(position.coords.latitude, position.coords.longitude),
                    accuracy = getAccuracy(position.coords);

                GRUNT.Log.info("got position coordinates: " + pos + ", accuracy = " + accuracy);
                if (args.successCallback && ((! lastPosition) || (accuracy < lastAccuracy))) {
                    args.successCallback(pos, phase, position);
                } // if

                // if the accuracy is greater than the high accuracy cutoff, and we haven't hit phase 2, then 
                // update
                if ((accuracy > args.highAccuracyCutoff) && (phase < 2)) {
                    // update parameters
                    phase = 2;
                    args.enableHighAccuracy = true;

                    // relocate
                    GRUNT.Log.info("Position not at required accuracy, trying again with high accuracy");
                    locate();
                } // if

                // save the last position
                lastPosition = position;
                lastAccuracy = accuracy;
            }
            catch (e) {
                GRUNT.Log.exception(e); 
            } // try..catch
        } // positionSuccess
        
        function positionError(error) {
            if (error.code === error.PERMISSION_DENIED) {
                fireErrorCallback(error);
            }
            else if (error.code === error.POSITION_UNAVAILABLE) {
                fireErrorCallback(error);
            }
            else if (error.code === error.TIMEOUT) {
                GRUNT.Log.info("had a timeout on cached position, moving to phase 1");
                
                // if our arguments specified a 0 timeout, then we were at phase 0 - looking for a cached position
                // and one doesn't exist, time to move onto phase 1
                if ((args.timeout === 0) && args.autoPhasing) {
                    // update args
                    phase = 1;
                    args.timeout = DEFAULT_GEOLOCATION_TIMEOUT;
                    args.enableHighAccuracy = false;
                    
                    // locate
                    locate();
                } // if
            }
        } // positionError
        
        function locate() {
            // first call is to get the rough position
            navigator.geolocation.getCurrentPosition(positionSuccess, positionError, args);
        } // locate
        
        locate();
    } // getPosition

    var module = {
        get: notSupported
    };
    
    // check for a suitable geolocation api
    if (navigator.geolocation) {
        module.get = geolocationAPI;
    } // if
    
    return module;
})();


SLICK.Geo.Search = (function() {
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
                if (bestMatch.matchWeight - searchResults[ii].matchWeight <= maxDifference) {
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

SLICK.Mapping = (function() {
    var lastAnnotationTween = null,
        lastAnnotationTweenTicks = null;
    
    function getAnnotationTween(tweenType) {
        // get the current tick count
        var tickCount = SLICK.Clock.getTime(true);

        if ((! lastAnnotationTween) || (tickCount - lastAnnotationTweenTicks > 100)) {
            lastAnnotationTween = SLICK.Animation.tweenValue(480, 0, tweenType, null, 250);
            lastAnnotationTweenTicks = tickCount;
        } // if
        
        return lastAnnotationTween;
    } // getAnnotationTween
    
    // TODO: evaluate whether this function can be used for all mapping providers or we need to 
    // route this call to the provider
    function radsPerPixelAtZoom(tileSize, gxZoom) {
        return 2*Math.PI / (tileSize << gxZoom);
    } // radsPerPixelAtZoom
    
    var module = {
        // change this value to have the annotations tween in (eg. SLICK.Animation.Easing.Sine.Out)
        AnnotationTween: null,
        
        GeoTileGrid: function(params) {
            // extend the params with some defaults
            params = GRUNT.extend({
                grid: null,
                centerPos: new SLICK.Geo.Position(),
                centerXY: new SLICK.Vector(),
                radsPerPixel: 0
            }, params);
            
            // determine the mercator 
            var centerMercatorPix = SLICK.Geo.posToMercatorPixels(params.centerPos, params.radsPerPixel);
            
            // calculate the bottom left mercator pix
            // the position of the bottom left mercator pixel is determined by params.subtracting the actual 
            var blMercatorPixX = centerMercatorPix.x - params.centerXY.x,
                blMercatorPixY = centerMercatorPix.y - params.centerXY.y;
            
            // initialise self
            var self = GRUNT.extend({}, params.grid, {
                getBoundingBox: function(x, y, width, height) {
                    return new SLICK.Geo.BoundingBox(
                        self.pixelsToPos(new SLICK.Vector(x, y + height)),
                        self.pixelsToPos(new SLICK.Vector(x + width, y)));
                },
                
                getCenterOffset: function() {
                    return params.centerXY;
                },
                
                getGridXYForPosition: function(pos) {
                    // determine the mercator pixels for teh position
                    var posPixels = SLICK.Geo.posToMercatorPixels(pos, params.radsPerPixel);

                    // calculate the offsets
                    // GRUNT.Log.info("GETTING OFFSET for position: " + pos);
                    var offsetX = posPixels.x - blMercatorPixX;
                    var offsetY = self.gridDimensions.height - (posPixels.y - blMercatorPixY);

                    // GRUNT.Log.info("position mercator pixels: " + pos_mp);
                    // GRUNT.Log.info("bottom left mercator pixels: " + blMercatorPix);
                    // GRUNT.Log.info("calcalated pos offset:    " + offset_x + ", " + offset_y);

                    return new SLICK.Vector(offsetX, offsetY);
                },
                
                getGuideOffset: function(offset) {
                    var tileSize = self.getTileSize();
                    return new SLICK.Vector((offset.x % tileSize), (offset.y % tileSize));
                },
                
                pixelsToPos: function(vector) {
                    return SLICK.Geo.mercatorPixelsToPos(blMercatorPixX + vector.x, (blMercatorPixY + self.gridDimensions.height) - vector.y, params.radsPerPixel);
                }
            });
            
            return self;
        },
        
        /**
        A view layer that is designed to display points of interest in an effective way.
        */
        POIViewLayer: function(params) {
            params = GRUNT.extend({
                
            }, params);
        },
        
        /** 
        */
        Overlay: function(params) {
            params = GRUNT.extend({
                
            }, params);
            
            // initialise self
            var self = {
                
            };
            
            return self;
        },
        
        /**
        The Radar Overlay is used to draw a translucent radar image over the map which can be used
        to indicate the accuracy of the geolocation detection, or possibly distance that has been 
        used to determine points of interest in the nearby area.
        */
        RadarOverlay: function(params) {
            params = GRUNT.extend({
                radarFill: "rgba(0, 221, 238, 0.1)",
                radarStroke: "rgba(0, 102, 136, 0.3)",
                zindex: 100
            }, params);
            
            // initialise variables
            var MAXSIZE = 100;
            var MINSIZE = 20;
            var size = 50;
            var increment = 3;
            
            return GRUNT.extend(new SLICK.Graphics.ViewLayer(params), {
                draw: function(context, offset, dimensions, state, view) {
                    // calculate the center position
                    var xPos = dimensions.width >> 1;
                    var yPos = dimensions.height >> 1;

                    // initialise the drawing style
                    context.fillStyle = params.radarFill;
                    context.strokeStyle = params.radarStroke;
                    
                    // draw the radar circle
                    context.beginPath();
                    context.arc(xPos, yPos, size, 0, Math.PI * 2, false);
                    context.fill();
                    context.stroke();
                }
            });
        },
        
        /**
        The crosshair overlay is used to draw a crosshair at the center of the map.
        */
        CrosshairOverlay: function(params) {
            params = GRUNT.extend({
                lineWidth: 1.5,
                strokeStyle: "rgba(0, 0, 0, 0.5)",
                size: 15,
                zindex: 150,
                scalePosition: false,
                validStates: SLICK.Graphics.DisplayState.ACTIVE | SLICK.Graphics.DisplayState.ANIMATING | SLICK.Graphics.DisplayState.PAN
            }, params);
            
            function drawCrosshair(context, centerPos, size) {
                context.beginPath();
                context.moveTo(centerPos.x, centerPos.y - size);
                context.lineTo(centerPos.x, centerPos.y + size);
                context.moveTo(centerPos.x - size, centerPos.y);
                context.lineTo(centerPos.x + size, centerPos.y);
                context.arc(centerPos.x, centerPos.y, size * 0.6666, 0, 2 * Math.PI, false);
                context.stroke();
            } // drawCrosshair
            
            return GRUNT.extend(new SLICK.Graphics.ViewLayer(params), {
                draw: function(context, offset, dimensions, state, view) {
                    var centerPos = dimensions.getCenter();
                    
                    // initialise the context line style
                    context.lineWidth = params.lineWidth;
                    context.strokeStyle = params.strokeStyle;
                    
                    // draw the cross hair lines
                    drawCrosshair(context, centerPos, params.size);
                }
            });
        },
        
        /** 
        Route Overlay
        */
        RouteOverlay: function(params) {
            params = GRUNT.extend({
                strokeStyle: "rgba(0, 51, 119, 0.9)",
                waypointFillStyle: "#FFFFFF",
                lineWidth: 4,
                data: null,
                pixelGeneralization: 8,
                calculationsPerCycle: 250,
                partialDraw: false,
                zindex: 50,
                validStates: SLICK.Graphics.DisplayState.ACTIVE | SLICK.Graphics.DisplayState.PAN 
            }, params);
            
            var recalc = true,
                last = null,
                coordinates = [],
                geometryCalcIndex = 0,
                instructionCoords = [];
                
            function calcCoordinates(grid) {
                instructionCoords = [];
                
                var startTicks = GRUNT.Log.getTraceTicks(),
                    ii, current, include,
                    geometry = params.data ? params.data.geometry : [],
                    geometryLen = geometry.length,
                    instructions = params.data ? params.data.instructions : [],
                    instructionsLength = instructions.length,
                    calculationsPerCycle = params.calculationsPerCycle,
                    currentCalculations = 0,
                    increment = Math.ceil(Math.log(geometryLen) / Math.log(10));
                    
                // TODO: improve the code reuse in the code below
                // TODO: improve performance here... look at re-entrant processing in cycle perhaps

                // iterate through the position geometry and determine xy coordinates
                for (ii = geometryCalcIndex; ii < geometryLen; ii += increment) {
                    // calculate the current position
                    current = grid.getGridXYForPosition(geometry[ii]);

                    // determine whether the current point should be included
                    include = (! last) || (ii === geometryLen) || 
                        (Math.abs(current.x - last.x) + Math.abs(current.y - last.y) > params.pixelGeneralization);
                    
                    if (include) {
                        coordinates.push(current);
                        
                        // update the last
                        last = current;
                    } // if
                    
                    currentCalculations++;
                    if (currentCalculations >= calculationsPerCycle) {
                        geometryCalcIndex = ii;
                        return;
                    } // if
                    
                    // adjust the increment as required to make sure we capture the last element
                    if (ii + increment >= geometryLen) {
                        increment = Math.max(geometryLen - ii - 1, 1);
                        GRUNT.Log.info("increment adjusted to " + increment);
                    } // if
                } // for
                
                geometryCalcIndex = geometryLen;
                GRUNT.Log.trace(geometryLen + " geometry points generalized to " + coordinates.length + " coordinates", startTicks);
                
                // iterate throught the instructions and add any points to the instruction coordinates array
                last = null;
                for (ii = instructionsLength; ii--; ) {
                    if (instructions[ii].position) {
                        // calculate the current position
                        current = grid.getGridXYForPosition(instructions[ii].position);

                        // determine whether the current point should be included
                        include = (! last) || (ii === 0) || 
                            (Math.abs(current.x - last.x) + Math.abs(current.y - last.y) > params.pixelGeneralization);

                        if (include) {
                            instructionCoords.push(current);

                            // update the last
                            last = current;
                        } // if
                    } // if
                } // for

                GRUNT.Log.trace(instructionsLength + " instructions generalized to " + instructionCoords.length + " coordinates", startTicks);                
                GRUNT.Log.info("finished route calc coordinates");
            } // calcCoordinates
            
            // create the view layer the we will draw the view
            var self = GRUNT.extend(new SLICK.Graphics.ViewLayer(params), {
                getAnimation: function(easingFn, duration, drawCallback, autoCenter) {
                    if (recalc || (geometryCalcIndex > 0)) {
                        return null;
                    } // if

                    // create a new animation layer based on the coordinates
                    return new SLICK.Graphics.AnimatedPathLayer({
                        path: coordinates,
                        zindex: params.zindex + 1,
                        easing: easingFn ? easingFn : SLICK.Animation.Easing.Sine.InOut,
                        duration: duration ? duration : 5000,
                        drawIndicator: drawCallback,
                        autoCenter: autoCenter ? autoCenter : false
                    });
                },

                draw: function(context, offset, dimensions, state, view) {
                    var changes = 0,
                        geometry = params.data ? params.data.geometry : null;
                    
                    if (recalc) {
                        recalc = false;
                        coordinates = [];
                        geometryCalcIndex = 0;
                        
                        GRUNT.Log.info("recalc condition detected, geometry length = " + geometry.length);
                    } // if
                    
                    if (geometry && (geometryCalcIndex < geometry.length)) {
                        calcCoordinates(view.getTileLayer());
                        changes++;
                    } // if
                    
                    var ii,
                        coordLength = coordinates.length;
                        
                    if ((coordLength > 0) && ((! changes) || params.partialDraw)) {
                        // update the context stroke style and line width
                        context.strokeStyle = params.strokeStyle;
                        context.lineWidth = params.lineWidth;

                        // start drawing the path
                        context.beginPath();
                        context.moveTo(coordinates[coordLength-1].x - offset.x, coordinates[coordLength-1].y - offset.y);

                        for (ii = coordLength; ii--; ) {
                            context.lineTo(coordinates[ii].x - offset.x, coordinates[ii].y - offset.y);
                        } // for

                        context.stroke();
                        context.fillStyle = params.waypointFillStyle;

                        // draw the instruction coordinates
                        for (ii = instructionCoords.length; ii--; ) {
                            context.beginPath();
                            context.arc(
                                instructionCoords[ii].x - offset.x, 
                                instructionCoords[ii].y - offset.y,
                                2,
                                0,
                                Math.PI * 2,
                                false);

                            context.stroke();
                            context.fill();
                        } // for
                    } // if
                    
                    return changes;
                }
            });
            
            // listed for grid updates
            GRUNT.WaterCooler.listen("grid.updated", function(args) {
                recalc = true;
                self.wakeParent();
            });
            
            return self;
        },

        /* annotations and annotations overlay */
        
        Annotation: function(params) {
            params = GRUNT.extend({
                xy: null,
                pos: null,
                draw: null,
                tweenIn: module.AnnotationTween
            }, params);
            
            // TODO: make this inherit from sprite
            var animating = false;
            
            var self = {
                xy: params.xy,
                pos: params.pos,
                isNew: false,
                
                isAnimating: function() {
                    return animating;
                },
                
                draw: function(context, offset, state, overlay) {
                    if (! self.xy) { return; }
                    
                    if (self.isNew && (params.tweenIn)) {
                        // get the end value and update the y value
                        var endValue = self.xy.y;

                        // set the y to offscreen
                        self.xy.y = offset.y - 20;
                        
                        // animate the annotation
                        animating = true;
                        
                        SLICK.Animation.tween(self.xy, "y", endValue, params.tweenIn, function() {
                            self.xy.y = endValue;
                            animating = false;
                        }, 250 + (Math.random() * 500));
                    } // if
                    
                    if (params.draw) {
                        params.draw(context, offset, new SLICK.Vector(self.xy.x - offset.x, self.xy.y - offset.y), state, overlay);
                    }
                    else {
                        context.beginPath();
                        context.arc(
                            self.xy.x - offset.x, 
                            self.xy.y - offset.y,
                            4,
                            0,
                            Math.PI * 2,
                            false);                    
                        context.fill();                    
                    }
                    
                    self.isNew = false;
                }
            }; // self
            
            return self;
        },
        
        ImageAnnotation: function(params) {
            params = GRUNT.extend({
                imageUrl: null
            }, params);
            
            var imageOffset = null;
            
            params.draw = function(context, offset, xy, state, overlay) {
                // get the image
                var image = SLICK.Resources.getImage(params.imageUrl);
                if (! image) {
                    SLICK.Resources.loadImage(params.imageUrl, function(loadedImage, fromCache) {
                        overlay.wakeParent();
                    });
                }
                else if (image.complete) {
                    if (! imageOffset) {
                        imageOffset = new SLICK.Vector(-image.width >> 1, -image.height >> 1);
                    } // if
                    
                    // determine the position to draw the image
                    var imageXY = SLICK.V.offset(xy, imageOffset.x, imageOffset.y);

                    // draw the image
                    context.drawImage(image, imageXY.x, imageXY.y, image.width, image.height);
                } // if
            }; // draw

            return new module.Annotation(params);
        },
        
        AnnotationsOverlay: function(params) {
            params = GRUNT.extend({
                pois: null,
                map: null,
                createAnnotationForPOI: null,
                zindex: 100
            }, params);
            
            var annotations = [],
                animating = false,
                staticAnnotations = [];
                
            function createAnnotationForPOI(poi) {
                if (poi && poi.pos) {
                    var annotation = null;
                    if (params.createAnnotationForPOI) {
                        annotation = params.createAnnotationForPOI(poi);
                    }
                    else {
                        annotation = new module.Annotation({
                            pos: poi.pos
                        });
                    } // if..else
                    
                    if (annotation) {
                        annotation.isNew = poi.isNew;
                        poi.isNew = false;
                    } // if
                    
                    return annotation;
                } // if
            } // createAnnotationForPOI
            
            function updateAnnotations(newPOIs) {
                try {
                    // reset the annotations array
                    annotations = [];
                    
                    // iterate through the pois and generate the annotations
                    for (var ii = 0; ii < newPOIs.length; ii++) {
                        if (newPOIs[ii].pos) {
                            var newAnnotation = createAnnotationForPOI(newPOIs[ii]);
                            if (newAnnotation) {
                                annotations.push(newAnnotation); 
                            } // if
                        } // if
                    } // for
                    
                    updateAnnotationCoordinates(annotations);
                }
                catch (e) {
                    GRUNT.Log.exception(e);
                }
            } // updateAnnotations
            
            function updateAnnotationCoordinates(annotationsArray) {
                var grid = params.map ? params.map.getTileLayer() : null;
                
                // iterate through the annotations and calculate the xy coordinates
                for (var ii = 0; grid && (ii < annotationsArray.length); ii++) {
                    // update the annotation xy coordinates
                    annotationsArray[ii].xy = grid.getGridXYForPosition(annotationsArray[ii].pos);
                } // for
            }

            // create the view layer the we will draw the view
            var self = GRUNT.extend(new SLICK.Graphics.ViewLayer(params), {
                draw: function(context, offset, dimensions, state, view) {
                    context.save();
                    try {
                        // initialise variables
                        var ii;
                    
                        // reset animating to false
                        animating = false;
                        context.fillStyle = "rgba(255, 0, 0, 0.75)";
                        context.globalCompositeOperation = "source-over";
                    
                        // iterate through the annotations and draw them
                        for (ii = annotations.length; ii--; ) {
                            annotations[ii].draw(context, offset, state, self);
                            animating = animating || annotations[ii].isAnimating();
                        } // for

                        for (ii = staticAnnotations.length; ii--; ) {
                            staticAnnotations[ii].draw(context, offset, state, self);
                            animating = animating || annotations[ii].isAnimating();
                        } // for

                        if (animating) {
                            self.wakeParent();
                        } // if
                    }
                    finally {
                        context.restore();
                    } // try..finally
                },
                
                /**
                This method provides that ability for the creation of static annotations (as opposed)
                to annotations that are kept in sync with the pois that are POIStorage of the map. 
                */
                add: function(annotation) {
                    staticAnnotations.push(annotation);
                    updateAnnotationCoordinates(staticAnnotations);
                },
                
                isAnimating: function() {
                    return animating;
                }
            });

            GRUNT.WaterCooler.listen("geo.pois-updated", function(args) {
                // if the event source id matches our current poi storage, then apply updates
                if (params.pois && (params.pois.id == args.srcID)) {
                    updateAnnotations(args.pois);
                    self.wakeParent();
                } // if
            });
            
            // list for grid updates
            GRUNT.WaterCooler.listen("grid.updated", function(args) {
                updateAnnotationCoordinates(annotations);
                updateAnnotationCoordinates(staticAnnotations);
            });
            
            return self;
        },
        
        Tiler: function(params) {
            params = GRUNT.extend({
                tapExtent: 10,
                provider: null,
                crosshair: true,
                copyright: undefined,
                zoomLevel: 0,
                boundsChange: null,
                tapPOI: null,
                boundsChangeThreshold: 30,
                pois: new SLICK.Geo.POIStorage(),
                createAnnotationForPOI: null
            }, params);
            
            // if the copyright message is not defined, then use the provider
            if (typeof(params.copyright) === 'undefined') {
                params.copyright = params.provider ? params.provider.getCopyright() : "";
            } // if

            // initialise variables
            var lastBoundsChangeOffset = new SLICK.Vector(),
                copyrightMessage = params.copyright,
                initialized = false,
                tappedPOIs = [],
                lastRequestTime = 0,
                guideOffset = null,
                zoomLevel = params.zoomLevel;

            // if the data provider has not been created, then create a default one
            if (! params.provider) {
                params.provider = new SLICK.Geo.MapProvider();
            } // if

            // if we have a pan handler in the args, then save it as we are going to insert our own
            var caller_pan_handler = params.panHandler,
                caller_tap_handler = params.tapHandler;

            // initialise our own pan handler
            params.onPan = function(x, y) {
                if (caller_pan_handler) {
                    caller_pan_handler(x, y);
                } // if
            }; // 

            // initialise our own tap handler
            params.tapHandler = function(absPos, relPos) {
                var grid = self.getTileLayer();
                var tapBounds = null;

                if (grid) {
                    var gridPos = self.viewPixToGridPix(new SLICK.Vector(relPos.x, relPos.y)),
                        minPos = grid.pixelsToPos(SLICK.V.offset(gridPos, -params.tapExtent, params.tapExtent)),
                        maxPos = grid.pixelsToPos(SLICK.V.offset(gridPos, params.tapExtent, -params.tapExtent));

                    // turn that into a bounds object
                    tapBounds = new SLICK.Geo.BoundingBox(minPos, maxPos);
                    
                    // find the pois in the bounds area
                    tappedPOIs = self.pois.findByBounds(tapBounds);
                    // GRUNT.Log.info("TAPPED POIS = ", tappedPOIs);
                    
                    if (params.tapPOI) {
                        params.tapPOI(tappedPOIs);
                    } // if
                } // if

                if (caller_tap_handler) {
                    caller_tap_handler(absPos, relPos, tapBounds); 
                } // if
            }; // tapHandler

            params.doubleTapHandler = function(absPos, relPos) {
                self.animate(2, self.getDimensions().getCenter(), new SLICK.Vector(relPos.x, relPos.y), SLICK.Animation.Easing.Sine.Out);
            }; // doubleTapHandler

            params.onScale = function(scaleAmount, zoomXY) {
                var zoomChange = 0;

                // damp the scale amount
                scaleAmount = Math.sqrt(scaleAmount);
                
                if (scaleAmount < 1) {
                    zoomChange = -(0.5 / scaleAmount);
                }
                else if (scaleAmount > 1) {
                    zoomChange = scaleAmount;
                } // if..else

                self.gotoPosition(self.getXYPosition(zoomXY), zoomLevel + Math.floor(zoomChange));
            }; // zoomHandler

            // create the base tiler
            var parent = new SLICK.Tiling.Tiler(params);
            
            function getLayerScaling(oldZoom, newZoom) {
                return radsPerPixelAtZoom(1, oldZoom) / radsPerPixelAtZoom(1, newZoom);
            } // getLayerScaling
            
            // initialise self
            var self = GRUNT.extend({}, parent, {
                pois: params.pois,
                
                getBoundingBox: function(buffer_size) {
                    var fnresult = new SLICK.Geo.BoundingBox();
                    var grid = self.getTileLayer();
                    var offset = self.getOffset();
                    var dimensions = self.getDimensions();

                    if (grid) {
                        fnresult = grid.getBoundingBox(offset.x, offset.y, dimensions.width, dimensions.height);
                    } // if

                    return fnresult;
                },

                getCenterPosition: function() {
                    // get the position for the grid position
                    return self.getXYPosition(self.gridDimensions.getCenter());
                },
                
                getXYPosition: function(xy) {
                    return self.getTileLayer().pixelsToPos(self.viewPixToGridPix(xy));
                },
                
                gotoBounds: function(bounds, callback) {
                    // calculate the zoom level required for the specified bounds
                    var zoomLevel = SLICK.Geo.getBoundingBoxZoomLevel(bounds, self.getDimensions());
                    
                    // goto the center position of the bounding box with the calculated zoom level
                    GRUNT.Log.info("BOUNDS CHANGE REQUIRED CENTER: " + bounds.getCenter() + ", ZOOM LEVEL: " + zoomLevel);
                    self.gotoPosition(bounds.getCenter(), zoomLevel, callback);
                },
                
                gotoCurrentPosition: function(callback) {
                    // use the geolocation api to get the current position
                    SLICK.Geo.Location.get({
                        successCallback: function(position, phase, rawPosition) {
                            self.clearBackground();
                            self.gotoPosition(position, 15, callback);
                        },
                        
                        errorCallback: function(error) {
                        }
                    });
                },
                
                gotoPosition: function(position, newZoomLevel, callback) {
                    // save the current zoom level
                    var currentZoomLevel = zoomLevel,
                        zoomScaling = getLayerScaling(zoomLevel, newZoomLevel),
                        requestTime = new Date().getTime();

                    // if a new zoom level is specified, then use it
                    zoomLevel = newZoomLevel ? newZoomLevel : zoomLevel;

                    // if the zoom level is not defined, then raise an exception
                    if (! zoomLevel) {
                        throw "Zoom level required to goto a position.";
                    } // if

                    // check the zoom level is ok
                    if (params.provider) {
                        zoomLevel = params.provider.checkZoomLevel(zoomLevel);
                    } // if
                    
                    // if the zoom level is different from the current zoom level, then update the map tiles
                    if ((! initialized) || (zoomLevel !== currentZoomLevel)) {
                        // remove the grid layer
                        SLICK.Resources.resetImageLoadQueue();

                        // cancel any animations
                        SLICK.Animation.cancel();

                        // if the map is initialise, then pan to the specified position
                        if (initialized) {
                            self.freeze();
                        } // if
                        
                        // update the global request time
                        lastRequestTime = requestTime;

                        // update the provider zoom level
                        params.provider.zoomLevel = zoomLevel;
                        params.provider.getMapTiles(self, position, function(tileGrid) {
                            // if the request time equals the last request time process, otherwise ignore
                            if (requestTime === lastRequestTime) {
                                // update the tile layer to the use the new layer
                                self.setTileLayer(tileGrid);

                                // pan to the correct position
                                self.panToPosition(position, function() {
                                    self.unfreeze();

                                    if (callback) {
                                        callback();
                                    } // if
                                });
                            }
                            else {
                                GRUNT.Log.info("request time mismatch - ignoring update");
                            }
                        });

                        initialized = true;
                    }
                    // otherwise, just pan to the correct position
                    else {
                        GRUNT.Log.info("just panning, tile layer = " + self.getTileLayer() + ", zoom level = " + zoomLevel);
                        self.panToPosition(position, callback);
                        self.unfreeze();
                    } // if..else
                },

                panToPosition: function(position, callback, easingFn) {
                    var grid = self.getTileLayer();
                    if (grid) {
                        // determine the tile offset for the requested position
                        var centerXY = grid.getGridXYForPosition(position),
                            dimensions = self.getDimensions();

                        // determine the actual pan amount, by calculating the center of the viewport
                        centerXY.x -= (dimensions.width >> 1);
                        centerXY.y -= (dimensions.height >> 1);
                        
                        // if we have a guide layer snap to that
                        if (guideOffset) {
                            guideOffset = null;
                        } // if

                        // pan the required amount
                        //GRUNT.Log.info(String.format("need to apply pan vector of ({0}) to correctly center", center_xy));
                        //GRUNT.Log.info("offset before pan = " + self.getOffset());
                        self.updateOffset(centerXY.x, centerXY.y, easingFn);
                        GRUNT.WaterCooler.say("view.wake", { id: self.id });
                        //GRUNT.Log.info("offset after pan = " + self.getOffset());

                        // trigger a bounds change event
                        if (params.boundsChange) {
                            params.boundsChange(self.getBoundingBox());
                        } // if

                        // if we have a callback defined, then run it
                        if (callback) {
                            callback(self);
                        } // if
                    } // if
                },

                setZoomLevel: function(value) {
                    // if the current position is set, then goto the updated position
                    self.gotoPosition(self.getCenterPosition(), value);
                },

                zoomIn: function() {
                    // determine the required scaling
                    var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / radsPerPixelAtZoom(1, zoomLevel + 1);
                    GRUNT.Log.info("scaling needed is " + scalingNeeded);
                    
                    if (! self.scale(2, SLICK.Animation.Easing.Sine.Out)) {
                        self.setZoomLevel(zoomLevel + 1);
                    } // if
                },

                zoomOut: function() {
                    var scalingNeeded = radsPerPixelAtZoom(1, zoomLevel) / radsPerPixelAtZoom(1, zoomLevel - 1);
                    GRUNT.Log.info("scaling needed is " + scalingNeeded);
                    
                    if (! self.scale(0.5, SLICK.Animation.Easing.Sine.Out)) {
                        self.setZoomLevel(zoomLevel - 1);
                    } // if
                },

                /* route methods */
                
                animateRoute: function(easingFn, duration, drawCallback, autoCenter) {
                    // get the routing layer
                    var routeLayer = self.getLayer("route");
                    if (routeLayer) {
                        // create the animation layer from the route
                        var animationLayer = routeLayer.getAnimation(easingFn, duration, drawCallback, autoCenter);
                        
                        // add the animation layer
                        if (animationLayer) {
                            animationLayer.addToView(self);
                        }
                    } // if
                }
            }, parent);

            // create an annotations layer
            var annotations = new SLICK.Mapping.AnnotationsOverlay({
                pois: self.pois,
                map: self,
                createAnnotationForPOI: params.createAnnotationForPOI
            });
            
            // add the annotations layer
            self.setLayer("annotations", annotations);
            
            // add the radar overlay
            // self.setLayer("radar", new SLICK.Mapping.RadarOverlay());
            
            // if we are drawing the cross hair, then add a cross hair overlay
            if (params.crosshair) {
                self.setLayer("crosshair", new SLICK.Mapping.CrosshairOverlay());
            } // if

            // if we have a copyright message, then add the message
            if (copyrightMessage) {
                self.setLayer("copyright", new SLICK.Graphics.ViewLayer({
                    zindex: 999,
                    draw: function(context, offset, dimensions, state, view) {
                        context.lineWidth = 2.5;
                        context.fillStyle = "rgb(50, 50, 50)";
                        context.strokeStyle = "rgba(255, 255, 255, 0.8)";
                        context.font = "bold 10px sans";
                        context.textBaseline = "bottom";
                        context.strokeText(copyrightMessage, 10, dimensions.height - 10);
                        context.fillText(copyrightMessage, 10, dimensions.height - 10);
                    }
                }));
            } // if
            
            // listen for the view idling
            GRUNT.WaterCooler.listen("view-idle", function(args) {
                if (args.id && (args.id == self.id)) {
                    // compare the last bounds change offset with the current offset
                    var changeDelta = SLICK.V.absSize(SLICK.V.diff(lastBoundsChangeOffset, self.getOffset()));
                    
                    if ((changeDelta > params.boundsChangeThreshold) && params.boundsChange) {
                        lastBoundsChangeOffset = self.getOffset();
                        params.boundsChange(self.getBoundingBox());
                    } // if
                }
            });
            
            return self;
        }
    };
    
    return module;
})();

/**
@module

Define functionality to enable routing for mapping
*/
SLICK.Geo.Routing = (function() {
    
    // define the module
    var module = {
        /* module functions */
        
        calculate: function(args) {
            args = GRUNT.extend({
                engineId: "",
                waypoints: [],
                map: null,
                error: null,
                autoFit: true,
                success: null
            }, args);
            
            GRUNT.Log.info("attempting to calculate route");
            
            // find an available routing engine
            var engine = SLICK.Geo.getEngine("route");
            if (engine) {
                engine.route(args, function(routeData) {
                    // firstly, if we have a map defined, then let's place the route on the map
                    // you know, just because we are nice like that
                    if (args.map) {
                        module.createMapOverlay(args.map, routeData);
                        
                        // if we are to auto fit the map to the bounds, then do that now
                        if (args.autoFit) {
                            GRUNT.Log.info("AUTOFITTING MAP TO ROUTE: bounds = " + routeData.boundingBox);
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
        
        createMapOverlay: function(map, routeData) {
            // get the map dimensions
            var dimensions = map.getDimensions();

            // GRUNT.Log.info("creating route overlay with route data: ", routeData);

            // create a new route overlay for the specified data
            var overlay = new SLICK.Mapping.RouteOverlay({
                data: routeData,
                width: dimensions.width,
                height: dimensions.height
            });

            // add the overlay to the map
            map.setLayer("route", overlay);
        },
        
        Maneuver: {
            None: 0,
            
            // continue maneuver
            Continue: 1,
            
            // turn left maneuvers
            TurnLeft: 100,
            TurnLeftSlight: 101,
            TurnLeftSharp: 102,
            
            // turn right maneuvers
            TurnRight: 110,
            TurnRightSlight: 111,
            TurnRightSharp: 112,
            
            // uturn
            TurnAround: 190,
            
            // enter roundabout maneuver
            EnterRoundabout: 200,
            
            // exit ramp
            ExitRamp: 300
        },
        
        Instruction: function(params) {
            params = GRUNT.extend({
                position: null,
                description: "",
                manuever: module.Maneuver.None
            }, params);
            
            // initialise self
            var self = GRUNT.extend(params, {
                
            });
            
            return self;
        },
        
        RouteData: function(params) {
            params = GRUNT.extend({
                geometry: [],
                instructions: [],
                boundingBox: null
            }, params);
            
            // update the bounding box
            if (! params.boundingBox) {
                params.boundingBox = SLICK.Geo.getBoundsForPositions(params.geometry);
            } // if
            
            return params;
        }
    };
    
    return module;
})();