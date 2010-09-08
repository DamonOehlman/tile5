T5.Dispatcher = (function() {
    // initialise variables
    var registeredActions = [];
    
    // initialise the module
    var module = {
        
        /* actions */
        
        execute: function(actionId) {
            // find the requested action
            var action = module.findAction(actionId);
            
            GRUNT.Log.info("looking for action id: " + actionId + ", found: " + action);
            
            // if we found the action then execute it
            if (action) {
                // get the trailing arguments from the call
                var actionArgs = [].concat(arguments).slice(0, 1);
                
                GRUNT.Log.watch("EXECUTING ACTION: " + actionId, function() {
                    action.execute(actionArgs);
                });
            } // if
        },
        
        findAction: function(actionId) {
            for (var ii = registeredActions.length; ii--; ) {
                if (registeredActions[ii].id == actionId) {
                    return registeredActions[ii];
                } // if
            } // for
            
            return null;
        },
        
        getRegisteredActions: function() {
            return [].concat(registeredActions);
        },
        
        getRegisteredActionIds: function() {
            var actionIds = [];
            
            // get the action ids
            for (var ii = registeredActions.length; ii--; ) {
                registeredActions[ii].id ? actionIds.push(registeredActions[ii].id) : null;
            } // for
            
            return actionIds;
        },
        
        registerAction: function(action) {
            if (action && action.id) {
                registeredActions.push(action);
            } // if
        },
        
        Action: function(params) {
            // use default parameter when insufficient are provided
            params = T5.ex({
                autoRegister: true,
                id: '',
                title: '',
                icon: '',
                execute: null
            }, params);
            
            // initialise self
            var self = {
                id: params.id,
                
                execute: function() {
                    if (params.execute) {
                        params.execute.apply(this, arguments);
                    } // if
                },
                
                getParam: function(paramId) {
                    return params[paramId] ? params[paramId] : "";
                },
                
                toString: function() {
                    return String.format("{0} [title = {1}, icon = {2}]", self.id, params.title, params.icon);
                }
            };
            
            // if the action has been set to auto register, then add it to the registry
            if (params.autoRegister) {
                module.registerAction(self);
            } // if
            
            return self;
        },
        
        /* agents */
        
        Agent: function(params) {
            params = GRUNT.extend({
                name: "Untitled",
                translator: null,
                execute: null
            }, params);
            
            // define the wrapper for the agent
            var self = {
                getName: function() {
                    return params.name;
                },
                
                getParam: function(key) {
                    return params[key];
                },
                
                getId: function() {
                    return GRUNT.toID(self.getName());
                },
                
                run: function(args, callback) {
                    if (params.execute) {
                        // save the run instance ticks to a local variable so we can check it in the callback
                        // SEARCH ARGS changed
                        var searchArgs = params.translator ? params.translator(args) : args;
                        
                        // execute the agent
                        params.execute.call(self, searchArgs, function(data, agentParams) {
                            if (callback) {
                                callback(data, agentParams, searchArgs);
                            } // if
                        });
                    } // if
                } // run
            };
            
            return self;
        },
        
        runAgents: function(agents, args, callback) {
            // iterate through the agents and run them
            for (var ii = 0; ii < agents.length; ii++) {
                agents[ii].run(args, callback);
            } // for
        }
    };
    
    return module;
})();

