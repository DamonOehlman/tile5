T5.Photogrid = (function() {
    var URL_BASE = 'http://api.flickr.com/services/rest/' + 
            '?api_key=e1b6e0f0d9957c81d05c135d4a48484e' +
            '&format=json',
        METHOD_SEARCH = 'flickr.photos.search',
        METHOD_RECENT = 'flickr.photos.getRecent',
        METHOD_GETINFO = 'flickr.photos.getInfo',
        METHOD_GET_INTERESTING = 'flickr.interestingness.getList',
        FLICKR_TILE_SIZE = 75,
        MIN_QUEUE_LENGTH = 100,
        IMAGES_PER_REQUEST = 150,
        
        // initialise the search options
        DEFAULT_SEARCH_OPTIONS = {};
        
        
    T5.tileSize = FLICKR_TILE_SIZE;
    
    /* photogrid plugin definition */
    
    var PhotogridPlugin = function(params) {
        params = T5.ex({
            init: null
        }, params);
        
        return params;
    };
    
    /* search param retrievers */
    
    var searchParamRegexes = [{
        regex: /user\:(\S+)/i,
        processor: usernameToUserIdParam
    }];
    
    /* FlickrTileGrid definition */
    
    var FlickrTileGrid = function(params) {
        var parent = new T5.ImageTileGrid(params),
            parentPrep = parent.prepTile;

        var self = T5.ex(parent, {
            prepTile: function(tile, state) {
                // if the tile url is empty, then assign it
                if (tile && (! tile.url)) {
                    tile.url = getPhotoUrl(tile.photoIndex, 's');
                } // if
                
                parentPrep(tile, state);
            }
        });
        
        return self;
    };
    
    var tiler = null,
        tileGrid = null,
        mode = 'search',
        imagesPerSide = 0, 
        imagesPerPage = IMAGES_PER_REQUEST, 
        searchText = '',
        pageIndex = 1, 
        displayedPageCount = 0,
        assignedPhotos = [],
        queuedPhotos = [],
        populatedTiles = [],
        photoInfo = {},
        knownUsers = {},
        emptyTile = null,
        backgroundTile = null,
        tileBorder = null,
        selectedPhoto = null,
        searching = false,
        offsetBases = {},
        monitorQueue = [],
        checkingQueue = false,
        noMoreResults = false,
        plugins = [],
        foundModifiers = [],
        currentImage = null,
        searchOptions = GT.extend({}, DEFAULT_SEARCH_OPTIONS),
        userSearchOptions = {},
        topLeftOffset = new T5.Vector();
        
    /*
    // var the faves storage
    var faves = new Lawnchair({ 
        table: 'photogridfaves',
        adaptor: /webkit/i.test(navigator.userAgent) ? 'webkit' : 'dom'
    });
    */
    
    /* internal functions */
    
    function buildSearchUrl(callback) {
        var url;
        
        if (searchText) {
            parseSearchParams(function() {
                GT.Log.info("search params parsed");
                url = URL_BASE + '&method=' + METHOD_SEARCH + getSearchParams() + 
                    '&per_page=' + imagesPerPage + '&page=' + pageIndex++;

                callback(url);
            }); // getSearchParams
        }
        else {
            url = URL_BASE + '&method=' + METHOD_RECENT + 
                '&per_page=' + imagesPerPage + '&page=' + pageIndex++;
                
            callback(url);
        } // if
    } // buildSearchUrl
    
    function cancelSearch(message) {
        resetState();
        
        alert(message);
    } // cancelSearch
    
    function checkQueue() {
        if ((mode === 'search') && (queuedPhotos.length < MIN_QUEUE_LENGTH)) {
            queryFlickr();
        } // if
    } // checkQueue
    
    function drawTileBorder(context, imageData) {
        context.strokeStyle = "#666666";
        context.lineWidth = 2.5;
        
        context.beginPath();
        context.moveTo(0, 76);
        context.lineTo(0, 0);
        context.lineTo(76, 0);
        context.stroke();
    } // drawTileBorder
    
    function getStartIndex(topLeftOffset) {
        var key = topLeftOffset.x + "_" + topLeftOffset.y,
            startIndex = offsetBases[key];
        
        if (typeof startIndex === "undefined") {
            offsetBases[key] = imagesPerPage * displayedPageCount++;
            startIndex = offsetBases[key];
            // GT.Log.info("start index = " + startIndex + ", for key = " + key, offsetBases);
        } // if
        
        return startIndex;
    } // topLeftOffset
    
    function getFlickrTile(col, row, topLeftOffset, gridSize) {
        var photoIndex = getStartIndex(topLeftOffset) + row * gridSize + col;
        while (photoIndex >= assignedPhotos.length) {
            assignedPhotos.push(null);
        } // while
        
        var tile = new T5.ImageTile({
            photoIndex: photoIndex
        });
        
        return tile;
    } // getFlickrTiles
    
    function getPhotoData(index) {
        var photoData = assignedPhotos[index];
        if ((! photoData) && (queuedPhotos.length > 0)) {
            assignedPhotos[index] = queuedPhotos.shift();

            photoData = assignedPhotos[index];
        } // if
        
        // if the photo data does not have a lawnchair key associated with it, then assign it now
        if (photoData && (! photoData.key)) {
            photoData.key = photoData.id;
        } // if
        
        return photoData;
    } // getPhotoData
    
    function getPhotoUrl(index, imageType) {
        var photoData = getPhotoData(index);
        if (photoData) {
            return "http://farm" + photoData.farm + ".static.flickr.com/" + 
                photoData.server + "/" + photoData.id + "_" + photoData.secret + 
                (typeof imageType !== 'undefined' ? '_' + imageType : '') + ".jpg";
        } // if

        return null;
    } // getPhotoUrl
    
    function getPhotoInfo(photoId, callback) {
        /*
        var url = URL_BASE + '&method=' + METHOD_GETINFO + '&photo_id=' + photoId;
        
        GT.jsonp(url, function(data) {
            processPhotoInfo(data);
            
            if (callback) {
                callback(data);
            } // if
        }, 'jsoncallback');
        */
    } // getPhotoInfo
    
    function getSearchParams() {
        var params = "",
            searchTerm = searchText;
            
        // iterate through the found modifiers and remove
        for (var ii = 0; ii < foundModifiers.length; ii++) {
            searchTerm = searchTerm.replace(foundModifiers[ii], "");
        } // for
            
        if (searchTerm) {
            params += '&text=' + searchTerm;
        } // if
        
        for (var key in searchOptions) {
            if (searchOptions[key]) {
                params += '&' + key + '=' + searchOptions[key];
            } // if
        } // for
        
        return params;
    } // getSearchParams
    
    function getUrlParam(name, defaultValue) {
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( window.location.href );
        
        return results ? results[1] : (typeof defaultValue !== 'undefined' ? defaultValue : "");
    } // getUrlParam
    
    function initFromHash(hash) {
        var matches = /^photo\-(\d+)$/i.exec(hash);
        if (matches) {
            getPhotoInfo(matches[1], function(data) {
                
            });
        }
        else {
            searchText = hash;
            $("#searchtext").val(searchText);
            queryFlickr();
        } // if..else
    } // initFromHash
    
    function parseSearchParams(callback) {
        var rules = new GT.ParseRules();
        
        // reset the discovered modifiers
        foundModifiers = [];
        
        // look for the user specified
        rules.add(/user\:(.+)/i, function(matches, receiver, callback) {
            foundModifiers.push(matches[0]);
            
            var userId = knownUsers[matches[1]];
            if (userId) {
                receiver.user_id = userId;
                callback();
            }
            else {
                var url = URL_BASE + '&method=flickr.people.findByUsername' + 
                    '&username=' + matches[1].replace(/\s/g, "+");

                GT.jsonp(url, function(data) {
                    if (data.user) {
                        receiver.user_id = data.user.id;
                        knownUsers[matches[1]] = receiver.user_id;
                        
                        callback();
                    }
                    else {
                        cancelSearch("User not found");
                    }
                }, "jsoncallback");
            } // if..else
        });
        
        searchOptions = GT.extend(userSearchOptions, DEFAULT_SEARCH_OPTIONS);
        rules.each(searchText, searchOptions, callback);
    } // parseSearchParams

    function queryFlickr() {
        if (searching || noMoreResults) { return; }
        
        GT.Log.info("running query");
        
        searching = true;
        buildSearchUrl(function(url) {
            updateStatus(searchText ? 'Searching for images' : 'Getting recent images');
            GT.jsonp(url, processSearchResults, "jsoncallback");
        });
    } // queryFlickr
    
    function processPhotoInfo(data) {
        // GT.Log.info("got photo info:", data);
    } // processPhotoInfo
    
    function processSearchResults(data) {
        if (! data.photos) {
            GT.Log.error("Unable to retrieve photos, response from flickr was: ", data);
            return;
        } // if
        
        searching = false;
        if (mode === 'search') {
            var searchResults = data.photos.photo;
            noMoreResults = searchResults.length === 0;

            for (var ii = searchResults.length; ii--; ) {
                queuedPhotos.push(searchResults[ii]);
            } // for

            // iterate through the results and add them to the 

            refreshGrid();
        } // if
        
        updateStatus();
    } // processSearchResults
    
    function refreshGrid() {
        if (! tiler) { return; }
        if (! tileGrid) {
            var dimensions = tiler.getDimensions();
            
            tileGrid = new FlickrTileGrid({
                emptyTile: backgroundTile,
                panningTile: backgroundTile,
                gridSize: imagesPerSide * 4,
                tileSize: FLICKR_TILE_SIZE,
                width: dimensions.width, 
                height: dimensions.height,
                /*
                tileDrawArgs: {
                    offset: new T5.Vector(1, 1),
                    postProcess: drawTileBorder
                },
                */
                center: new T5.Vector(imagesPerSide, imagesPerSide)
            });
            
            tileGrid.populate(getFlickrTile);
            
            tiler.setTileLayer(tileGrid);
        }
        
        tiler.repaint();
    } // refreshGrid
    
    function resetState() {
        if (tileGrid) {
            tiler.cleanup();
            tileGrid = null;
        } // if
        
        mode = 'search';
        pageIndex = 1;
        searchText = "";
        noMoreResults = false;
        queuedPhotos = [];
        assignedPhotos = [];
        populatedTiles = [];
        selectedPhoto = null;
        searching = false;
        
        // reset the position of the tiler back to the origin
        tiler.updateOffset(0, 0);
    } // resetState
    
    function sizePhotoCanvas() {
        var canvas = $("#photos").get(0);
        
        canvas.width = $("#main").width();
        
        // initialise the images per side and per page
        imagesPerSide = Math.ceil(Math.max(canvas.height / FLICKR_TILE_SIZE, canvas.width / FLICKR_TILE_SIZE));
        
        $("#details")
            .width($(window).width() - canvas.width - 20)
            .height(canvas.height - 16);
            
        $(canvas).fadeIn();
    } // sizePhotoCanvas
    
    function updatePhotoTools() {
        if (! selectedPhoto) { return; }
        
        // reset tools to the default state
        $("#fav").html("Favorite").addClass("add").removeClass("del").removeAttr("disabled");
        
        /*
        faves.get(selectedPhoto.id, function(r) {
            if (r) {
                $("#fav").html("Unfavorite").addClass("del").removeClass("add");
            }
        });
        */
    } // updatePhotoTools
    
    function updateStatus(message) {
        if (message) {
            $("#status").html(message).slideDown();
        }
        else {
            $("#status").slideUp();
        } // if..else
    } // updateStatus
    
    function usernameToUserIdParam(matches) {
        return function(callback) {
        };
    } // usernameToUserIdParam
    
    /* event handlers */
    
    function loadFavorites() {
        resetState();
        
        // set autofill to false
        mode = 'faves';
        
        // load the favourites
        faves.each(function(photo) {
            queuedPhotos.push(photo);
        }); // each
        
        refreshGrid();
    } // loadFavorites
    
    function optionsSave() {
        userSearchOptions.is_commons = $("#is_commons").get(0).checked;
        userSearchOptions.is_getty = $("#is_getty").get(0).checked;
        GT.Log.info("search options updated:", userSearchOptions);
        
        // if we are in the search mode, then run the search
        if (mode === 'search') {
            module.search(searchText);
        } // if
        
        // call options cancel to restore the display state
        optionsCancel();
    } // optionsSave
    
    function optionsCancel() {
        $("#options").hide();
        $("#current").show();
    } // optionsCancel
    
    function showOptions() {
        $("#is_commons").get(0).checked = userSearchOptions.is_commons;
        $("#is_getty").get(0).checked = userSearchOptions.is_getty;
        
        $("#current").hide();
        $("#options").show();
    } // showOptions
    
    function toggleFavorite() {
        if (! selectedPhoto) { return; }
        
        var adding = $(this).hasClass('add');
        if (adding) {
            // get the current photo data
            faves.save(selectedPhoto, updatePhotoTools);
        }
        else {
            faves.remove(selectedPhoto.id, updatePhotoTools);
        } // if..else
    } // toggleFavorite
    
    function viewTilePhoto(tile, callback) {
        var tileIndex = tile ? tile.photoIndex : undefined;
        if (typeof tileIndex !== 'undefined') {
            selectedPhoto = assignedPhotos[tileIndex];
            globalPhoto = selectedPhoto;
            if (selectedPhoto) {
                var photoPage = 'http://www.flickr.com/photos/' + selectedPhoto.owner + '/' + selectedPhoto.id,
                    photoUrl = getPhotoUrl(tileIndex);
                    
                $.colorbox({
                    href: photoUrl, // '<a href="' + photoPage + '"><img src="' + photoUrl + '" /></a>',
                    title: '<a href="' + photoPage + '">' + (selectedPhoto.title ? selectedPhoto.title : 'Untitled') + '</a>'
                });
            } // if
        } // if
    } // handleTap
    
    /* document ready handler */
    
    if (! Modernizr.canvas) {
        $("#main").addClass("error").html(
            "<p>Sorry your browser doesn't support the photogrid.</p>" +
            "<p>It's Internet Explorer isn't it...</p>");
        return null;
    } // if

    $(document).ready(function() {
        // get the registered actions
        var actions = T5.Dispatcher.getRegisteredActions();
        for (var ii = 0; ii < actions.length; ii++) {
            $("#topmenu").append('<li><a id="' + actions[ii].id + '" href="#">' + actions[ii].getParam('title') + '</a></li>');
            $('#' + actions[ii].id).click(function() {
                T5.Dispatcher.execute(this.id, module, tiler, tileGrid);
                return false;
            });
        } // for
        
        sizePhotoCanvas();
        
        tiler = new T5.Tiler({
            container: 'photos',
            scalable: false
        });
        
        tiler.bind("selectTile", viewTilePhoto);
        $(window).bind("resize", sizePhotoCanvas);
        
        $("#searchtext").bind('keypress', function(evt) {
            if (evt.keyCode === 13) {
                module.search(this.value);
            }
        });
        
        $("#runsearch").click(function() {
            module.search($("#searchtext").val());
        });
        
        $("#fav").click(toggleFavorite);
        $("#load").click(loadFavorites);
        $("#searchopts").click(showOptions);
        
        // attach options handlers
        $("#options-save").click(optionsSave);
        $("#options-cancel").click(optionsCancel);
        
        /*
        currentImage = $("#current img").get(0);
        currentImage.onload = function() {
            var marginVert = Math.floor(($("#details").height() - currentImage.height) / 2),
                marginHorz = Math.floor(($("#details").width() - currentImage.width) / 2);
                
            $(currentImage).css("margin", marginVert + "px " + marginHorz + "px");
            
            if (! searching) {
                updateStatus();
            } // if
            
            $("#current").fadeIn('fast');
        };
        */
        
        if (location.hash) {
            initFromHash(unescape(location.hash.slice(1)).replace(/\+/g, ' '));
        }
        else {
            queryFlickr();
        } // if
    });
    
    /* public module initialization */
    
    var module = {
        addPlugin: function(args) {
            plugins.push(new PhotogridPlugin(args));
        },
        
        getPhotoData: function(index) {
            return assignedPhotos[index];
        },
        
        getTiler: function() {
            return tiler;
        },
        
        getTileGrid: function() {
            return tileGrid;
        },
        
        getPhotoData: function(index) {
            return assignedPhotos[index];
        },
        
        search: function(text) {
            resetState();

            // initialise search defaults
            searchText = text;
            location.hash = escape(text);
            
            // start the flickr search
            queryFlickr();
        },
        
        view: function(tile) {
            // viewTilePhoto(tile);
        }
    };
    
    /* demo initialization */
    
    T5.Images.load("/media/img/flickr-tile.png", function(image) {
        backgroundTile = image;
        
        emptyTile = new Image();
        emptyTile.src = backgroundTile.src;
    });
    
    T5.Images.load("/media/img/flickr-overlay.png", function(image) {
        tileBorder = image;
    });
    
    setInterval(checkQueue, 3000);
        
    return module;
})();