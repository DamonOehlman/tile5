/**
# T5.Arc
*/
var Arc = function(origin, params) {
   params = COG.extend({
       size: 4
   }, params);
   
   // iniitialise variables
   var drawXY = XY.init();
   
   // initialise _self
   var _self = COG.extend(params, {
       /**
       ### draw(context, offsetX, offsetY, width, height, state)
       */
       draw: function(context, offsetX, offsetY, width, height, state) {
           context.beginPath();
           context.arc(
               drawXY.x, 
               drawXY.y, 
               _self.size,
               0,
               Math.PI * 2,
               false);
               
           context.fill();
           context.stroke();
       },
       
       /**
       ### resync(view)
       */
       resync: function(view) {
           var centerXY = view.syncXY([origin]).origin;
           drawXY = XY.floor([origin])[0];
       }
   });
   
   COG.info('created arc = ', origin);
   return _self;
};