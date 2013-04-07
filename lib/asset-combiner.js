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

AssetCombiner.prototype = {
  
  constructor: AssetCombiner,
  
  watch: function(/*sections [, ..]*/){
    var sections = [].slice.call(arguments);

    console.log(("Watching " + this.options.assetPath + " for changes.. ").magenta);
    return watch(this.options.assetPath, function(file) {
      console.log(("Saw change in " + file + "\n" + (new Date)).green);
      this.build.apply(this, sections);
    }.bind(this));
  },

  build: function(/*sections [, ..]*/){
    var sections = [].slice.call(arguments)
      , files = this.files
      , options = this.options;

    console.log("Building sections: ".blue + sections.join(', ').yellow);

    sections.forEach(function(section){
      files[section].forEach(function(file){
        if(/\.js$/.test(file.output)){
          new JsCombine(file.output, expand_sources(options.assetPath, file.sources), _.extend({}, options, file.options), function(errors){
            if(errors)console.log(errors.join('\n'));
          });
        }

        if(/\.css$/.test(file.output)){
          new CssCombine(file.output, expand_sources(options.assetPath, file.sources), _.extend({}, options, file.options), function(errors){
            if(errors)console.log(errors.join('\n'));
          });
        }
      });
    });
  }
};

module.exports = AssetCombiner;
