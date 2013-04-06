var fs = require('fs')
  , assert = require('assert')
  , AssetCombiner = require('../lib');

var assetCombiner = new AssetCombiner({
  main: [{
    output: 'application.js',
    sources: ['javascripts/script.js', 'javascripts/script.coffee']
  }, {
    output: 'application.css',
    sources: ['stylesheets/sheet.css', 'stylesheets/sheet.less']
  }],
  assets: [{
    output: 'modernizr.js',
    sources: ['javascripts/modernizr.js']
  }]
}, {
  assetPath: './test/fixtures',
  publicPath: './test/tmp',
  headerComment: function(filename){
    return [
      "/**!",
      " * Copyright (c) " + (new Date().getFullYear()) + " Fetch! http://www.fetch.nl",
      " * This file is generated, manual edits eventually will be overwritten.",
      " */"].join("\n");
  }
});


assetCombiner.build('assets', 'main');
assetCombiner.watch('main');