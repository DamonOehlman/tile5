SPROCKET_OPTS="-I build -I /development/projects/github/sidelab/"
MINIFY=$1

: ${MINIFY:=false}

for variant in lite geo
do
    echo "Building Tile5 Variant: $variant"
    
    # copy the variant specify options to the options file
    cp src/tile5.$variant.js src/tile5.variant.js
    
    # sprocketize the source
    sprocketize $SPROCKET_OPTS src/tile5.js > dist/tile5.$variant.js

    # minify
    if $MINIFY; then
        java -jar build/google-compiler-20100629.jar \
             --compilation_level SIMPLE_OPTIMIZATIONS \
             --js_output_file dist/tile5.$variant.min.js \
             --js dist/tile5.$variant.js
    fi;
         
    # delete the opts file
    rm src/tile5.variant.js
done;

# the main variant is the geo variant so copy that to tile5.js
cp dist/tile5.geo.js dist/tile5.js
cp dist/tile5.geo.min.js dist/tile5.min.js