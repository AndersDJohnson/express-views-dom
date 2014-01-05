express-views-dom
==========================

A DOM view engine for [Express][express].

[![NPM version](https://badge.fury.io/js/express-views-dom.png)](http://badge.fury.io/js/express-views-dom)
[![Dependency Status](https://david-dm.org/AndersDJohnson/express-views-dom.png)](https://david-dm.org/AndersDJohnson/express-views-dom)

Now with layouts support via [express-views-dom-layouts]!

## Installation

via npm:

```bash
$ npm install --save express-views-dom
```

## Use

Add to your Express app as an engine for HTML files:

```javascript
var app = express();

app.engine('html', require('express-views-dom')(app));
```

### Simple use

"views/home.html":
```html
<!doctype html>
<html>
  <head>
    <title><title>
  </head>
  <body></body>
</html>
```

JavaScript:
```javascript
app.get('/', function (req, res) {
  res.render('home', {
    render: function (window, done) {
      var doc = window.document;
      doc.title = "Home";
      doc.body.innerHTML = "Welcome!";
      done();
    }
  });
});

```

Results in:
```html
<!doctype html>
<html>
  <head>
    <title>Home<title>
  </head>
  <body>
    Welcome!
  </body>
</html>
```

### Loading scripts

Supports loading dependent scripts into the DOM before rendering.
Scripts can be specified in the `deps` array. Each entry must have either a `module` property to
include the main script of an NPM module, or otherwise a `file` property specifying a script file path.
The `exports` property names a global variable to inject as an argument into the `render` callback.
Scripts are loaded and injected in the order they are listed.

```javascript
res.render('home', {
  deps: [
    {
      module: 'jquery',
      exports: 'jQuery'
    },
    {
      file: pathToYourScript,
      exports: 'yourGlobalVariable'
    },
    {
      file: someOtherScript
    }
  ],
  render: function (window, $, yourScript, done) {
    $('title').text('Home');
    done();
  }
});
```

### Requesting a different view

You can request rendering of another view by calling the `done` callback
with a second argument specifying the name of the other view.
This will spawn a new DOM environment for the HTML of the other view,
then re-call your `render` function on it. The last argument to `render`
is a shared object so you can pass data to the new call.

Here is an example of a basic layout system (if you're serious, consider [express-views-dom-layouts]):

"views/home.html":
```html
<!doctype html>
<html>
  <body>
    <!-- from the home view -->
    Welcome!
  </body>
</html>
```

"views/layout.html":
```html
<!doctype html>
<html>
  <head>
    <!-- from the layout view -->
    <style> body { background: skyblue; } </style>
  </head>
  <body></body>
</html>
```

JavaScript:
```javascript
res.render('home', {
  render: function (window, done, params) {
    var doc = window.document;
    if (params.hasOwnProperty('myBody')) {
      doc.body.innerHTML = params.myBody;
      done();
    }
    else {
      params.myBody = doc.body.innerHTML;
      done(null, 'layout');
    }
  }
});
```

Results in:
```html
<!doctype html>
<html>
  <head>
    <!-- from the layout view -->
    <style> body { background: skyblue; } </style>
  </head>
  <body>
    <!-- from the home view -->
    Welcome!
  </body>
</html>
```

[express]: http://expressjs.com/
[express-views-dom-layouts]: https://github.com/AndersDJohnson/express-views-dom-layouts

