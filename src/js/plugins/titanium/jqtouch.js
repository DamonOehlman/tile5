SLICK.errorWatch("SLICK-APPCELERATOR jQTouch INIT", function() {
    if (jQuery.jQTouch) {
        SLICK.Logger.info("jQTouch detected - attaching page animation events to relevant divs");
        
        jQuery(document).ready(function() {
            jQuery("div").each(function() {
                if (this.className !== 'toolbar') {
                    jQuery(this).bind("pageAnimationEnd", function(evt, info) {
                        if (info && info.direction === 'in') {
                            SLICK.Logger.info("Page transition, referrer = " + jQuery(this).data("referrer"));
                        } // if
                    });
                }
            });
        });
    } // if
});