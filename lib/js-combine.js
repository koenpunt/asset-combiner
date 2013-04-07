var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , CoffeeScript = require('coffee-script')
  , UglifyJS = require('uglify-js');


function JsCombine(filename, sources, options, callback) {
  var coffee_sources, js_sources, methods = [];

  this.filename = filename;
  this.options = options;
  this.output = [];
  this.errors = [];

  coffee_sources = sources.filter(function(source) {
    return /\.coffee$/.test(source);
  });
  js_sources = sources.filter(function(source) {
    return /\.js$/.test(source);
  });

  if (js_sources.length) {
    methods.push(function(callback){
      this.combineJs(js_sources, callback);
    }.bind(this));
  }

  if (coffee_sources.length) {
    methods.push(function(callback){
      this.compileCoffee(coffee_sources, callback);
    }.bind(this));
  }

  async.series(methods, function(){
    this.writeOut(filename, this.output.join('\n'));
    if(this.options.compress){
      this.minify();
    }
    callback && callback(this.errors.length ? this.errors : null);
  }.bind(this));
};

JsCombine.prototype = {
  compileCoffee: function(sources, callback) {
    var e, file_contents;

    sources.forEach(function(source){
      file_contents = fs.readFileSync(source) + "\n";
      try {
        this.output.push(CoffeeScript.compile(file_contents));
      } catch (e) {
        this.errors.push(CoffeeScript.helpers.prettyErrorMessage(e, source, file_contents, true));
      }
    }.bind(this));
    callback && callback();
  },

  combineJs: function(sources, callback) {
    sources.forEach(function(source){
      this.output.push(fs.readFileSync(source));
    }.bind(this));
    callback && callback();
  },

  minify: function() {
    var ast, compressor, output;

    try {
      ast = UglifyJS.parse(this.output.join('\n'), {filename: this.filename});
      ast.figure_out_scope();
      compressor = UglifyJS.Compressor({warnings: false});
      ast = ast.transform(compressor);
      ast.figure_out_scope();
      ast.compute_char_frequency();
      ast.mangle_names();
      output = ast.print_to_string({comments: /^(\*+)?\!/});
      this.writeOut(this.filename.replace(/\.js$/, '.min.js'), output);
    } catch (e) {
      this.errors.push(e);
    }
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

module.exports = JsCombine;