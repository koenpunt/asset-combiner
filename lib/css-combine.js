var fs = require('fs')
  , path = require('path')
  , recess = require('recess')
  , less = require('less');

function CssCombine(filename, sources, options) {
  var _this = this;
  this.filename = filename;
  this.options = options;
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
    if (options.compress) {
      _this.minify();
    }
    _this.writeOut(_this.filename, _this.output.join('\n'));
  });
};

CssCombine.prototype = {
  minify: function() {
    var css = require('ycssmin').cssmin(this.output.join(''));
    this.writeOut(this.filename.replace(/\.css$/, '.min.css'), css);
  },
  
  writeOut: function(filename, body){
    if (this.options.headerComment) {
      var headerComment = this.options.headerComment;
      if(typeof headerComment == 'function'){
        headerComment = headerComment(filename);
      }
      body = headerComment + "\n" + body;
    }
    fs.writeFileSync(path.join(this.options.publicPath, filename), body);
    console.log((' Wrote ' + filename).grey);
  }
};

module.exports = CssCombine;