SLICK.jQTouch = (function() {
    // define the module
    var module = {
        createOptionPage: function(params) {
            params = GRUNT.extend({
                pageId: "new-option-page",
                pageTarget: document.body,
                pageTemplate: "<div id='options-{0}'><div class='toolbar'><a class='back'>Back</a></div><ul class='optionlist edit rounded'>{1}</ul></div>",
                options: []
            });
            
            // if the option page already exists, then recreate it
            jQuery("#options-" + params.pageId).remove();
            
            // define the page data
            var pageContent = "";

            // iterate through the option data
            for (var ii = 0; ii < params.options.length; ii++) {
                var optionData = params.options[ii];
                
                pageContent += 
                    "<li><input type='checkbox' " + 
                    (optionData.label ? "title='" + optionData.label + "' " : "") +
                    "value='" + (optionData.value ? optionData.value : ii) + "' " +
                    "</input></li>";
            } // for
            
            // create the page
            jQuery(params.pageTarget).append(String.format(params.pageTemplate, params.pageId, pageContent));
        },
        
        loadOptionPage: function(params) {
            params = GRUNT.extend({
                pageId: "new-option-page",
                options: [],
                optionDataSource: null
            }, params);

            // if the option page data source is defined, then load the specified resource
            if (params.optionDataSource) {
                SLICK.Resources.loadResource({
                    filename: params.optionDataSource,
                    callback: function(data) {
                        // extend the option data with the data that has been returned
                        params.options = data;
                        
                        // create the page
                        module.createOptionPage(params);
                    }
                });
            }
            // otherwise load the data straight
            else {
                module.createOptionPage(params);
            }
        }
    };
    
    return module;
})();