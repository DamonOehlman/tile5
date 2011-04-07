module('T5.XYRect');

test('T5.XYRect.init', function() {
    var rect = T5.XYRect.init(10, 20, 30, 40);
    
    expect(6);
    equals(rect.x, 10, 'x value correct');
    equals(rect.y, 20, 'y value correct');
    equals(rect.x2, 30, 'x2 value correct');
    equals(rect.y2, 40, 'y2 value correct');
    equals(rect.w, 20, 'width value correct');
    equals(rect.h, 20, 'height value correct');
});

test('T5.XYRect.init [empty params]', function() {
   var rect = T5.XYRect.init();

   expect(6);
   equals(rect.x, 0, 'x value correct');
   equals(rect.y, 0, 'y value correct');
   equals(rect.x2, 0, 'x2 value correct');
   equals(rect.y2, 0, 'y2 value correct');
   equals(rect.w, 0, 'width value correct');
   equals(rect.h, 0, 'height value correct');
});