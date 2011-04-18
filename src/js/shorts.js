// define some constants
var TWO_PI = Math.PI * 2,
    HALF_PI = Math.PI / 2,
    PROP_WK_TRANSFORM = '-webkit-transform';

// some math functions     
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
    
    // some other function shorts
    // most straight from Raphael: https://github.com/DmitryBaranovskiy/raphael
    proto = 'prototype',
    has = 'hasOwnProperty',
    isnan = {'NaN': 1, 'Infinity': 1, '-Infinity': 1},
    lowerCase = String[proto].toLowerCase,
    objectToString = Object[proto].toString,
    
    // some type references
    typeUndefined = 'undefined',
    typeFunction = 'function',
    typeString = 'string',
    typeObject = 'object',
    typeNumber = 'number',
    typeArray = 'array',
    
    supportTransforms = typeof document.body.style[PROP_WK_TRANSFORM] != 'undefined',
    
    reDelimitedSplit = /[\,\s]/;