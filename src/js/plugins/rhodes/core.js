SLICK.watchError("SLICK-RHODES INIT", function() {
    window.execAction = function(actionId, args) {
        SLICK.Dispatcher.execute(actionId, args);
    };

    // ATTACH a logging listener to send logging messages back to base
    SLICK.Logger.requestUpdates(function(logentry) {
        jQuery.ajax({
            url: "/app/SlickBridge/logProxy",
            method: "POST",
            data: logentry
        });
    });
});

