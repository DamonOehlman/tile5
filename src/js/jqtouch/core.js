SLICK.jQTouch = (function() {
    // define the option page template (TODO: move to a template file)
    var OPTIONPAGE_TEMPLATE = 
        "<div id='options-{0}'><div class='toolbar'><a class='back'>Back</a></div>" + 
        "<ul class='rounded'><li><a class='any' href='#'>Any (Uncheck All)</a></li></ul>" +
        "<ul class='optionlist edit rounded'>{1}</ul>" + 
        "</div>";
        
    // define the module
    var module = {
        createOptionPage: function(params) {
            params = GRUNT.extend({
                pageId: "new-option-page",
                pageTarget: document.body,
                pageTemplate: OPTIONPAGE_TEMPLATE,
                options: [],
                exitCallback: null
            }, params);
            
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
                    ">" + (optionData.image ? "<img src='" + optionData.image + "' />" : "") + 
                    "</input></li>";
            } // for
            
            // create the page
            jQuery(params.pageTarget)
                .append(String.format(params.pageTemplate, params.pageId, pageContent))
                .bind("pageAnimationStart", function(evt, info) {
                    if (info.direction == 'out') {
                        var values = [];
                        
                        // iterate through the checkboxes and determine the values
                        jQuery("#options-" + params.pageId + " :checked").each(function() {
                            values.push(this.value);
                        });
                        
                        // look for the values holder, and update the values
                        jQuery("#values-" + params.pageId).val(values.join(","));
                    } // if
                })
                .find(".any").click(function() {
                    jQuery("#options-" + params.pageId + " :checked").each(function() {
                        this.checked = false;
                    }); // if
                });
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
        },
        
        optionize: function(params) {
            params = GRUNT.extend({
                jqt: null,
                selector: "",
                optionDataSource: null
            }, params);
            
            if (! params.jqt) {
                throw new Error("Need a jQTouch instance to operate correctly");
            }
            
    		// iterate through the advanced search fields and look for options class, as we are going to need 
    		// to load those resources
    		$(params.selector + " .options").each(function() {
    		    $(this).click(function() {
    		        params.jqt.goTo("#options-" + this.id, "slide");
    		    });
    		    
    		    // load the required option page
    		    SLICK.jQTouch.loadOptionPage({
    		        pageId: this.id,
    		        optionDataSource: String.format(params.optionDataSource, this.id)
    		    });
    		});
            
        }
    };
    
    return module;
})();