SLICK.PhoneGap = (function() {
    
    function createTabItem(action) {
        window.uicontrols.createTabBarItem(action.id, action.getParam("title"), action.getParam("icon"), {
          onSelect: function() {
              SLICK.Dispatcher.execute(action.id);
          }
        });
    } // createTabItem
    
    // initialise module
    var module = {
        makeActionBar: function(actions) {
            // if the actions aren't specified, get the registered actions from the dispatcher
            if (! actions) {
                actions = SLICK.Dispatcher.getRegisteredActions();
            } // if
            
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
    };
    
    // register the module with the native modules
    if (typeof SLICK.Native !== 'undefined') {
        SLICK.Native.registerPlatformModule("phonegap", module);
    } // if
    
    return module;
})();