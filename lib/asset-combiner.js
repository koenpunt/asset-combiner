var fs = require('fs')
  , path = require('path')
  , _ = require('underscore')
  , colors = require('colors')
  , watch = require('node-watch')
  , glob = require('glob');

var CssCombine = require('./css-combine')
  , JsCombine = require('./js-combine');

function AssetCombiner(files, options){
  
  
  this.files = files;
  this.options = _.extend({
    compress: true
  }, options);
}

function expand_sources(asset_path, sources) {
  var expanded_sources = [];
  sources.forEach(function(source){
    expanded_sources = expanded_sources.concat(glob.sync(path.join(asset_path, source)));
  });
  return expanded_sources;
}

function header_comment(filename, header_comment){
  if(typeof header_comment == 'function'){
    return header_comment(filename);
  }
  return header_comment;
}

function write_file(public_path, filename, body, comment_header) {
  if (comment_header) {
    body = comment_header + "\n" + body;
  }
  fs.writeFileSync(path.join(public_path, filename), body);
  console.log((' Wrote ' + filename).grey);
};

AssetCombiner.prototype = {
  
  constructor: AssetCombiner,
  
  watch: function(/*sections [, ..]*/){
    var _this = this
      , sections = [].slice.call(arguments);

    console.log(("Watching " + this.options.assetPath + " for changes.. ").magenta);
    return watch(this.options.assetPath, function(file) {
      console.log(("Saw change in " + file + "\n" + (new Date)).green);
      _this.build.apply(_this, sections);
    });
  },

  build: function(/*sections [, ..]*/){
    var sections = [].slice.call(arguments)
      , files = this.files
      , options = this.options;

    console.log("Building sections: ".blue + sections.join(', ').yellow);

    sections.forEach(function(section){
      files[section].forEach(function(file){
        if(/\.js$/.test(file.output)){
          new JsCombine(file.output, expand_sources(options.assetPath, file.sources), function(err, filename, data) {
            if(err) throw err;
            write_file(options.publicPath, filename, data, header_comment(filename, options.headerComment));
          });
        }

        if(/\.css$/.test(file.output)){
          new CssCombine(file.output, expand_sources(options.assetPath, file.sources), _.extend({}, options, file.options));
        }
      });
    });
  }
};

module.exports = AssetCombiner;
