'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var async = require('async');
var temp = require('temp');
var exec = require('child_process').exec;

var graphicsMagick = require('gm');
var imageMagick = require('gm').subClass({ imageMagick: true });

// Automatically track and cleanup files at exit
temp.track();

/**
 * Local variables
 */

var imagesDirectory = path.join(__dirname, '..', 'images');
var filenames = _.filter(fs.readdirSync(imagesDirectory), function(filename) {
  return !/^\./.test(filename);
});


/**
 * Bench core
 */

async.series([
  
  /**
   * GraphicsMagick
   */
  
  function testGraphicsMagick(next) {
    console.log('GraphicsMagick');

    // test images
    async.series(_.map(filenames, function (filename) {
      return function (next) {
        console.log('-- ' + filename);

        var start = new Date();

        graphicsMagick(path.join(imagesDirectory, filename))
        .identify(function (err, data) {
          var end = new Date();
          next(err, end - start)
        });
      }
    }), next);
  },

  /**
   * ImageMagick
   */
  
  function testImageMagick(next) {
    console.log('ImageMagick');

    // test images
    async.series(_.map(filenames, function (filename) {
      return function (next) {
        console.log('-- ' + filename);

        var start = new Date();

        imageMagick(path.join(imagesDirectory, filename))
        .identify(function (err, data) {
          var end = new Date();
          next(err, end - start)
        });
      }
    }), next);
  }
], function (err, res) {
  if (err) return console.error(err);

  // write results
  temp.open('bench-images-', function (err, info) {
    if (err) return console.error(err);

    _.each(_.keys(res[0]), function (key) {
      fs.writeSync(info.fd, key + ' ' + res[0][key] + ' ' + res[1][key] + '\n');
    });

    fs.close(info.fd, function (err) {
      if (err) return console.error(err);

      console.log('datas written in ' + info.path);

      var command = 'gnuplot' +
        ' -e "filename=\'' + info.path + '\'"' +
        ' -e "set xrange [-0.5:' + (res[0].length + 1.5) + ']"' +
        ' -p src/plotscript';

      console.log(command);
      var child = exec(command);
    });
  });
});
