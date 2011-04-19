var DOM = (function() {
    /* internals */
    
    var CORE_STYLES = {
            '-webkit-user-select': 'none',
            position: 'absolute',
            overflow: 'hidden'
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
        if (css3dTransformProp || transformProp) {
            var translate = css3dTransformProp ? 
                    'translate3d(' + x +'px, ' + y + 'px, 0px)' : 
                    'translate(' + x + 'px, ' + y + 'px)';
            
            element.style[transformProp] = translate + ' ' + (extraTransforms || '');
        }
        else {
            element.style.left = x + 'px';
            element.style.top = y + 'px';
        } // if..else
    } // move
    
    function styles(extraStyles) {
        return COG.extend({}, CORE_STYLES, extraStyles);
    } // extraStyles

    /* initialization */
    
    transformProp = checkCaps(testTransformProps);
    css3DTransformProps = checkCaps(css3dTransformProps);
    
    return {
        supportTransforms: transformProp,
        
        create: create,
        move: move,
        styles: styles
    };
})();
