// define some constants
var TWO_PI = Math.PI * 2,
    HALF_PI = Math.PI / 2;

// some math functions     
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
    
    reDelimitedSplit = /[\,\s]/,
    
    // some detection variables
    isExplorerCanvas = typeof G_vmlCanvasManager != typeUndefined,
    isFlashCanvas = typeof FlashCanvas != typeUndefined;