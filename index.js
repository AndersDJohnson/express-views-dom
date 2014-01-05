/*
 * A DOM view engine for Express.
 */

var util = require('util');
var path = require('path');
var jsdom = require('jsdom');

module.exports = function (app) {

  var Handler = function (file, options, next) {
    this.file = file;
    this.options = options;
    this.next = next;
    this.params = {};
    this.injects = [];
    this.scripts = options.scripts || [];
  };

  Handler.prototype.env = function () {
    var self = this;
    jsdom.env({
      file: this.file,
      scripts: this.scripts,
      src: this.options.src,
      done: self.jsdomReady.bind(self)
    });
  };

  Handler.prototype.callback = function (err, instead) {
    if (err) {
      this.next(err);
    }
    else {
      if (instead) {
        var insteadFile = path.join(app.get('views'), instead + '.html');
        this.file = insteadFile;
        this.params.instead = instead;
        this.env();
      }
      else {
        var window = this.window;
        var document = window.document;

        // remove scripts added by jsdom
        var scripts = document.querySelectorAll('script.jsdom');
        Array.prototype.forEach.call(scripts, function (script) {
          script.parentNode.removeChild(script);
        });

        var doctype = document.doctype ? document.doctype.toString() : '';
        var root = document.documentElement;
        var html = root ? root.outerHTML : '<html></html>';
        var full = doctype + html;
        this.next(null, full);
      }

    }
  };

  Handler.prototype.jsdomReady = function(errors, window) {
    var self = this;
    this.window = window;
    if (errors) {
      this.next(errors);
    }
    else if ( ! this.options.render ) {
      this.next(new Error("requires render callback"));
    }
    else {
      var args = [window];
      this.injects.forEach(function (inject) {
        var exported = window[inject.exports];
        args.push(exported);
      });
      args.push(self.callback.bind(self));
      args.push(self.params);
      this.options.render.apply(window, args);
    }
  };

  return function (file, options, next) {

    var handler = new Handler(file, options, next);

    var deps = options.deps;

    var eachDep = function (dep) {
      var scriptPath;
      var moduleName;
      var fileName;
      var inject;
      if (typeof dep === 'string') {
        moduleName = dep;
        inject = false;
      }
      else {
        moduleName = dep.module;
        fileName = dep.file;
        inject = typeof dep.inject === 'undefined' ? true : dep.inject;
      }
      if (moduleName) {
        try {
          scriptPath = require.resolve(moduleName);
        }
        catch (e) {
          fileName = moduleName;
        }
      }
      if (fileName) {
        scriptPath = fileName;
      }
      handler.scripts.push(scriptPath);
      if (inject && dep.exports) {
        handler.injects.push({
          exports: dep.exports
        });
      }
    };

    if (deps) {
      deps.forEach(eachDep);
    }

    handler.env();
  };

};
