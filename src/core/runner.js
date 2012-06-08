/**
# T5.Runner
*/
var Runner = (function() {
    
    /* internals */
    
    var TARGET_CYCLETIME = 20,
        DEFAULT_SLICESIZE = 50,
        processes = [];
        
    function runLoop() {
        var processCount = processes.length;
        
        // iterate through the processes and run each of them
        for (var ii = processCount; ii--; ) {
            try {
                processes[ii](processCount);
            }
            catch (e) {
                cog.log(e.toString(), 'error');
            } // try..catch
        } // for
    } // runLoop
    
    /* exports */
    
    /**
    ### process(items, sliceCallback, completeCallback, syncParseThreshold)
    */
    function process(items, sliceCallback, completeCallback, syncParseThreshold) {
        var itemsPerCycle,
            itemIndex = 0;
        
        function processSlice(processesActive) {
            var currentSliceItems = (itemsPerCycle || DEFAULT_SLICESIZE) / processesActive;
            
            if (itemIndex < items.length) {
                var slice = items.slice(itemIndex, itemIndex + currentSliceItems),
                    sliceLen = slice.length,
                    startTicks = itemsPerCycle ? 0 : new Date().getTime();

                // fire teh callback
                sliceCallback(slice, sliceLen);

                // if the items per cycle is not defined, then make a calculation 
                // based on the sample
                if (! itemsPerCycle) {
                    var elapsed = new Date().getTime() - startTicks,
                        itemProcessTime = elapsed / sliceLen;

                    itemsPerCycle = itemProcessTime ? (TARGET_CYCLETIME / itemProcessTime | 0) : items.length;
                    // cog.log('calculated that we can process ' + itemsPerCycle + ' items per cycle');
                } // if

                // increment the item index
                itemIndex += sliceLen;                
            }
            else {
                // remove the process slice function from the processes array
                for (var ii = processes.length; ii--; ) {
                    if (processes[ii] === processSlice) {
                        processes.splice(ii, 1);
                        break;
                    } // if
                } // for
                
                // if we have no more processes, then detach the runloop
                if (processes.length === 0) {
                    Animator.detach(runLoop);
                } // if
                
                // if we have a complete callback, then trigger it
                if (completeCallback) {
                    completeCallback();
                } // if
                
            } // if..else
        } // processSlice

        // if we are running in the browser and we have enough items
        // to parse, then run in the animation process.
        if (DOM && items.length > (syncParseThreshold || 0)) {
            if (processes.push(processSlice) === 1) {
                Animator.attach(runLoop);
            } // if
        }
        // otherwise run the chunk immediately
        else {
            // trigger the slice callback for the entire list
            sliceCallback(items, items.length);
            
            if (completeCallback) {
                completeCallback();
            } // if
        }
        
    } // process
    
    return {
        process: process
    };
})();