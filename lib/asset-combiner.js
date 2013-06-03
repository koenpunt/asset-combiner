var fs = require('fs')
  , path = require('path')
  , _ = require('underscore')
  , async = require('async')
  , colors = require('colors')
  , watch = require('node-watch')
  , glob = require('glob');

var CssCombine = require('./css-combine')
  , JsCombine = require('./js-combine')
  , Queue = require('./queue');

function AssetCombiner(options_or_paths, options){
  this.paths = options ? options_or_paths : [];
  this.errors = [];
  this.options = _.extend({
    assetPath: './app/assets',
    publicPath: './public',
    compress: true
  }, options ? options : options_or_paths);

  // Using queue for synchronous task processing
  this.queue = this.queue || new Queue(function (task, callback) {
    var args = [].slice.call(task.arguments), userCallback = function(){};
    if(typeof args[args.length-1] === 'function'){
      userCallback = args.pop();
    }
    args.push(function(){
      callback.apply(this, arguments);
      userCallback.apply(this, arguments);
    });
    AssetCombiner.prototype[task.name].apply(this, args);
  }.bind(this));

  // Expose public API functions
  return {
    watch: function(){
      this.queue.push({name: 'watch', arguments: arguments});
    }.bind(this),
    build: function(){
      this.queue.push({name: 'build', arguments: arguments});
    }.bind(this),
    addSection: function(section, paths){
      this.paths[section] = paths;
      return this;
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
    var methods = [], files, sources;
    sections.forEach(function(section){
      files = paths[section];
      
      for(var file in files){
        sources = files[file];
        // Needs closure to not lose scope to sources
        (function(file, sources){
          if(/\.js$/.test(file)){
            methods.push(function(callback){
              new JsCombine(file, expand_sources(options.assetPath, sources), options, function(err){
                if(err){
                  console.log(err.join('\n'));
                  _this.errors = _this.errors.concat(err);
                }
                callback && callback();
              });
            });
          }

          if(/\.css$/.test(file)){
            methods.push(function(callback){
              new CssCombine(file, expand_sources(options.assetPath, sources), options, function(err){
                if(err){
                  console.log(err.join('\n'));
                  _this.errors = _this.errors.concat(err);
                }
                callback && callback();
              });
            });
          }
        }).call(this, file, sources);
      };
    });

    async.series(methods, function(){
      callback && callback();
    }.bind(this));
  }
};

module.exports = AssetCombiner;
