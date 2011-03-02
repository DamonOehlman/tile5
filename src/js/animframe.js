// ANIMATION LOOP BINDING
// taken from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.animFrame = (function() {
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(callback){
                setTimeout(function() {
                    window.callback(new Date().getTime());
                }, 1000 / 60);
            };
})();