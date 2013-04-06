var fs = require('fs')
  , assert = require('assert')
  , AssetCombiner = require('../lib');


var assetCombiner = new AssetCombiner({
  assetPath: './test/fixtures',
  publicPath: './test/tmp',
  headerComment: "/**!\n * Copyright (c) " + (new Date().getFullYear()) + " Fetch! http://www.fetch.nl\n * This file is generated, manual edits eventually will be overwritten.\n */",
  javascripts: {
    'application.js': ['javascripts/script.js', 'javascripts/script.coffee']
  },
  stylesheets: {
    'application.css': ['stylesheets/sheet.css', 'stylesheets/sheet.less']
  },
  javascript_assets: {
    'public/javascripts/modernizr.js': ['app/assets/javascripts/lib/modernizr.js']
  },
  stylesheet_assets: {
    'public/stylesheets/assets.css': ['app/assets/stylesheets/normalize.css']
  }
});


assetCombiner.watch();