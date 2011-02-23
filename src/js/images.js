/**
# T5.Images
_module_


The T5.Images module provides image loading support for the rest of the
Tile5 library.


## Module Functions
*/
var Images = (function() {
    // initialise image loader internal variables
    var images = {},
        canvasCounter = 0,
        loadWatchers = {},
        imageCounter = 0,
        queuedImages = [],
        loadingImages = [],
        cachedImages = [],
        imageCacheFullness = 0,
        loadWorker = null,
        clearingCache = false;

    /* internal functions */
    
    function loadNextImage() {
        if (loadWorker) { 
            return;
        }
        
        // get the max image loads
        var maxImageLoads = getConfig().maxImageLoads;
        
        // initialise the load worker
        loadWorker = COG.Loopage.join({
            execute: function(tickCount, worker) {
                if ((! maxImageLoads) || (loadingImages.length < maxImageLoads)) {
                    var imageData = queuedImages.shift();
                    
                    if (! imageData) {
                        worker.trigger('complete');
                    }
                    else {
                        // add the image data to the loading images
                        loadingImages[loadingImages.length] = imageData;

                        // reset the queued flag and attempt to load the image
                        imageData.image.onload = handleImageLoad;
                        imageData.image.src = imageData.url;
                        imageData.requested = T5.ticks();
                    } // if..else
                } // if
            },
            frequency: 10
        });
        
        // handle the load worker finishing
        loadWorker.bind('complete', function(evt) {
            loadWorker = null;
        });
    } // loadNextImage
    
    function cleanupImageCache() {
        clearingCache = true;
        try {
            var halfLen = cachedImages.length >> 1;
            if (halfLen > 0) {
                // TODO: make this more selective... currently some images on screen may be removed :/
                cachedImages.sort(function(itemA, itemB) {
                    return itemA.created - itemB.created;
                });

                // remove the cached image data
                for (var ii = halfLen; ii--; ) {
                    delete images[cachedImages[ii].url];
                } // for

                // now remove the images from the cached images
                cachedImages.splice(0, halfLen);
            } // if
        }
        finally {
            clearingCache = false;
        } // try..finally
        
        module.trigger('cacheCleared');
    } // cleanupImageCache

    function checkTimeoutsAndCache(currentTickCount) {
        var timedOutLoad = false, ii = 0,
            config = getConfig();
            
        // iterate through the loading images, and check if any of them have been active too long
        while (ii < loadingImages.length) {
            var loadingTime = currentTickCount - loadingImages[ii].requested;
            if (loadingTime > (module.loadTimeout * 1000)) {
                loadingImages.splice(ii, 1);
                timedOutLoad = true;
            }
            else {
                ii++;
            } // if..else
        } // while
        
        // if we timeout some images, then load next images
        if (timedOutLoad) {
            loadNextImage();
        } // if
        
        // if we have a configuration and an image cache max size, then ensure we haven't exceeded it
        if (config && config.imageCacheMaxSize) {
            imageCacheFullness = (cachedImages.length * module.avgImageSize) / config.imageCacheMaxSize;
            if (imageCacheFullness >= 1) {
                cleanupImageCache();
            } // if
        } // if
    } // checkTimeoutsAndCache
    
    function postProcess(imageData) {
        if (! imageData.image) { return; }
        
        globalImageData = imageData;
        
        var width = imageData.realSize ? imageData.realSize.width : imageData.image.width,
            height = imageData.realSize ? imageData.realSize.height : imageData.image.height,
            canvas = newCanvas(width, height),
            context = canvas.getContext('2d'),
            offset = imageData.offset ? imageData.offset : T5.XY.init();
            
        if (imageData.background) {
            context.drawImage(imageData.background, 0, 0);
        } // if
        
        if (imageData.drawBackground) {
            imageData.drawBackground(context);
        } // if
        
        if (imageData.customDraw) {
            imageData.customDraw(context, imageData);
        }
        else {
            context.drawImage(imageData.image, offset.x, offset.y);
        } // if..else
        
        if (imageData.postProcess) {
            imageData.postProcess(context, imageData);
        }
        // update the image data image
        imageData.image = canvas;
    } // applyBackground
    
    /* event handlers */
        
    function handleImageLoad() {
        // get the image data
        var imageData = loadWatchers[this.id], 
            ii;
            
        if (imageData && isLoaded(imageData.image)) {
            imageData.loaded = true;
            // TODO: check the image width to ensure the image is loaded properly
            imageData.hitCount = 1;
            
            // remove the image data from the loading images array
            for (ii = loadingImages.length; ii--; ) {
                if (loadingImages[ii].image.src == this.src) {
                    loadingImages.splice(ii, 1);
                    break;
                } // if
            } // for
            
            // if we have an image background, or overlay then apply
            if (imageData.background || imageData.postProcess || imageData.drawBackground || imageData.customDraw) {
                postProcess(imageData);
            } // if
            
            // if the image data has a callback, fire it
            for (ii = imageData.callbacks.length; ii--; ) {
                if (imageData.callbacks[ii]) {
                    imageData.callbacks[ii](this, false);
                } // if
            } // for
            
            // reset the image callbacks
            imageData.callbacks = [];
            
            // add the image to the cached images
            cachedImages[cachedImages.length] = {
                url: this.src,
                created: imageData.requested
            };
            
            // remove the item from the load watchers
            delete loadWatchers[this.id];
            
            // load the next image
            loadNextImage();
        } // if
    } // handleImageLoad
    
    function isLoaded(image) {
        return image.complete && image.width > 0;
    } // isLoaded
    
    /* exports */
    
    /**
    ### cancelLoad()
    */
    function cancelLoad() {
        var ii;
        
        // if we have a load worker, then leave the loop
        if (loadWorker) {
            COG.Loopage.leave(loadWorker.id);
            loadWorker = null;
        } // if
        
        // iterate through the loading images and remove them from the images
        for (ii = loadingImages.length; ii--; ) {
            delete images[loadingImages[ii].url];
        } // for
        
        // reset the loading images array
        loadingImages = [];
        
        // remove the queued images from the queue
        for (ii = queuedImages.length; ii--; ) {
            delete images[queuedImages[ii].url];
        } // for

        // reset the queued images array
        queuedImages = [];
    } // cancelLoad
    
    /**
    ### get(url)
    This function is used to retrieve the image specified by the url.  If the image
    has already been loaded, then the image is automatically returned from the 
    function but if not, then a null value is returned.  

    If an optional `callback` argument is provided, then this indicates to the function 
    that if the image is not already loaded, it should be loaded and this the is passed 
    through to the load method function.  
    
    #### Example Code
    ~ var image = T5.Images.get('testimage.jpg', function(image) {
    ~ 
    ~ });
    */
    function get(url, callback, loadArgs) {
        var imageData = null,
            image = null;
            
        if (! clearingCache) {
            imageData = images[url];
        } // if

        // return the image from the image data
        image = imageData ? imageData.image : null;
        
        if (image && (image.getContext || isLoaded(image))) {
            return image;
        }
        else if (callback) {
            load(url, callback, loadArgs);
        } // if..else
        
        return null;
    } // get
    
    /**
    ### load(url, callback, loadArgs)
    */
    function load(url, callback, loadArgs) {
        // look for the image data
        var imageData = images[url];

        // if the image data is not defined, then create new image data
        if (! imageData) {
            // initialise the image data
            imageData = COG.extend({
                url: url,
                image: new Image(),
                loaded: false,
                created: T5.ticks(),
                requested: null,
                hitCount: 0,
                callbacks: [callback]
            }, loadArgs);
            
            // COG.info("loading image, image args = ", loadArgs);
            
            // initialise the image id
            imageData.image.id = "resourceLoaderImage" + (imageCounter++);
            
            // add the image to the images lookup
            images[url] = imageData;
            loadWatchers[imageData.image.id] = imageData;
            
            // add the image to the queued images
            queuedImages[queuedImages.length] = imageData;
            
            // trigger the next load event
            loadNextImage();
        }
        else {
            imageData.hitCount++;
            if (isLoaded(imageData.image) && callback) {
                callback(imageData.image, true);
            }
            else {
                imageData.callbacks.push(callback);
            } // if..else
        }
        
        return imageData;
    } // load
    
    /**
    ### newCanvas(width, height)
    */
    function newCanvas(width, height) {
        var tmpCanvas = document.createElement('canvas');
        COG.info('creating new canvas');

        // set the size of the canvas if specified
        tmpCanvas.width = width ? width : 0;
        tmpCanvas.height = height ? height : 0;
        
        // flash canvas initialization
        if (typeof FlashCanvas != 'undefined') {
            document.body.appendChild(tmpCanvas);
            FlashCanvas.initElement(tmpCanvas);
        } // if

        return tmpCanvas;
    } // newCanvas    
    
    var module = {
        avgImageSize: 25,
        loadTimeout: 10,
        
        cancelLoad: cancelLoad,
        get: get,
        load: load,
        newCanvas: newCanvas,
        
        reset: function() {
            images = {};
        },
        
        stats: function() {
            return {
                imageLoadingCount: loadingImages.length,
                queuedImageCount: queuedImages.length,
                imageCacheFullness: imageCacheFullness
            };
        }
    }; // 
    
    // make the images observable
    COG.observable(module);

    COG.Loopage.join({
        execute: checkTimeoutsAndCache,
        frequency: 20000
    });
    
    return module;
})();
