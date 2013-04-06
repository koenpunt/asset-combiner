var recess = require('recess')
  , less = require('less');

function CssCombine(filename, sources, callback) {
  var _this = this;
  this.filename = filename;
  this.callback = callback;
  if (sources.length === 0) {
    return;
  }
  this.output = [];
  recess(sources.reverse(), {
    compile: true
  }, function(errs, objs) {
    if (errs) {
      if (!errs.length) {
        errs = [errs];
      }
      
      errs.forEach(function(err){
        less.writeError(err, {
          color: true
        });
      });
    }
    if (!objs.length) {
      objs = [objs];
    }
    objs.forEach(function(obj){
      _this.output = _this.output.concat(obj.output);
    });
    if (process.env.MINIFY !== 'false') {
      _this.minify();
    }
    callback && callback(null, _this.filename, _this.output.join('\n'));
  });
};

CssCombine.prototype.minify = function() {
  var css = require('ycssmin').cssmin(this.output.join(''));
  this.callback(null, this.filename.replace(/\.css$/, '.min.css'), css);
};

module.exports = CssCombine;