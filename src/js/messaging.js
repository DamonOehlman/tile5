/**
@namespace 

The concept behind TILE5 messaging, is to enable client-side javascript to send messages and have
those messages be handled in some way.  In some cases, a message being handled will involve moving
to another part of the application (which is handled by the native bridge in a mobile application)
or potentially a message could actually have some action taken on the server side, message data 
updated and then the creating context could be notified of the change.  Currently, the messaging
section of TILE5 is evolving, and is likely to change over time as the requirements of this module
become clear.
*/
TILE5.Messaging = (function() {
    var handlers = [];
    var messageQueue = [];
    
    function getMessage(index) {
        return (index >= 0) && (index < messageQueue.length) ? messageQueue[index] : null;
    }
    
    function fireMessageUpdate(index, updateSource) {
        // get the message instance
        var message = getMessage(index);
        GRUNT.Log.info("firing message update, index = " + index + ", message = " + message);
        
        // iterate through the handlers, and allow them to action the message
        var ii = 0;
        while (message && (ii < handlers.length) && (message.status !== module.STATUS.handled)) {
            // TODO: check that the current handler is not the update source
            
            var statusChange = handlers[ii].processUpdate(messageQueue[index]);
            if (statusChange) {
                updateMessageStatus(index, statusChange, handlers[ii].getId());
            } // if
            
            ii++;
        } // while
    } // fireMessageUpdate
    
    function updateMessageStatus(index, newStatus, updateSource) {
        var message = getMessage(index);
        
        if (message) {
            // update the message status
            message.status = newStatus;
            
            // if the message has an status changed event handler, then trigger that now
            if (message.statusChange) {
                message.statusChange(message);
            } // if
        } // if
    } // updateMessageStatus
    
    var module = GRUNT.newModule({
        id: "TILE5.messaging",
        requires: ["TILE5.core"],

        // message status updates
        STATUS: {
            none: 0,
            created: 1,
            updated: 2,
            handled: 3
        },
        
        /**
        The send function is used to push a new message onto the message queue.  Registered
        message listeners will be passed the message details and will have the opportunity
        to respond to the message, if they have handled the message they can update the message
        status and add message log entries.  
        
        @param {Hash} params a hashed array containing message details
        */
        send: function(params) {
            params = GRUNT.extend({
                type: "",
                payload: {},
                index: 0,
                status: module.STATUS.created,
                statusChange: null
            }, params);
            
            // add the message to the message queue
            params.index = messageQueue.push(params) - 1;
            
            // trigger a message update
            fireMessageUpdate(params.index);
        },
        
        Handler: function(params) {
            params = GRUNT.extend({
                id: "",
                processUpdate: null
            }, params);
            
            // define self
            var self = {
                getId: function() {
                    return params.id;
                },
                
                processUpdate: function(message) {
                    if (params.processUpdate) {
                        return params.processUpdate(message);
                    } // if
                    
                    return module.STATUS.none;
                }
            };
            
            // add the handler to the list of handlers
            handlers.push(self);
            
            return self;
        }
    });
    
    return module;
})();

