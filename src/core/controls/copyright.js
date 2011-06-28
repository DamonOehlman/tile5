/**
# CONTROL: Zoombar
*/
reg('control', 'copyright', function(view, panFrame, container, params) {
    params = _extend({
        align: 'right',
        text: 'Some test copyright message',
        spacing: 0
    }, params);
    
    /* internals */
    
    var copydiv;
    
    function createCopyright() {
        copydiv = DOM.create('div', 't5-copyright', {
            position: 'absolute',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'z-index': 49
        });
        
        // add the zoom bar
        if (container.childNodes[0]) {
            container.insertBefore(copydiv, container.childNodes[0]);
        }
        else {
            container.appendChild(copydiv);
        } // if..else
        
        // if we have text, then update it
        if (params.text) {
            setText(params.text);
        } // if
    } // createImageContainer    
    
    function getMargin() {
        var padding = view.viewport().padding,
            containerRect = DOM.rect(container),
            marginLeft = params.spacing,
            marginTop = containerRect.h - copydiv.offsetHeight - params.spacing,
            formatter = _formatter('{0}px 0 0 {1}px');

        if (params.align === 'right') {
            marginLeft = containerRect.w - copydiv.offsetWidth - params.spacing;
        } // if
        
        return formatter(marginTop, marginLeft);
    } // getMargin
    
    function handleDetach() {
        // remove the image div from the panFrame
        if (copydiv) {
            container.removeChild(copydiv);
        } // if
    } // handleDetach
    
    function setText(text) {
        if (copydiv) {
            copydiv.innerHTML = text;
            copydiv.style.margin = getMargin();
        } // if
    } // setText
    
    /* exports */
    
    /* initialization */
    
    createCopyright();
    
    var _this = new Control(view);
    
    // handle the predraw
    _this.bind('detach', handleDetach);
    
    return _this;
});