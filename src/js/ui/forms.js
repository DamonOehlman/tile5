SLICK.UI.Forms = (function() {
    var module = {
        requires: "Resources",
        
        createForm: function(params, submitCallback) {
            params = jQuery.extend({
                submitHandler: submitCallback
            }, params);
            
            return new SLICK.UI.Forms.Form(params);
        },
        
        Form: function(params) {
            params= jQuery.extend({
                title: "",
                fields: [],
                snippet: null,
                submitHandler: null
            }, params);
            
            // initialise variables
            var activeField = null;
            var attachedDialog = null;
            var blurTimeout = 0;
            var content = "";
            
            function attachListeners(formElement) {
                jQuery(formElement)
                    .blur(function() {
                        activeField = null;
                        
                        // now if a field doesn't get focus very soon, then check the scroll
                        blurTimeout = setTimeout(function() {
                            // TODO: add some parameters on this to determine how it works
                            if (jQuery(document).scrollTop() > 0) {
                                SLICK.Logger.info("heading back to top, no field focused");
                                jQuery(document).scrollTop(0);
                            } // if
                        }, 100);
                    })
                    .focus(function() {
                        activeField = this;
                        clearTimeout(blurTimeout);
                    })
                    .keypress(function(evt) {
                    });
            } // attachListeners
            
            function getFormContent(callback) {
                if ((params.fields.length === 0) && params.snippet) {
                    SLICK.Resources.loadSnippet(params.snippet, function(data) {
                        if (callback) {
                            callback("<form>" + data + "</form>");
                        } // if
                    });
                } // if
            } // getFormContent
            
            function updateDialogContent() {
                if (attachedDialog && content) {
                    SLICK.Logger.info("updating form content: dialog = " + attachedDialog +", content = " + content);
                    SLICK.errorWatch("UPDATING DIALOG CONTENT", function() {
                        // set the title of the dialog
                        attachedDialog.setTitle(params.title);

                        // update the dialog content
                        attachedDialog.updateContent(content);
                        
                        // get the dialog, and attach the required handlers
                        attachedDialog.get().find(":input").each(function() {
                            attachListeners(this);
                        });
                    });
                    
                    attachedDialog.get().find("form").bind("submit", function() {
                        if (params.submitHandler) {
                            SLICK.errorWatch("FORM SUBMIT HANDLER", function() {
                                params.submitHandler(self);
                            });
                        } // if

                        return false;
                    });
                } // if
            } // setContent
            
            var self = {
                attachToDialog: function(dialog) {
                    attachedDialog = dialog;
                    SLICK.Logger.info("dialog changed to " + dialog);
                    
                    // update the content
                    updateDialogContent();
                },
                
                getDialog: function() {
                    return attachedDialog ? attachedDialog.get() : null;
                },
                
                getFieldValues: function() {
                    var fieldValues = {};
                    
                    // iterate through the inputs on the form and get the field values
                    if (attachedDialog) {
                        attachedDialog.get().find(":input").each(function() {
                            fieldValues[this.id] = jQuery(this).val();
                        });
                    } // if
                    
                    return fieldValues;
                }
            };
            
            // get the form content and populate the dialog
            getFormContent(function(data) {
                SLICK.Logger.info("content retrieved");
                content = data;
                updateDialogContent();
            });
            
            return self;
        }
    };
    
    return module;
})();