require "rubygems"
require "sprockets"

task :default => [:compile]

task :compile => [] do
  files = FileList.new
    .include("src/engines/*.js")
    .include("src/plugins/*.js")
    .include("src/plugins/controls/*.js")
    .include("src/plugins/layers/*.js")
    .include("src/style/*.js")
    .include("builds/*.js")
  
  files.each do |src|
    secretary = Sprockets::Secretary.new(
      :asset_root   => "dist",
      :load_path    => ["/development/projects/github/sidelab/", "/development/projects/github/", "builds", "lib"],
      :source_files => [src]
    )

    # Generate a Sprockets::Concatenation object from the source files
    concatenation = secretary.concatenation

    # Write the concatenation to disk
    concatenation.save_to("dist/%s" % src.sub(/.*?\//, ''))
  end
end

task :minify => [:compile] do
  basepath = 'dist'
  files = FileList.new
    .include("%s/*.js" % basepath)
    .exclude(/min\.js$/)
    .sub(basepath, '')
    .sub('.js', '')
    
  files.each do |src|
    sh "java -jar /development/tools/javascript/closure/compiler.jar \
           --compilation_level SIMPLE_OPTIMIZATIONS \
           --js_output_file dist/%s.min.js \
           --js dist/%s.js" % [src, src]
  end
end

task :docs => [] do
  sh "perl /development/projects/github/sidelab/joDoc/joDoc \
       --output dist/docs \
       --markdown /development/tools/perl/Markdown.pl \
       --smartypants /development/tools/perl/SmartyPants.pl \
       --title \"Tile5 API Documentation\" \
       --template docs/html/template.html \
       docs/ src/"
end