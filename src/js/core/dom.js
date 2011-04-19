var DOM = (function() {
    /* internals */
    
    var CORE_STYLES = {
            '-webkit-user-select': 'none',
            position: 'absolute',
            overflow: 'hidden'
        },
        testTransformProps = ['-webkit-transform', '-moz-transform', '-o-transform'],
        supportTransforms = false,
        transformProp;
        
    function checkCaps() {
        for (var ii = 0; ii < testTransformProps.length; ii++) {
            transformProp = testTransformProps[ii];
            if (typeof document.body.style[transformProp] != 'undefined') {
                supportTransforms = true;
                break;
            } // if
        } // for
    } // checkCaps

    /* exports */
    
    function create(elemType, id, className, cssProps) {
        // create the element
        var elem = document.createElement(elemType),
            cssRules = [],
            props = cssProps || {};

        // set the id and css text
        elem.id = id;
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
        // move the container
        if (supportTransforms) {
            element.style[transformProp] = 'translate3d(' + x +'px, ' + y + 'px, 0px) ' + (extraTransforms || '');
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
    
    checkCaps();
    
    return {
        supportTransforms: supportTransforms,
        
        create: create,
        move: move,
        styles: styles
    };
})();
