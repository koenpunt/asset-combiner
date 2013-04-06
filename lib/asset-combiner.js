var fs = require('fs')
  , path = require('path')
  , colors = require('colors')
  , watch = require('node-watch')
  , glob = require('glob');

var CssCombine = require('./css-combine')
  , JsCombine = require('./js-combine');

function AssetCombiner(options){
  this.options = options;
}

function expand_sources(asset_path, sources) {
  var expanded_sources = [];
  sources.forEach(function(source){
    expanded_sources = expanded_sources.concat(glob.sync(path.join(asset_path, source)));
  });
  return expanded_sources;
}

function write_file(public_path, filename, body, comment_header) {
  if (comment_header) {
    body = comment_header + "\n" + body;
  }
  fs.writeFileSync(path.join(public_path, filename), body);
};

AssetCombiner.prototype = {
  
  constructor: AssetCombiner,
  
  watch: function(){
    var _this = this;
    console.log(("Watching " + this.options.assetPath + " for changes..").blue);
    this.build();
    return watch(this.options.assetPath, function(file) {
      if (!/\/\._/.test(file)) {
        console.log(("Saw change in " + file + "\n" + (new Date)).yellow);
        _this.build();
      }
    });
  },

  build: function(){
    var options = this.options
      , javascripts = options.javascripts
      , stylesheets = options.stylesheets
      , javascript, stylesheet, sources;
      
    for (javascript in javascripts){
      sources = expand_sources(options.assetPath, javascripts[javascript]);
      new JsCombine(javascript, sources, function(err, filename, data) {
        if (err) {
          throw err;
        }
        write_file(options.publicPath, filename, data, options.headerComment);
      });
    }
    
    for (stylesheet in stylesheets) {
      sources = expand_sources(options.assetPath, stylesheets[stylesheet]);
      new CssCombine(stylesheet, sources, function(err, filename, data) {
        if (err) {
          throw err;
        }
        write_file(options.publicPath, filename, data, options.headerComment);
      });
    }
  },

  build_assets: function(){
    var options = this.options
      , javascripts = options.javascript_assets
      , stylesheets = options.stylesheet_assets
      , javascript, stylesheet, sources;
      
    for (javascript in javascripts){
      sources = expand_sources(options.assetPath, javascripts[javascript]);
      new JsCombine(javascript, sources, function(err, filename, data) {
        if (err) {
          throw err;
        }
        write_file(options.publicPath, filename, data, options.headerComment);
      });
    }
    
    for (stylesheet in stylesheets) {
      sources = expand_sources(options.assetPath, stylesheets[stylesheet]);
      new CssCombine(stylesheet, sources, function(err, filename, data) {
        if (err) {
          throw err;
        }
        write_file(options.publicPath, filename, data, options.headerComment);
      });
    }
  }
};

module.exports = AssetCombiner;
