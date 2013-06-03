var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , CoffeeScript = require('coffee-script')
  , UglifyJS = require('uglify-js');


function JsCombine(filename, paths, options, callback) {
  var _this = this
    , errors = [];

  this.options = options;

  var code, ast = null, stream, compressedStream;
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
        var columns = 0;
        line = e.message.match(/Unexpected token name \«(.*?)\»/);
        if(line){
          columns = line[1].length - 1;
        }
        
        e.location = {
          first_line: e.line - 1,
          first_column: e.col,
          last_line: e.line - 1,
          last_column: e.col + columns
        };
      }
      errors.push(CoffeeScript.helpers.prettyErrorMessage(e, path, code, true));
    }
  });

  if(ast){
    stream = UglifyJS.OutputStream({
      comments: function(self, comment){
        // Keep comments starting with /*!
        return comment.type == 'comment2' && /^(\*+)?\!/.test(comment.value);
      },
      beautify: true,
      indent_level: 2
    });

    ast.figure_out_scope();
    ast.print(stream);

    this.writeOut(filename, stream.toString());

    if(options.compress){
      compressedStream = UglifyJS.OutputStream({
        comments: function(self, comment){
          // Keep comments starting with /*!
          return comment.type == 'comment2' && /^(\*+)?\!/.test(comment.value);
        }
      });

      compressor = UglifyJS.Compressor({warnings: false});
      ast = ast.transform(compressor);

      ast.figure_out_scope();
      ast.compute_char_frequency();
      ast.mangle_names();

      ast.print(compressedStream);

      this.writeOut(filename.replace(/\.js$/, '.min.js'), compressedStream.toString());
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
