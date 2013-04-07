var fs = require('fs')
  , assert = require('assert')
  , AssetCombiner = require('../lib');

var assetCombiner = new AssetCombiner({
  main: {
    'application.js': ['javascripts/script.js', 'javascripts/script.coffee'],
    'application.css': ['stylesheets/sheet.css', 'stylesheets/sheet.less']
  },
  assets: {
    'modernizr.js': ['javascripts/modernizr.js']
  }
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
