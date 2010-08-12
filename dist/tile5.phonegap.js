TILE5.PhoneGap = (function() {
    
    function createTabItem(action) {
        window.uicontrols.createTabBarItem(action.id, action.getParam("title"), action.getParam("icon"), {
          onSelect: function() {
              TILE5.Dispatcher.execute(action.id);
          }
        });
    } // createTabItem
    
    var module = null;
    
    // if phonegap is available then initialise
    if (typeof(PhoneGap) !== 'undefined') {
        // ATTACH a logging listener to send logging messages back to base
        GRUNT.Log.requestUpdates(function(message, level) {
            PhoneGap.exec("DebugConsole.log", message);
        });
        
        // initialise module
        module = {
            makeActionBar: function(actions) {
                try {
                    // if the actions aren't specified, get the registered actions from the dispatcher
                    if (! actions) {
                        actions = TILE5.Dispatcher.getRegisteredActions();
                    } // if
                    
                    GRUNT.Log.info("attempting to create action bar: window controls = " + module.uicontrols);

                    // uicontrols only exist on iPhone :/
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
        if (typeof TILE5.Native !== 'undefined') {
            TILE5.Native.registerPlatformModule("phonegap", module);
        } // if
    } // if
    
    return module;
})();