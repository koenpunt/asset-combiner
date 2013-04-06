var AssetCombiner = require('./asset-combiner');

module.exports = function(files, options) {
  return new AssetCombiner(files, options);
};


