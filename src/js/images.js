T5.Images = (function() {
    // initialise image loader internal variables
    var images = {},
        loadWatchers = {},
        imageCounter = 0,
        queuedImages = [],
        loadingImages = [],
        cachedImages = [],
        interceptors = [],
        imageCacheFullness = 0,
        clearingCache = false;
        
    function postProcess(imageData) {
        if (! imageData.image) { return; }
        
        var width = imageData.realSize ? imageData.realSize.width : image.width,
            height = imageData.realSize ? imageData.realSize.height : image.height,
            canvas = T5.newCanvas(width, height),
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
            cachedImages.push({
                url: this.src,
                created: imageData.requested
            });
            
            // remove the item from the load watchers
            delete loadWatchers[this.id];
            
            // load the next image
            loadNextImage();
        } // if
    } // handleImageLoad
    
    function loadNextImage() {
        var maxImageLoads = T5.getConfig().maxImageLoads;

        // if we have queued images and a loading slot available, then start a load operation
        while ((queuedImages.length > 0) && ((! maxImageLoads) || (loadingImages.length < maxImageLoads))) {
            var imageData = queuedImages.shift();
            
            if (imageData.imageLoader) {
                // add the image data to the loading images
                loadingImages.push(imageData);
                
                // run the image loader
                imageData.imageLoader(imageData, handleImageLoad);
            } // if
        } // if
    } // loadNextImage
    
    function getImageLoader(url) {
        var loaderFn = null;
        
        // iterate through the interceptors and see if any of them want it
        for (var ii = interceptors.length; ii-- && (! loaderFn); ) {
            loaderFn = interceptors[ii](url);
        } // for
        
        // if one of the interceptors provided an image loader, then use that otherwise provide the default
        return loaderFn ? loaderFn : function(imageData, onLoadCallback) {
            // reset the queued flag and attempt to load the image
            imageData.image.onload = onLoadCallback;
            imageData.image.src = T5.Resources.getPath(imageData.url);
            imageData.requested = T5.time();
        };
    } // getImageLoader
    
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

    function checkTimeoutsAndCache() {
        var currentTickCount = T5.time(),
            timedOutLoad = false, ii = 0,
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
                imageLoader: getImageLoader(url),
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
            queuedImages.push(imageData);
            
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
        
        addInterceptor: function(callback) {
            interceptors.push(callback);
        },
        
        cancelLoad: function() {
            loadingImages = [];
        },
        
        get: getImage,
        load: loadImage,
        
        stats: function() {
            return {
                imageLoadingCount: loadingImages.length,
                queuedImageCount: queuedImages.length,
                imageCacheFullness: imageCacheFullness
            };
        }
    }; // 
    
    setInterval(checkTimeoutsAndCache, 1000);
    
    return module;
})();
