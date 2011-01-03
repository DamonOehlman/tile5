/**
Easing functions

sourced from Robert Penner's excellent work:
http://www.robertpenner.com/easing/

Functions follow the function format of fn(t, b, c, d, s) where:
- t = time
- b = beginning position
- c = change
- d = duration
*/
var backAnimationS = 1.70158;

function simpleTypeName(typeName) {
    return typeName.replace(/[\-\_\s\.]/g, '').toLowerCase();
} // simpleTypeName

var easingFns = {
    linear: function(t, b, c, d) {
        return c*t/d + b;
    },
    
    /* back easing functions */
    
    backin: function(t, b, c, d) {
        return c*(t/=d)*t*((backAnimationS+1)*t - backAnimationS) + b;
    },
        
    backout: function(t, b, c, d) {
        return c*((t=t/d-1)*t*((backAnimationS+1)*t + backAnimationS) + 1) + b;
    },
        
    backinout: function(t, b, c, d) {
        return ((t/=d/2)<1) ? c/2*(t*t*(((backAnimationS*=(1.525))+1)*t-backAnimationS))+b : c/2*((t-=2)*t*(((backAnimationS*=(1.525))+1)*t+backAnimationS)+2)+b;
    }, 
    
    /* bounce easing functions */
    
    bouncein: function(t, b, c, d) {
        return c - easingFns.bounceout(d-t, 0, c, d) + b;
    },
    
    bounceout: function(t, b, c, d) {
        if ((t/=d) < (1/2.75)) {
            return c*(7.5625*t*t) + b;
        } else if (t < (2/2.75)) {
            return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
        } else if (t < (2.5/2.75)) {
            return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
        } else {
            return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
        }
    },
        
    bounceinout: function(t, b, c, d) {
        if (t < d/2) return easingFns.bouncein(t*2, 0, c, d) / 2 + b;
        else return easingFns.bounceout(t*2-d, 0, c, d) / 2 + c/2 + b;
    },
    
    /* cubic easing functions */
    
    cubicin: function(t, b, c, d) {
        return c*(t/=d)*t*t + b;
    },
        
    cubicout: function(t, b, c, d) {
        return c*((t=t/d-1)*t*t + 1) + b;
    },
    
    cubicinout: function(t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t + b;
        return c/2*((t-=2)*t*t + 2) + b;
    },
    
    /* elastic easing functions */
    
    elasticin: function(t, b, c, d, a, p) {
        var s;
        
        if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
        if (!a || a < abs(c)) { a=c; s=p/4; }
        else s = p/TWO_PI * asin (c/a);
        return -(a*pow(2,10*(t-=1)) * sin( (t*d-s)*TWO_PI/p )) + b;
    },
    
    elasticout: function(t, b, c, d, a, p) {
        var s;
        
        if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
        if (!a || a < abs(c)) { a=c; s=p/4; }
        else s = p/TWO_PI * asin (c/a);
        return (a*pow(2,-10*t) * sin( (t*d-s)*TWO_PI/p ) + c + b);
    },
    
    elasticinout: function(t, b, c, d, a, p) {
        var s;
        
        if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
        if (!a || a < abs(c)) { a=c; s=p/4; }
        else s = p/TWO_PI * asin (c/a);
        if (t < 1) return -0.5*(a*pow(2,10*(t-=1)) * sin( (t*d-s)*TWO_PI/p )) + b;
        return a*pow(2,-10*(t-=1)) * sin( (t*d-s)*TWO_PI/p )*0.5 + c + b;
    },
    
    /* quad easing */
    
    quadin: function(t, b, c, d) {
        return c*(t/=d)*t + b;
    },
        
    quadout: function(t, b, c, d) {
        return -c *(t/=d)*(t-2) + b;
    },
    
    quadinout: function(t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b;
        return -c/2 * ((--t)*(t-2) - 1) + b;
    },
    
    /* sine easing */
    
    sinein: function(t, b, c, d) {
        return -c * cos(t/d * HALF_PI) + c + b;
    },
    
    sineout: function(t, b, c, d) {
        return c * sin(t/d * HALF_PI) + b;
    },
    
    sineinout: function(t, b, c, d) {
        return -c/2 * (cos(Math.PI*t/d) - 1) + b;
    }
};

function easing(typeName) {
    return easingFns[simpleTypeName(typeName)];
} // easing

function registerEasingType(typeName, callback) {
    easingFns[simpleTypeName(typeName)] = callback;
} // registerEasingType
