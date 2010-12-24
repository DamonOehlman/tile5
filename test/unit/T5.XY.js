module('T5.XY');

test('T5.XY.init', function() {
    var xy = T5.XY.init(10, 20);
    
    expect(2);
    equals(xy.x, 10, 'x value correct');
    equals(xy.y, 20, 'y value correct');
});

test('T5.XY.init [empty params]', function() {
   var xy = T5.XY.init();

   expect(2);
   equals(xy.x, 0, 'x value 0');
   equals(xy.y, 0, 'y value 0'); 
});

test('T5.XY.equals', function() {
    var xy1 = T5.XY.init(10, 20),
        xy2 = T5.XY.init(10, 20);
        
    ok(T5.XY.equals(xy1, xy1), 'XY composites match');
});

test('T5.XY.add', function() {
    var xy = T5.XY.add(T5.XY.init(), T5.XY.init(10, 20));

    equals(xy.x, 10, 'x value ok');
    equals(xy.y, 20, 'y value ok');
});