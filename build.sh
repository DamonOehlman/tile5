SPROCKET_OPTS="-I build -I lib -I /development/projects/github/sidelab/"
MINIFY=$1
PLUGINS="renderer.dom \
renderer.raphael \
renderer.webgl \
renderer.three \
clusterer"

: ${MINIFY:=false}

echo "Building Tile5"

# sprocketize the source
sprocketize $SPROCKET_OPTS src/tile5.js > dist/tile5.js

# minify
if $MINIFY; then
    java -jar build/google-compiler-20100629.jar \
         --compilation_level SIMPLE_OPTIMIZATIONS \
         --js_output_file dist/tile5.min.js \
         --js dist/tile5.js
fi;

for plugin in $PLUGINS
do
    echo "Building Tile5 Plugin: $plugin"
    
    # sprocketize the source
    sprocketize $SPROCKET_OPTS src/js/plugins/$plugin.js > dist/plugins/$plugin.js
    
    # minify
    if $MINIFY; then
        java -jar build/google-compiler-20100629.jar \
             --compilation_level SIMPLE_OPTIMIZATIONS \
             --js_output_file dist/plugins/$plugin.min.js \
             --js dist/plugins/$plugin.js
    fi;
done;

# copy the engines across
# TODO: minify the engines
cp src/js/geo/engines/*.js dist/geo/

# copy the styles across
cp src/style/* dist/style/