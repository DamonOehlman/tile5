var interleave = require('interleave'),
    fs = require('fs'),
    config = {
        aliases: {
            geojs: 'github://DamonOehlman/geojs/lib/$1',
            cog: 'github://sidelab/cog/cogs/$1',
            interact: 'github://DamonOehlman/interact/$1',
            timelord: 'github://sidelab/DamonOehlman/timelord',
            colorparser: 'lib/colorparser',
            glMatrix: 'gcode://glmatrix/hg/glMatrix'
        }
    };

// build each of the builds
interleave('builds', {
    multi: 'pass',
    path: 'dist',
    config: config
});

fs.readdir('src/plugins', function(err, files) {
    var buildFiles = files.map(function(file) { return 'src/plugins/' + file; });
    
    interleave(buildFiles, {
        multi: 'pass',
        path: 'dist/plugins',
        config: config
    });
});

interleave('src/style', {
    multi: 'pass',
    path: 'dist/style',
    config: config
});
