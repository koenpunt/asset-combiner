var fs = require('fs')
  , CoffeeScript = require('coffee-script')
  , UglifyJS = require('uglify-js');


function JsCombine(filename, sources, callback) {
  var coffee_sources, js_sources
    , _this = this;

  this.callback = callback;
  this.filename = filename;
  this.source = '';

  coffee_sources = sources.filter(function(source) {
    return /\.coffee$/.test(source);
  });
  js_sources = sources.filter(function(source) {
    return /\.js$/.test(source);
  });
  if (js_sources.length) {
    this.combineJs(js_sources, function() {
      if (coffee_sources.length) {
        return _this.compileCoffee(coffee_sources, function() {
          return _this.writeOut();
        });
      } else {
        return _this.writeOut();
      }
    });
  } else if (coffee_sources.length) {
    this.compileCoffee(coffee_sources, function() {
      return _this.writeOut();
    });
  }
};

JsCombine.prototype = {
  compileCoffee: function(sources, callback) {
    var e, file_contents, source, _i, _len;

    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      source = sources[_i];
      file_contents = "" + (fs.readFileSync(source)) + "\n";
      try {
        this.source += CoffeeScript.compile(file_contents);
      } catch (_error) {
        e = _error;
        this.print_coffee_error(e, source, file_contents);
      }
    }
    return callback && callback();
  },

  combineJs: function(sources, callback) {
    var file_contents, source, _i, _len;

    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      source = sources[_i];
      file_contents = "" + (fs.readFileSync(source));
      this.source += "" + file_contents + "\n";
    }
    return callback && callback();
  },

  writeOut: function() {
    this.callback(null, this.filename, this.source);
    if (process.env.MINIFY !== 'false') {
      return this.minify();
    }
  },

  minify: function() {
    var ast, compressor, e, orig_code, output;

    orig_code = this.source;
    try {
      ast = UglifyJS.parse(orig_code, {filename: this.filename});
      ast.figure_out_scope();
      compressor = UglifyJS.Compressor({warnings: false});
      ast = ast.transform(compressor);
      ast.figure_out_scope();
      ast.compute_char_frequency();
      ast.mangle_names();
      output = ast.print_to_string({comments: /^(\*+)?\!/});
      this.callback && this.callback(null, this.filename.replace(/\.js$/, '.min.js'), output);
    } catch (e) {
      this.callback && this.callback(e, this.filename, orig_code);
    }
  },

  print_coffee_error: function(error, file_name, file_contents) {
    var contents_lines, first, index, last, line, line_number, _i, _len, _ref, _results;

    line = error.message.match(/line ([0-9]+):/);
    if (line && line[1] && (line = parseInt(line[1]))) {
      contents_lines = file_contents.split("\n");
      first = line - 4 < 0 ? 0 : line - 4;
      last = line + 3 > contents_lines.size ? contents_lines.size : line + 3;
      console.error("Error compiling " + file_name + " \n" + error.message);
      index = 0;
      _ref = contents_lines.slice(first, last);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        index++;
        line_number = first + index;
        _results.push(console.log(" " + line_number + (((function() {
          var _j, _ref1, _results1;

          _results1 = [];
          for (_j = 0, _ref1 = 3 - (line_number.toString().length); 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; 0 <= _ref1 ? _j++ : _j--) {
            _results1.push(' ');
          }
          return _results1;
        })()).join('')) + " " + line));
      }
      return _results;
    } else {
      console.error("Error compiling " + file_name);
      console.log("" + error.message + "\n");
    }
  }
};

module.exports = JsCombine;