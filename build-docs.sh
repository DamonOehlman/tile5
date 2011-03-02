JODOC_PATH=/development/projects/github/sidelab/joDoc
JODOC_DEPS_PATH=/development/tools/perl

perl $JODOC_PATH/joDoc \
     --output dist/docs \
     --markdown $JODOC_DEPS_PATH/Markdown.pl \
     --smartypants $JODOC_DEPS_PATH/SmartyPants.pl \
     --title "Tile5 API Documentation" \
     --template docs/html/template.html \
     docs/ src/js