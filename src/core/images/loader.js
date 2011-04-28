var getImage = (function() {
    // initialise constants and variables
    var INTERVAL_LOADCHECK = 5000,
        INTERVAL_CACHECHECK = 10000,
        LOAD_TIMEOUT = 30000,
        imageCache = {},
        imageCount = 0,
        lastCacheCheck = new Date().getTime(),
        loadingData = {},
        loadingUrls = [];

    /* internals */

    function checkImageLoads(tickCount) {
        tickCount = tickCount || new Date().getTime();

        // iterate through the images that are loading
        var ii = 0;
        while (ii < loadingUrls.length) {
            var url = loadingUrls[ii],
                imageData = loadingData[url],
                imageToCheck = loadingData[url].image,
                imageLoaded = isLoaded(imageToCheck),
                requestAge = tickCount - imageData.start,
                removeItem = imageLoaded || requestAge >= LOAD_TIMEOUT,
                callbacks;

            // if the image is loaded, then 
            if (imageLoaded) {
                callbacks = imageData.callbacks;

                // add the image to the cached images
                imageCache[url] = imageData.image;
                // _log('IMAGE LOADED: ' + url + ', in ' + requestAge + ' ms');

                // fire the callbacks
                for (var cbIdx = 0; cbIdx < callbacks.length; cbIdx++) {
                    callbacks[cbIdx](imageData.image, true);
                } // for
            } // if

            // if we need to remove the item, then do so
            if (removeItem) {
                // remove the image data 
                loadingUrls.splice(ii, 1);
                delete loadingData[url];
            }
            // otherwise, increment the counter
            else {
                ii++;
            } // if..else
        } // while
    } // imageLoadWorker

    function isLoaded(image) {
        return image && image.complete && image.width > 0;
    } // isLoaded

    function loadImage(url, callback) {
        var data = loadingData[url];

        // if we have data, then we have an image load in progress 
        // so attach the callback to the existing list of callbacks
        if (data) {
            data.callbacks.push(callback);
        }
        // otherwise, create and load the image
        else {
            var imageToLoad = new Image();

            imageToLoad.id = '_ldimg' + (++imageCount);

            // add the image to the loading data
            loadingData[url] = {
                start: new Date().getTime(),
                image: imageToLoad,
                callbacks: [callback]
            };

            // set the source of the image to trigger the load operation
            imageToLoad.src = url;

            // add the image to the loading urls
            loadingUrls[loadingUrls.length] = url;
        } // if..else
    } // loadImage
    
    // check for image loads every 5 seconds
    Animator.attach(checkImageLoads, 250);

    /**
    # T5.getImage(url, callback)
    This function is used to load an image and fire a callback when the image 
    is loaded.  The callback fires when the image is _really_ loaded (not 
    when the onload event handler fires).
    */
    return function(url, callback) {
        var image = url && callback ? imageCache[url] : null;

        // if we have the image and it is loaded, then fire the callback
        if (image && isLoaded(image)) {
            callback(image);
        }
        // otherwise, this seems to be a new image so we better load it
        else {
            loadImage(url, callback);
        } // if..else
    };
})();