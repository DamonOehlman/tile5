var DOM = (function() {
    /* internals */
    
    var CORE_STYLES = {
            '-webkit-user-select': 'none',
            position: 'absolute',
            overflow: 'hidden'
        },
        testTransformProps = ['-webkit-transform', 'MozTransform'],
        transformProp;
        
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

    function move(element, x, y, extraTransforms) {
        if (transformProp) {
            element.style[transformProp] = 'translate(' + x + 'px, ' + y + 'px) translateZ(0) ' + 
                (extraTransforms || []).join(' ');
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
    
    return {
        supportTransforms: transformProp,
        
        create: create,
        move: move,
        styles: styles
    };
})();
