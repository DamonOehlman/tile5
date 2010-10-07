T5.TweetGrid = (function() {
    // initialise constants
    var TWEET_GRID_SIZE = 100;
    
    // initialise variables
    var twitter = null,
        tiler = null,
        grid = null,
        emptyTile = null,
        lastTweetId = null,
        assignedUsers = {},
        queuedKeys = {},
        queuedUsers = [];
    
    // initialise settings
    T5.Tiling.Config.TILESIZE = 58;
    
    /* tweet tile grid definition */
    
    /* FlickrTileGrid definition */
    
    var TweetTileGrid = function(params) {
        params = T5.ex({
            gridSize: TWEET_GRID_SIZE
        }, params);
        
        var parent = new T5.Tiling.ImageTileGrid(params),
            parentPrep = parent.prepTile;

        var self = T5.ex(parent, {
            prepTile: function(tile, state) {
                // if the tile url is empty, then assign it
                if (tile && (! tile.userId) && (queuedUsers.length > 0)) {
                    GRUNT.Log.info("prepping tile");
                    var userData = queuedUsers.shift();
                    userData.tile = tile;
                    
                    // update the tile image url
                    tile.url = userData.twitterData.profile_image_url;
                    
                    // delete the queued keys from the list
                    delete queuedKeys[userData.id];
                    
                    // update the assigned users
                    assignedUsers[userData.id] = userData;
                } // if
                
                parentPrep(tile, state);
            }
        });
        
        return self;
    };
    
    /* private functions */
    
    function getTwitterTile(col, row, topLeftOffset, gridSize) {
        return new T5.Tiling.ImageTile({
            userId: null
        });
    } // getTwitterTile
    
    function initGrid() {
        var dimensions = tiler.getDimensions(),
            halfWidth = Math.floor(TWEET_GRID_SIZE / 2);
        
        grid = new TweetTileGrid({
            emptyTile: emptyTile,
            panningTile: emptyTile,
            // imageOverlay: tileBorder,
            width: dimensions.width, 
            height: dimensions.height,
            center: new T5.Vector(halfWidth, halfWidth),
            tileDrawArgs: {
                background: emptyTile,
                offset: new T5.Vector(5, 5)
            }
        });
        
        grid.populate(getTwitterTile);
        
        tiler.setTileLayer(grid);
    } // initGrid
    
    function initTwitter() {
        twitter("#login").connectButton({ 
            size: "large",
            authComplete: function(user) {
                updateTimeline();
            }
        });

        if (twitter.isConnected()) {
            updateTimeline();
            
            // TODO: add a signout url
        }
        else {
        } // if..else
    } // initTwitter
    
    function processTweets(tweets) {
        if (tweets.length > 0) {
            lastTweetId = tweets[0].id;
        } // if
        
        // iterate through the tweets
        for (var ii = tweets.length; ii--; ) {
            // get the user id
            var userId = tweets[ii].attributes.user.id,
                userFound = assignedUsers[userId] || queuedKeys[userId];
            
            if (! userFound) {
                queuedUsers.push({
                    id: userId,
                    twitterData: tweets[ii].attributes.user
                });
                
                queuedKeys[userId] = true;
            } // if
        } // for
        
        tiler.repaint();
    } // processTweets
    
    function updateTimeline() {
        var requestParams = {
            count:200, 
            success: function(data) {
                processTweets(data.array);
                
                // TODO: remove this nasty global testing variable
                timelineData = data;
            },
            error: handleTwitterError
        };
        
        GRUNT.Log.info("user = ", twitter.currentUser.createdAt);
        
        if (lastTweetId) {
            requestParams.since_id = lastTweetId;
        } // if
        
        twitter.currentUser.homeTimeline(requestParams);
    } // updateTimeline
    
    /* event handlers */
    
    function handleTwitterError() {
        
    } // handleTwitterError
    
    $(document).ready(function() {
        twttr.anywhere.config("domain", document.domain);
        twttr.anywhere(function(t) {
            twitter = t;
            initTwitter();
        });
        
        tiler = new T5.Tiler({
            container: "usergrid",
            scalable: false
        });
    });
    
    T5.Resources.loadImage("/media/img/twitter-tile.png", function(image) {
        emptyTile = image;
        initGrid();
    });    
})();