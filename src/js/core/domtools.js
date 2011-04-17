function createEl(elemType, id, css) {
    // create the element
    var elem = document.createElement(elemType);
    
    // set the id and css text
    elem.id = id;
    elem.style.cssText = css || '';
    
    // return the new element
    return elem;
} // createEl

function moveEl(element, x, y) {
    // move the container
    if (supportTransforms) {
        element.style[PROP_WK_TRANSFORM] = 'translate3d(' + x +'px, ' + y + 'px, 0px)';
    }
    else {
        element.style.left = x + 'px';
        element.style.top = y + 'px';
    } // if..else
} // moveEl