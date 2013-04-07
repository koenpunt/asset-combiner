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
        this.errors.push(this.formatError(err, {color: true}));
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
  },
  
  formatError: function (ctx, options) {
      var message = "";
      var extract = ctx.extract;
      var error = [];

      options = options || {};

      if (options.silent) { return }

      if (!ctx.index) {
        return sys.error(ctx.stack || ctx.message);
      }

      if (typeof(extract[0]) === 'string') {
        error.push(((ctx.line - 1) + ' ' + extract[0]).grey);
      }

      error.push(ctx.line + ' ' + extract[1].slice(0, ctx.column)
                          + (extract[1][ctx.column].bold
                          + extract[1].slice(ctx.column + 1)).yellow);

      if (typeof(extract[2]) === 'string') {
        error.push(((ctx.line + 1) + ' ' + extract[2]).grey);
      }
      error = error.join('\n') + '\033[0m\n';

      message += ctx.message.red;
      ctx.filename && (message += ' in '.red + ctx.filename);
      
      message += '\n' + error;
      
      if (ctx.callLine) {
        message += '\nfrom '.red       + (ctx.filename || '');
        message += '\n' + ctx.callLine.grey + ' ' + ctx.callExtract;
      }
      return message
  }
};

module.exports = CssCombine;