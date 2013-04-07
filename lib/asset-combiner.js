var fs = require('fs')
  , path = require('path')
  , _ = require('underscore')
  , async = require('async')
  , colors = require('colors')
  , watch = require('node-watch')
  , glob = require('glob');

var CssCombine = require('./css-combine')
  , JsCombine = require('./js-combine');

function AssetCombiner(paths, options){
  this.paths = paths;
  this.errors = [];
  this.options = _.extend({
    assetPath: './app/assets',
    publicPath: './public',
    compress: true
  }, options);

  // Using queue for synchronous task processing
  this.queue = this.queue || async.queue(function (task, callback) {
    var args = [].slice.call(task.arguments);
    args.push(callback);
    AssetCombiner.prototype[task.name].apply(this, args);
  }.bind(this), 1);

  // Expose public API functions
  return {
    watch: function(){
      this.queue.push({name: 'watch', arguments: arguments});
    }.bind(this),
    build: function(){
      this.queue.push({name: 'build', arguments: arguments});
    }.bind(this)
 };
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
    var _this = this
      , sections = [].slice.call(arguments)
      , paths = this.paths
      , options = this.options
      , callback;

    if(typeof sections[sections.length-1] === 'function'){
      callback = sections.pop();
    }

    console.log("Building sections: ".blue + sections.join(', ').yellow);
    var methods = [];
    sections.forEach(function(section){
      paths[section].forEach(function(file){
        if(/\.js$/.test(file.output)){
          
          methods.push(function(callback){
            new JsCombine(file.output, expand_sources(options.assetPath, file.sources), _.extend({}, options, file.options), function(err){
              if(err){
                console.log(err.join('\n'));
                _this.errors = _this.errors.concat(err);
              }
              callback && callback();
            });
          });
        }

        if(/\.css$/.test(file.output)){
          methods.push(function(callback){
            new CssCombine(file.output, expand_sources(options.assetPath, file.sources), _.extend({}, options, file.options), function(err){
              if(err){
                console.log(err.join('\n'));
                _this.errors = _this.errors.concat(err);
              }
              callback && callback();
            });
          });
        }
      });
    });

    async.series(methods, function(){
      callback && callback();
    }.bind(this));
  }
};

module.exports = AssetCombiner;
