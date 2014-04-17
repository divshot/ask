#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var minify = require('minify');
var mkdirp = require('mkdirp');

var ENTRY_FILE = path.resolve(__dirname, '../index.js');
var DIST_FILE = path.resolve(__dirname, '../dist/requestbuilder.js');
var DIST_FILE_MIN = path.resolve(__dirname, '../dist/requestbuild.min.js');

// Create dist directory
mkdirp.sync(path.resolve(__dirname, '../dist'));

console.log('Bundling ...');

browserify(ENTRY_FILE)
  .bundle({
    standalone: 'RequestBuilder'
  })
  .pipe(fs.createWriteStream(DIST_FILE)).on('close', optimize);

function optimize () {
  var contents = fs.readFileSync(DIST_FILE, 'utf8');
  fs.writeFileSync(DIST_FILE_MIN, contents);
  
  console.log('Minifying ...\n')
  minify.optimize(DIST_FILE_MIN, {
    callback: function (minifiedContents) {
      fs.writeFileSync(DIST_FILE_MIN, minifiedContents);
    }
  });
}
