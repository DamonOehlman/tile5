SLICK.UI.Navigation = (function() {
    // initialise the module
    var module = {
        createActionBar: function(params) {
            return new module.ActionBar(params);
        },
        
        ActionBar: function(params) {
            // initialise default parameters
            params = jQuery.extend({
                selector: "ul.actionbar"
            }, params);
            
            // initialise self
            var self = {
                loadActions: function(actions) {
                    // if the actions aren't specified, get the registered actions from the dispatcher
                    if (! actions) {
                        actions = SLICK.Dispatcher.getRegisteredActions();
                    } // if
                    
                    jQuery(params.selector).each(function() {
                        jQuery(this).html('');
                        
                        for (var ii = 0; ii < actions.length; ii++) {
                            // FIXME: remove the absolute path currently used for testing
                            jQuery(this).append(String.format("<li><img src='/media/images/racq/{0}' alt='{1}' /></li>", actions[ii].getParam("icon"), actions[ii].getParam("title")));
                        } // for
                    });
                }
            };
            
            return self;
        }
    };
    
    return module;
})();