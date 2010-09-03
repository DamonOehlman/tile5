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
T5.Easing = (function() {
    var s = 1.70158;
    
    return {
        Linear: function(t, b, c, d) {
            return c*t/d + b;
        },
        
        Back: {
            In: function(t, b, c, d) {
                return c*(t/=d)*t*((s+1)*t - s) + b;
            },
            
            Out: function(t, b, c, d) {
                return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
            },
            
            InOut: function(t, b, c, d) {
                return ((t/=d/2)<1) ? c/2*(t*t*(((s*=(1.525))+1)*t-s))+b : c/2*((t-=2)*t*(((s*=(1.525))+1)*t+s)+2)+b;
            }
        },
        
        Bounce: {
            In: function(t, b, c, d) {
                return c - module.Easing.Bounce.Out(d-t, 0, c, d) + b;
            },
            
            Out: function(t, b, c, d) {
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
            
            InOut: function(t, b, c, d) {
                if (t < d/2) return module.Easing.Bounce.In(t*2, 0, c, d) / 2 + b;
                else return module.Easing.Bounce.Out(t*2-d, 0, c, d) / 2 + c/2 + b;
            }
        },
        
        Cubic: {
            In: function(t, b, c, d) {
                return c*(t/=d)*t*t + b;
            },
            
            Out: function(t, b, c, d) {
                return c*((t=t/d-1)*t*t + 1) + b;
            },
            
            InOut: function(t, b, c, d) {
                if ((t/=d/2) < 1) return c/2*t*t*t + b;
                return c/2*((t-=2)*t*t + 2) + b;
            }
        },
        
        Elastic: {
            In: function(t, b, c, d, a, p) {
                var s;
                
                if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
                if (!a || a < Math.abs(c)) { a=c; s=p/4; }
                else s = p/(2*Math.PI) * Math.asin (c/a);
                return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
            },
            
            Out: function(t, b, c, d, a, p) {
                var s;
                
                if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
                if (!a || a < Math.abs(c)) { a=c; s=p/4; }
                else s = p/(2*Math.PI) * Math.asin (c/a);
                return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
            },
            
            InOut: function(t, b, c, d, a, p) {
                var s;
                
                if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
                if (!a || a < Math.abs(c)) { a=c; s=p/4; }
                else s = p/(2*Math.PI) * Math.asin (c/a);
                if (t < 1) return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
                return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
            }
        },
        
        Quad: {
            In: function(t, b, c, d) {
                return c*(t/=d)*t + b;
            },
            
            Out: function(t, b, c, d) {
                return -c *(t/=d)*(t-2) + b;
            },
            
            InOut: function(t, b, c, d) {
                if ((t/=d/2) < 1) return c/2*t*t + b;
                return -c/2 * ((--t)*(t-2) - 1) + b;
            }
        },
        
        Sine: {
            In: function(t, b, c, d) {
                return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
            },
            
            Out: function(t, b, c, d) {
                return c * Math.sin(t/d * (Math.PI/2)) + b;
            },
            
            InOut: function(t, b, c, d) {
                return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
            }
        }
    };
})();
