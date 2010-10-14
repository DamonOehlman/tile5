T5.Images = (function() {
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
        
    function newCanvas(width, height) {
        var tmpCanvas = document.createElement('canvas');

        // set the size of the canvas if specified
        tmpCanvas.width = width ? width : 0;
        tmpCanvas.height = height ? height : 0;

        // initialise the canvas element if using explorercanvas
        if (typeof FlashCanvas !== 'undefined') {
            tmpCanvas.id = 'tmpCanvas' + (canvasCounter++);
            tmpCanvas.style.cssText = 'position: absolute; top: -' + (height-1) + 'px; left: -' + (width-1) + 'px;';

            document.body.appendChild(tmpCanvas);

            FlashCanvas.initElement(tmpCanvas);
        } // if

        return tmpCanvas;
    } // newCanvas
        
    function postProcess(imageData) {
        if (! imageData.image) { return; }
        
        var width = imageData.realSize ? imageData.realSize.width : image.width,
            height = imageData.realSize ? imageData.realSize.height : image.height,
            canvas = newCanvas(width, height),
            context = canvas.getContext('2d'),
            offset = imageData.offset ? imageData.offset : new T5.Vector();
            
        if (imageData.background) {
            context.drawImage(imageData.background, 0, 0);
        } // if
        
        context.drawImage(imageData.image, offset.x, offset.y);
        
        if (imageData.postProcess) {
            imageData.postProcess(context, imageData);
        }
        // update the image data image
        imageData.image = canvas;
    } // applyBackground
        
    function handleImageLoad() {
        // get the image data
        var imageData = loadWatchers[this.id];
        if (imageData && imageData.image.complete && (imageData.image.width > 0)) {
            imageData.loaded = true;
            // TODO: check the image width to ensure the image is loaded properly
            imageData.hitCount = 1;
            
            // remove the image data from the loading images array
            for (var ii = loadingImages.length; ii--; ) {
                if (loadingImages[ii].image.src == this.src) {
                    loadingImages.splice(ii, 1);
                    break;
                } // if
            } // for
            
            // if we have an image background, or overlay then apply
            if (imageData.background || imageData.postProcess) {
                postProcess(imageData);
            } // if
            
            // if the image data has a callback, fire it
            if (imageData.loadCallback) {
                imageData.loadCallback(this, false);
            } // if
            
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
    
    function loadNextImage() {
        if (loadWorker) { 
            return;
        }
        
        // get the max image loads
        var maxImageLoads = T5.getConfig().maxImageLoads;
        
        // initialise the load worker
        loadWorker = GT.Loopage.join({
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
                        imageData.image.src = T5.Resources.getPath(imageData.url);
                        imageData.requested = T5.time();
                    } // if..else
                } // if
            },
            frequency: 10
        });
        
        // handle the load worker finishing
        loadWorker.bind('complete', function() {
            loadWorker = null;
        });
    } // loadNextImage
    
    function cleanupImageCache() {
        clearingCache = true;
        try {
            var halfLen = Math.floor(cachedImages.length / 2);
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
        
        GT.say("imagecache.cleared");
    } // cleanupImageCache

    function checkTimeoutsAndCache(currentTickCount) {
        var timedOutLoad = false, ii = 0,
            config = T5.getConfig();
            
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
    
    function getImage(url) {
        var imageData = null,
            image = null;
            
        if (! clearingCache) {
            imageData = images[url];
        } // if

        // return the image from the image data
        image = imageData ? imageData.image : null;
        
        if (image && (image.getContext || (image.complete && (image.width > 0)))) {
            return image;
        } // if
    } // getImage
    
    function loadImage(url, callback, loadArgs) {
        // look for the image data
        var imageData = images[url];

        // if the image data is not defined, then create new image data
        if (! imageData) {
            // initialise the image data
            imageData = T5.ex({
                url: url,
                image: new Image(),
                loaded: false,
                created: T5.time(),
                requested: null,
                hitCount: 0,
                loadCallback: callback
            }, loadArgs);
            
            // GT.Log.info("loading image, image args = ", loadArgs);
            
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
            if (imageData.image.complete && callback) {
                callback(imageData.image, true);
            } // if
        }
        
        return imageData;
    } // loadImage
    
    var module = {
        avgImageSize: 25,
        loadTimeout: 10,
        
        cancelLoad: function() {
            loadingImages = [];
        },
        
        get: getImage,
        load: loadImage,
        newCanvas: newCanvas,
        
        stats: function() {
            return {
                imageLoadingCount: loadingImages.length,
                queuedImageCount: queuedImages.length,
                imageCacheFullness: imageCacheFullness
            };
        }
    }; // 
    
    GT.Loopage.join({
        execute: checkTimeoutsAndCache,
        frequency: 20000
    });
    
    return module;
})();
