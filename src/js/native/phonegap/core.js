SLICK.PhoneGap = (function() {
    
    function createTabItem(action) {
        window.uicontrols.createTabBarItem(action.id, action.getParam("title"), action.getParam("icon"), {
          onSelect: function() {
              SLICK.Dispatcher.execute(action.id);
          }
        });
    } // createTabItem
    
    // ATTACH a logging listener to send logging messages back to base
    GRUNT.Log.requestUpdates(function(message, level) {
        PhoneGap.exec("DebugConsole.log", message);
    });
    
    // initialise module
    var module = {
        makeActionBar: function(actions) {
            try {
                // if the actions aren't specified, get the registered actions from the dispatcher
                if (! actions) {
                    actions = SLICK.Dispatcher.getRegisteredActions();
                } // if
                
                // window.uicontrols.createToolBar();
                // window.uicontrols.setToolBarTitle("RACQ Trip Planner");
            
                window.uicontrols.createTabBar();
            
                // get the application modes
                var activeTabs = ["UIControls.showTabBarItems"];
                for (var ii = 0; ii < actions.length; ii++) {
                    createTabItem(actions[ii]);
                    activeTabs.push(actions[ii].id);
                } // for

                // show the tab bar
                window.uicontrols.showTabBar();
                PhoneGap.exec.apply(this, activeTabs);
            }
            catch (e) {
                GRUNT.Log.exception(e);
            }
        }
    };
    
    // register the module with the native modules
    if (typeof SLICK.Native !== 'undefined') {
        SLICK.Native.registerPlatformModule("phonegap", module);
    } // if
    
    return module;
})();