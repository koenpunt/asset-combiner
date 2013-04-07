var fs = require('fs')
  , path = require('path')
  , recess = require('recess')
  , less = require('less');

function CssCombine(filename, sources, options, callback) {
  this.filename = filename;
  this.options = options;
  this.errors = [];
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
        this.errors.push(less.formatError(err, {color: true}));
      }.bind(this));
    }
    if (!objs.length) {
      objs = [objs];
    }
    objs.forEach(function(obj){
      this.output = this.output.concat(obj.output);
    }.bind(this));

    this.writeOut(this.filename, this.output.join('\n'));
    if (options.compress) {
      this.minify();
    }
    callback && callback(this.errors.length ? this.errors : null);

  }.bind(this));
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
    console.log(('Wrote ' + filename).grey);
  }
};

module.exports = CssCombine;