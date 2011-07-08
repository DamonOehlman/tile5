/**
DRAWABLE

## Constructor
`new T5.Drawable(view, layer, params);`

## Settings
- 
*/
var Drawable = function(view, layer, params) {
    params = _extend({
        style: null,
        xy: null,
        size: 20,
        fill: false,
        stroke: true,
        draggable: false,
        properties: {},
        typeName: 'Shape',
        zindex: 0
    }, params);
    
    // copy the parameters to this
    _extend(this, params);
    
    // if the xy is a string, then parse it
    if (_is(this.xy, typeString)) {
        this.xy = new view.XY(this.xy);
    } // if
    
    // initialise the id
    this.id = 'drawable_' + drawableCounter++;
    this.bounds = null;
    this.view = view;
    this.layer = layer;
    
    // tween params
    this.tweens = [];
    
    // initialise transform variables
    this.animations = 0;
    this.rotation = 0;
    this.scaling = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.visible = true;
    
    // make the shape observable
    _observable(this);
};

Drawable.prototype = {
    constructor: Drawable,
    
    /**
    ### applyTweens()
    */
    applyTweens: function() {
        for (var ii = this.tweens.length; ii--; ) {
            this.tweens[ii]();
        } // for
    },
    
    /**
    ### drag(dragData, dragX, dragY, drop)
    */
    drag: null,
    
    /**
    ### draw(renderer, drawData)
    The draw method is provided for custom drawables. Internal drawables will delegate
    their drawing to the function that is returned from the various prep* methods of the
    renderer, however, when building some applications this really isn't suitable and
    more is required.  Thus if required a custom draw method can be implemented to implement
    the required functionality.
    */
    draw: null,

    /**
    ### getProps(renderer)
    Get the drawable item properties that will be passed to the renderer during
    the prepare and draw phase
    */
    getProps: null,
    
    /**
    ### resync(view)
    */
    resync: function() {
        if (this.xy) {
            this.xy.sync(this.view);
            
            // if we have a size, update the bounds
            if (this.size) {
                var halfSize = this.size >> 1;

                this.updateBounds(new Rect(
                    this.xy.x - halfSize,
                    this.xy.y - halfSize,
                    this.size,
                    this.size));
            } // if
        } // if
        
        return this;
    },
    
    /**
    ### rotate(value, tween, isAbsolute)
    */
    rotate: function(value, tween, isAbsolute) {
        if (_is(value, typeNumber)) {
            // by default rotation is relative
            var targetVal = (isAbsolute ? value : this.rotation * RADIANS_TO_DEGREES + value) * DEGREES_TO_RADIANS;
            
            if (tween) {
                this.tweens.push(Tweener.tweenDrawable(
                    this, 
                    'rotation', 
                    this.rotation, 
                    targetVal, 
                    tween
                ));
            }
            else {
                this.rotation = targetVal;
                this.view.invalidate();
            } // if..else
            
            return this;
        }
        else {
            return this.rotation * RADIANS_TO_DEGREES;
        } // if..else
    },
    
    /**
    ### scale(value, tween, isAbsolute)
    */
    scale: function(value, tween, isAbsolute) {
        if (_is(value, typeNumber)) {
            // by default rotation is relative
            var targetVal = (isAbsolute ? value : this.scaling * value);
            
            if (tween) {
                this.tweens.push(Tweener.tweenDrawable(
                    this, 
                    'scaling', 
                    this.scaling, 
                    targetVal, 
                    tween
                ));
            }
            else {
                this.scaling = targetVal;
                this.view.invalidate();
            } // if..else
            
            return this;
        }
        else {
            return this.scaling;
        }
    },
    
    /**
    ### translate(x, y, tween, isAbsolute)
    */
    translate: function(x, y, tween, isAbsolute) {
        if (_is(x, typeNumber)) {
            var targetX = isAbsolute ? x : this.translateX + x,
                targetY = isAbsolute ? y : this.translateY + y;
            
            if (tween) {
                this.tweens.push(Tweener.tweenDrawable(
                    this, 
                    'translateX', 
                    this.translateX, 
                    targetX, 
                    tween
                ));

                this.tweens.push(Tweener.tweenDrawable(
                    this, 
                    'translateY', 
                    this.translateY, 
                    targetY, 
                    tween
                ));
            }
            else {
                this.translateX = targetX;
                this.translateY = targetY;
                this.view.invalidate();
            } // if..else
            
            return this;
        }
        else {
            return new XY(this.translateX, this.translateY);
        } // if..else
    },
    
    
    /**
    ### updateBounds(bounds: XYRect, updateXY: boolean)
    */
    updateBounds: function(bounds, updateXY) {
        var moved = bounds && (
                (! this.bounds) ||
                bounds.x != this.bounds.x ||
                bounds.y != this.bounds.y
            );
        
        if (moved) {
            this.trigger('move', this, bounds, this.bounds);
        } // if
        
        // update the bounds
        this.bounds = bounds;
        
        if (updateXY) {
            this.xy = this.bounds.center();
        } // if
    }
};