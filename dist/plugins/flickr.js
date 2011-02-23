/**
# T5.Flickr (plugin module)
*/
T5.Flickr = (function() {
    // initialise constants
    var URL_BASE = 'http://api.flickr.com/services/rest/' + 
            '?api_key={0}' +
            '&format=json',
        MODE_METHODS = {
            interesting: 'flickr.interestingness.getList',
            recent: 'flickr.photos.getRecent',
            search: 'flickr.photos.search'
        },
        METHOD_GETINFO = 'flickr.photos.getInfo',
        METHOD_GETPLACES = 'flickr.places.placesForBoundingBox',
        MIN_QUEUE_LENGTH = 100,
        IMAGES_PER_REQUEST = 150,
        DEFAULT_SEARCH_OPTIONS = {};

    var FlickrTileGenerator = function(params) {
        params = COG.extend({
            apikey: '',
            mode: 'interesting'
        }, params);
        
        // initialise variables
        var searchText = '',
            pageIndex = 1, 
            assignedPhotos = {},
            queuedPhotos = [],
            knownUsers = {},
            searching = false,
            mode = params.mode,
            modeMethod = MODE_METHODS[mode],
            noMoreResults = false,
            foundModifiers = [],
            searchOptions = COG.extend({}, DEFAULT_SEARCH_OPTIONS),
            userSearchOptions = {};
            
        COG.info('flickr tile generator created, params = ', params);

        /* internal functions */

        function buildSearchUrl(callback) {
            var url;

            if (searchText) {
                parseSearchParams(function() {
                    COG.info("search params parsed");
                    url = getApiUrl('method=' + METHOD_SEARCH + getSearchParams() + 
                            '&per_page=' + IMAGES_PER_REQUEST + '&page=' + pageIndex++);

                    callback(url);
                }); // getSearchParams
            }
            else {
                url = getApiUrl('method=' + modeMethod + '&per_page=' + IMAGES_PER_REQUEST + '&page=' + pageIndex++);
                callback(url);
            } // if
        } // buildSearchUrl

        function checkQueue() {
            if (queuedPhotos.length < MIN_QUEUE_LENGTH) {
                queryFlickr();
            } // if
        } // checkQueue
        
        function getApiUrl(extraParams) {
            var url = COG.formatStr(URL_BASE, params.apikey);
            return url + (extraParams ? '&' + extraParams : '');
        } // getApiUrl

        function getPhotoData(tileKey) {
            var photoData = assignedPhotos[tileKey];
            if ((! photoData) && (queuedPhotos.length > 0)) {
                assignedPhotos[tileKey] = queuedPhotos.shift();

                photoData = assignedPhotos[tileKey];
            } // if

            // if the photo data does not have a lawnchair key associated with it, then assign it now
            if (photoData && (! photoData.key)) {
                photoData.key = photoData.id;
            } // if

            return photoData;
        } // getPhotoData

        function getPhotoUrl(tileKey, imageType) {
            var photoData = getPhotoData(tileKey);
            if (photoData) {
                return "http://farm" + photoData.farm + ".static.flickr.com/" + 
                    photoData.server + "/" + photoData.id + "_" + photoData.secret + 
                    (typeof imageType !== 'undefined' ? '_' + imageType : '') + ".jpg";
            } // if

            return null;
        } // getPhotoUrl

        function getPhotoInfo(photoId, callback) {
            var url = getApiUrl('method=' + METHOD_GETINFO + '&photo_id=' + photoId);

            COG.jsonp(url, function(data) {
                processPhotoInfo(data);

                if (callback) {
                    callback(data);
                } // if
            }, 'jsoncallback');
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

        function parseSearchParams(callback) {
            var rules = new COG.ParseRules();

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
                    var url = getApiUrl('method=flickr.people.findByUsername' + 
                        '&username=' + matches[1].replace(/\s/g, "+"));

                    COG.jsonp(url, function(data) {
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

            searchOptions = COG.COG.extend(userSearchOptions, DEFAULT_SEARCH_OPTIONS);
            rules.each(searchText, searchOptions, callback);
        } // parseSearchParams

        function queryFlickr(callback) {
            if (searching || noMoreResults) { return; }

            searching = true;
            buildSearchUrl(function(url) {
                COG.jsonp(url, function(data) {
                    processSearchResults(data);
                    
                    if (callback) {
                        callback(data);
                    }
                    
                    COG.info('triggering update');
                    self.trigger('update');
                }, "jsoncallback");
            });
        } // queryFlickr

        function processPhotoInfo(data) {
            // COG.info("got photo info:", data);
        } // processPhotoInfo

        function processSearchResults(data) {
            Ext.getBody().unmask();

            if (! data.photos) {
                COG.error("Unable to retrieve photos, response from flickr was: ", data);
                return;
            } // if

            searching = false;
            var searchResults = data.photos.photo;
            noMoreResults = searchResults.length === 0;

            for (var ii = searchResults.length; ii--; ) {
                queuedPhotos.push(searchResults[ii]);
                // assignedPhotos.push(null);
            } // for
        } // processSearchResults                        

        /* exports */

        function initTileCreator(tileWidth, tileHeight, args, callback) {
            var baseX = 0,
                baseY = 0,
                creator = function(tileX, tileY) {
                    var tileKey = tileX + '_' + tileY,
                        photoData = getPhotoData(tileKey);
                        
                    // check the queue
                    checkQueue();
                        
                    if (photoData) {
                        return T5.Tiling.init(
                            baseX + (tileX * tileWidth), 
                            baseY + (tileY * tileHeight),
                            tileWidth,
                            tileHeight, COG.extend({
                                url: getPhotoUrl(tileKey, 'm')
                            }, photoData));
                    } // if
                }; // loader
                
            // if the callback is assigned, then pass back the creators
            if (callback) {
                queryFlickr(function() {
                    callback(creator);
                });
            } // if
        } // initTileCreator

        /* define the generator */

        var self = COG.extend(new T5.TileGenerator(params), {
            initTileCreator: initTileCreator
        });

        
        return self;
    };
    
    T5.Generator.register('flickr', FlickrTileGenerator);
})();
