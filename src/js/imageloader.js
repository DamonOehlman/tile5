// initialise constants and variables
var INTERVAL_LOADCHECK = 100,
    INTERVAL_CACHECHECK = 10000,
    LOAD_TIMEOUT = 30000,
    imageCache = {},
    imageCount = 0,
    lastCacheCheck = new Date().getTime(),
    loadingData = {},
    loadingUrls = [],
    isFlashCanvas = typeof FlashCanvas != 'undefined',
    workerTimeout = 0;

/* internals */

function imageLoadWorker() {
    var tickCount = new Date().getTime(),
        ii = 0;

    // clear the worker timeout as this may have been triggered in 
    // response to an image load event
    clearTimeout(workerTimeout);
    workerTimeout = 0;
    
    // COG.info('checking for loaded images, we have ' + loadingUrls.length + ' queued');
    
    // iterate through the images that are loading
    while (ii < loadingUrls.length) {
        var url = loadingUrls[ii],
            imageData = loadingData[url],
            imageToCheck = loadingData[url].image,
            imageLoaded = isLoaded(imageToCheck),
            requestAge = tickCount - imageData.start,
            removeItem = imageLoaded || requestAge >= LOAD_TIMEOUT;
            
        // if the image is loaded, then 
        if (imageLoaded) {
            triggerLoaded(url, imageData);
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
    
    // if we still have loading urls, then queue it up again
    if (loadingUrls.length > 0) {
        workerTimeout = setTimeout(imageLoadWorker, INTERVAL_LOADCHECK);
    } // if
} // imageLoadWorker

function isLoaded(image) {
    return image && (isFlashCanvas || (image.complete && image.width > 0));
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
        
        // initialise the image parameters
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
    
    if (! workerTimeout) {
        workerTimeout = setTimeout(imageLoadWorker, INTERVAL_LOADCHECK);
    } // if
} // loadImage

function triggerLoaded(url, imageData) {
    var loadedImage = imageData.image,
        callbacks = imageData.callbacks;
        
    // add the image to the cached images
    imageCache[url] = loadedImage;
        
    // fire the callbacks
    for (var ii = 0; ii < callbacks.length; ii++) {
        callbacks[ii](loadedImage, true);
    } // for
} // triggerLoaded

/**
# T5.getImage(url, callback)
This function is used to load an image and fire a callback when the image 
is loaded.  The callback fires when the image is _really_ loaded (not 
when the onload event handler fires).
*/
var getImage = T5.getImage = function(url, callback) {
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