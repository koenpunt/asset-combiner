var recess = require('recess')
  , less = require('less');

function CssCombine(filename, sources, callback) {
  var source, sourcesClone, _this, _i, _len;
  this.filename = filename;
  this.callback = callback;
  if (sources.length === 0) {
    return;
  }

  sourcesClone = [];
  for (_i = 0, _len = sources.length; _i < _len; _i++) {
    source = sources[_i];
    sourcesClone.unshift(source);
  }
  this.output = [];
  _this = this;
  recess(sourcesClone, {
    compile: true
  }, function(errs, objs) {
    var err, obj, _j, _k, _len1, _len2;

    if (errs) {
      if (!errs.length) {
        errs = [errs];
      }
      for (_j = 0, _len1 = errs.length; _j < _len1; _j++) {
        err = errs[_j];
        if (err) {
          less.writeError(err, {
            color: true
          });
        }
      }
    }
    if (!objs.length) {
      objs = [objs];
    }
    for (_k = 0, _len2 = objs.length; _k < _len2; _k++) {
      obj = objs[_k];
      _this.output = _this.output.concat(obj.output);
    }
    if (process.env.MINIFY !== 'false') {
      _this.minify();
    }
    callback && callback(null, _this.filename, _this.output.join('\n'));
  });
};

CssCombine.prototype.minify = function() {
  var css;

  css = require('ycssmin').cssmin(this.output.join(''));
  this.callback(null, this.filename.replace(/\.css$/, '.min.css'), css);
};

module.exports = CssCombine;