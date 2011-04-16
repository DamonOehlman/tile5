function createEl(elemType, id, css) {
    // create the element
    var elem = document.createElement(elemType);
    
    // set the id and css text
    elem.id = id;
    elem.style.cssText = css || '';
    
    // return the new element
    return elem;
} // createEl