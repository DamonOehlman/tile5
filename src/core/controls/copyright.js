reg('control', 'copyright', function(view, panFrame, container, params) {
    params = cog.extend({
        align: 'right',
        text: null,
        spacing: 5
    }, params);

    /* internals */

    var copydiv;

    function createCopyright() {
        var containerRect = DOM.rect(container),
            text = params.text || view.getCopy(),
            maxWidth = Math.max(
                containerRect.w >> 1, 
                Math.min(400, containerRect.w - params.spacing * 2)
            );
        
        copydiv = DOM.create('div', 't5-copyright', {
            position: 'absolute',
            overflow: 'hidden',
            'max-width': maxWidth + 'px',
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
        if (text) {
            setText(text);
        } // if
    } // createImageContainer    

    function getMargin() {
        var padding = view.viewport().padding,
            containerRect = DOM.rect(container),
            marginLeft = params.spacing,
            marginTop = containerRect.h - copydiv.offsetHeight - params.spacing,
            format = formatter('{{0}}px 0 0 {{1}}px');

        if (params.align === 'right') {
            marginLeft = containerRect.w - copydiv.offsetWidth - params.spacing;
        } // if

        return format(marginTop, marginLeft);
    } // getMargin
    
    function handleCopyright(evt, copyright) {
        setText(view.getCopy());
    } // handleCopyrightUpdate

    function handleDetach() {
        // remove the image div from the panFrame
        if (copydiv) {
            container.removeChild(copydiv);
        } // if
    } // handleDetach

    /* exports */

    function getText() {
        return copydiv ? copydiv.innerHTML : '';
    } // getText

    function setText(text) {
        if (copydiv) {
            copydiv.innerHTML = text;
            copydiv.style.margin = getMargin();
        } // if
    } // setText

    /* initialization */

    createCopyright();

    var _this = cog.extend(new Control(view), {
        getText: getText,
        setText: setText
    });

    // handle the predraw
    _this.bind('detach', handleDetach);
    
    // if we don't have custom text respond to view copyright changes
    if (! params.text) {
        view.bind('copyright', handleCopyright);
    } // if

    return _this;
});