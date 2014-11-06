#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var ngmin = require('ngmin');
var minify = require('minify');
var mkdirp = require('mkdirp');

var ENTRY_FILE = path.resolve(__dirname, '../lib/browser/angular.js');
var DIST_FILE = path.resolve(__dirname, '../dist/ask.angular.js');
var DIST_FILE_MIN = path.resolve(__dirname, '../dist/ask.angular.min.js');

// Create dist directory
mkdirp.sync(path.resolve(__dirname, '../dist'));

console.log('Bundling ... ');

browserify(ENTRY_FILE)
  .ignore('httpify')
  .ignore('promise')
  .bundle()
  .pipe(fs.createWriteStream(DIST_FILE)).on('close', optimize);

function optimize () {
  var contents = fs.readFileSync(DIST_FILE, 'utf8');
  
  console.log('Optimizing for Angular DI ...')
  contents = ngmin.annotate(contents);
  fs.writeFileSync(DIST_FILE_MIN, contents);
  
  console.log('Minifying ...\n');
  minify(DIST_FILE_MIN, function (minifiedContents) {
    fs.writeFileSync(DIST_FILE_MIN, minifiedContents);
  });
}
