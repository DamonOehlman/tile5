// some base64 images
var LOCATOR_IMAGE = 
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA' +
'BHNCSVQICAgIfAhkiAAAAAlwSFlzAAACIQAAAiEBPhEQkwAAABl0RVh0U29mdHdhcmUAd3' +
'd3Lmlua3NjYXBlLm9yZ5vuPBoAAAG+SURBVCiRlZHNahNRAIW/O7mTTJPahLZBA1YUyriI' +
'NRAE3bQIKm40m8K8gLj0CRQkO32ELHUlKbgoIu4EqeJPgtCaoBuNtjXt5LeTMZk0mbmuWi' +
'uuPLsD3+HAOUIpxf9IHjWmaUbEyWv5ROrsVULhcHP761rUfnN3Y2Otc8CIg4YT85lzuVsP' +
'P+Qupw1vpPjRCvhS9ymvV0e77x7nNj+uvADQAIQQ+uLyvdfLV9JGZi7EdEwQlqBpEJ019f' +
'0z1mo2u5Q8DMydv25lshemmj1FueZTawbs7inarqLbV7Qjab1upB9YlhWSAHLavLHZCvg1' +
'VEhN0PMU9W7At4bPVidg7CtkLLXkut+lBPD6/Ub155jJiADAHSpaLmx3ApyBQoYEUd0PBo' +
'OBkAC6+3llvda/YxgGgYL+UNHf/zN3KiExGlsvTdP0NYDkhPdWrz35ZDsBzV5wCMuQwEyF' +
'mXFeeadjzfuFQmGkAZRKpdGC/n7x+M6jqvA9Zo6FWDhlcHE+wqT93J1tP7vpOE7rrx8ALM' +
'uasPf8S12St4WmJ6bYWTUC52k8Hm8Vi0X/nwBAPp/XKpWKdF1X2LYdlMvlsToC/QYTls7D' +
'LFr/PAAAAABJRU5ErkJggg%3D%3D';

/**
# T5.Geo.LocationOverlay

*/
var LocationOverlay = exports.LocationOverlay = function(params) {
    params = COG.extend({
        pos: null,
        accuracy: null,
        zindex: 90
    }, params);
    
    // initialise the locator icon image
    var iconImage = new Image(),
        iconOffset = T5.XY.init(),
        centerXY = T5.XY.init(),
        indicatorRadius = null;
        
    // load the image
    iconImage.src = LOCATOR_IMAGE;
    iconImage.onload = function() {
        iconOffset = T5.XY.init(
            iconImage.width / 2, 
            iconImage.height / 2);
    };
    
    var self = COG.extend(new T5.ViewLayer(params), {
        pos: params.pos,
        accuracy: params.accuracy,
        drawAccuracyIndicator: false,
        
        draw: function(context, offset, dimensions, state, view) {
            var centerX = centerXY.x - offset.x,
                centerY = centerXY.y - offset.y;

            if (indicatorRadius) {
                context.fillStyle = 'rgba(30, 30, 30, 0.2)';
                
                context.beginPath();
                context.arc(
                    centerX, 
                    centerY, 
                    indicatorRadius, 
                    0, 
                    Math.PI * 2, 
                    false);
                context.fill();
            } // if

            if (iconImage.complete && iconImage.width > 0) {
                context.drawImage(
                    iconImage, 
                    centerX - iconOffset.x, 
                    centerY - iconOffset.y, 
                    iconImage.width, 
                    iconImage.height);
            } // if
            
            self.changed();
        },
        
        update: function(grid) {
            if (grid) {
                indicatorRadius = Math.floor(grid.getPixelDistance(self.accuracy) * 0.5);
                centerXY = grid.getGridXYForPosition(self.pos);
                
                self.changed();
            } // if
        }
    });
    
    self.bind('gridUpdate', function(evt, grid) {
        self.update(grid);
    });
    
    return self;
};