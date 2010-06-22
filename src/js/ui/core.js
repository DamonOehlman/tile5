SLICK.UI = (function() {
    var dialogs = [];
    
    // initialise the module
    var module = {
        requires: ["Resources"],
        
        closeDialogs: function() {
            // iterate through the dialogs, and close them
            for (var ii = 0; ii < dialogs.length; ii++) {
                dialogs[ii].close();
            } // for
            
            // reset the dialogs array
            dialogs = [];
        },
        
        createDialog: function(params) {
            // create the dialog
            var dialog = new module.Dialog(params);
            
            // add the dialog to the list of dialogs
            dialogs.push(dialog);
            
            // return the dialog
            return dialog;
        },
        
        getDialog: function(dialogId) {
            // iterate through the dialogs and locate the requested id
            for (var ii = 0; ii < dialogs.length; ii++) {
                if (dialogs[ii].id == dialogId) {
                    return dialogs[ii];
                } // if
            } // for
            
            return null;
        },
        
        hideDialogs: function() {
            for (var ii = 0; ii < dialogs.length; ii++) {
                dialogs[ii].hide();
            } // for
        },
        
        displayForm: function(formId, submitCallback) {
            // initialise the dialog id
            var dialogId = "form_" + formId;
            
            // get the dialog
            var dialog = module.getDialog(dialogId);
            
            // if we haven't created the dialog already, then create it
            if (! dialog) {
                dialog = module.createDialog({
                    id: "form_" + formId
                });
                
                GRUNT.Log.info("created dialog: " + dialog.id);

                // load the form defnition
                SLICK.Resources.loadResource({
                    filename: "forms/" + formId + ".json",
                    dataType: "json",
                    callback: function(formData) {
                        // create the form
                        var form = SLICK.UI.Forms.createForm(formData, submitCallback);
                        
                        // attach the form to the dialog
                        form.attachToDialog(dialog);
                    }
                });
            } // if
            
            // hide all dialogs apart from this one
            for (var ii = 0; ii < dialogs.length; ii++) {
                if (dialogs[ii] !== dialog) {
                    dialogs[ii].hide();
                } // if
            } // for
            
            // show the current dialog
            dialog.show();
        },
        
        Dialog: function(params) {
            // initialise parameter values
            params = GRUNT.extend({
                id: "dialog_" + (new Date().getTime()),
                title: "",
                snippet: null
            }, params);

            // create the dialog and display it
            jQuery("#dialog-container").prepend(String.format("<div id='{0}' class='dialog'><h3>{1}</h3><div class='dialogcontent'></div></div>", params.id, params.title));
            
            // initialise self
            var self = {
                id: params.id, 
                
                close: function() {
                    // find the dialog and remove it from the dom
                    self.get().remove();
                },
                
                get: function() {
                    return jQuery("#" + self.id);
                },
                
                hide: function() {
                    self.get().hide();
                },
                
                updateContent: function(newContent) {
                    jQuery("#" + self.id + " .dialogcontent").html(newContent);
                },
                
                show: function() {
                    self.get().show();
                },
                
                setTitle: function(value) {
                    params.title = value;
                    
                    self.get().find("h3").text(params.title);
                }
            };
            
            // if a snippet has been specified for the dialog, then get the content
            if (params.snippet) {
                SLICK.Resources.loadSnippet(params.snippet, function(data) {
                    self.updateContent(data);
                });
            } // if
            
            return self;
        }
    };
    
    return module;
})();

