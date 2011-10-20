var DEMORUNNER = (function() {
    
    var codeRunners = {},
        targetWindow = window.parent || window;
    
    codeRunners.javascript = function(code) {
        // remove any demo code scripts
        $('#demoCode').remove();
        
        // add a new demo code script
        var demoCode = document.createElement('script');
        demoCode.id = 'demoCode';
        demoCode.innerHTML = code;
        $('body').append(demoCode);
    };
    
    codeRunners.htmlmixed = function(code) {
        var header = $('header'),
            shadowClasses = settings.emulatorShadows ? 'drop-shadow lifted ' : '',
            frameHtml = '<div id="demoFrame">' + 
                '<div class="emulator ' + shadowClasses + (settings.emulator || 'desktop') + '">' + 
                '<iframe scrolling="no" />' + 
                '</div>' + 
                '</div>';
                
        // find the demo app frame
        $('#demoFrame').remove();

        // add the frame
        if (header.length > 0) {
            $(header).after(frameHtml);
        }
        else {
            $('body').prepend(frameHtml);
        } // if
        
        // create a new iframe element and get the document
        var codeFrame = $('#demoFrame iframe')[0],
            doc = codeFrame.document || codeFrame.contentDocument || codeFrame.contentWindow.document;
            
        // write the code to the iframe
        doc.open();
        doc.writeln(code);
        doc.close();
    }; // html
    
    /* internals */
    
    function init() {
    } // bindKeys
    
    function mapMessageToEve(evt) {
        if (evt.data && evt.data.name) {
            eve.apply(null, [evt.data.name].concat(null, evt.data.args, 'remote'));
        } // if
    } // mapMessageToEve
    
    function demoRun() {
        var runner = codeRunners[settings.mode || 'javascript'];

        if (runner) {
            runner.call(null, editor.getValue());
        } // if
    } // demoRun
    
    function demoStop() {
        $('#demoFrame').remove();
        $('#demoCode').remove();
    } // killDemos
    
    // listen for messages
    window.addEventListener('message', mapMessageToEve, false);
    
    // bind some eve handlers
    eve.on('run', demoRun);
    eve.on('escape', demoStop);
    
    /*
    TODO: fix this
    if (window.parent) {
        eve.on('*', function() {
            // get the last arg value
            var lastArg = arguments[arguments.length - 1];
            if (lastArg !== 'remote') {
                window.parent.postMessage(JSON.stringify({
                    name: eve.nt(),
                    args: Array.prototype.slice.call(arguments, 0)
                }), '*');
            } // if
        });
    } // if
    */
    
    $(init);
})();

