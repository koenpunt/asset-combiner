var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , CoffeeScript = require('coffee-script')
  , UglifyJS = require('uglify-js');


function JsCombine(filename, paths, options, callback) {
  var _this = this
    , errors = [];

  this.options = options;

  var code, ast = null;
  paths.forEach(function(path){
    code = fs.readFileSync(path).toString();
    try{
      if(/\.coffee$/.test(path)){
        // Precompile CoffeeScript
        code = CoffeeScript.compile(code);
      }
      // Generate AST of Javascript source
      ast = UglifyJS.parse(code, { filename: path, toplevel: ast });
    }catch(e){
      if(e instanceof UglifyJS.JS_Parse_Error){
        // Make UglifyJS error compatible with prettyErrorMessage
        e.location = {
          first_line: e.line - 1,
          first_column: e.col,
          last_line: e.line - 1,
          last_column: e.col
        };
      }
      errors.push(CoffeeScript.helpers.prettyErrorMessage(e, path, code, true));
    }
  });

  if(ast){
    ast.figure_out_scope();
    // Keep comments starting with /*!
    output = ast.print_to_string({
      comments: /^(\*+)?\!/,
      beautify: true,
      indent_level: 2
    });
    this.writeOut(filename, output);

    if(options.compress){
      compressor = UglifyJS.Compressor({warnings: false});
      ast = ast.transform(compressor);
      ast.figure_out_scope();
      ast.compute_char_frequency();
      ast.mangle_names();
      // Keep comments starting with /*!
      output = ast.print_to_string({comments: /^(\*+)?\!/});
      this.writeOut(filename.replace(/\.js$/, '.min.js'), output);
    }
  }
  callback && callback(errors.length ? errors : null);
};

JsCombine.prototype = {

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