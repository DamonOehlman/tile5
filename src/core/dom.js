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
        
    // detect for style based capabilities
    // code adapted from Modernizr: https://github.com/Modernizr/Modernizr
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
        // create the element
        var elem = document.createElement(elemType),
            cssRules = [],
            props = cssProps || {};

        // set the id and css text
        elem.className = className || '';
        
        // initialise the css props
        for (var propId in props) {
            cssRules[cssRules.length] = propId + ': ' + props[propId];
        } // for
        
        // update the css text
        elem.style.cssText = cssRules.join(';');

        // return the new element
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
        return cog.extend({}, CORE_STYLES, extraStyles);
    } // extraStyles

    /* initialization */
    
    transformProp = checkCaps(testTransformProps);
    css3DTransformProp = checkCaps(css3dTransformProps);
    transformOriginProp = checkCaps(testTransformOriginProps);
    
    return {
        transforms: sniff(transformProp) === 'string',
        
        create: create,
        move: move,
        rect: rect,
        styles: styles
    };
})() : null;
