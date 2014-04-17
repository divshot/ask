var asArray = require('as-array');
var http = require('httpify');
var join = require('url-join');
var Promise = require('promise');

var request = function (method) {
  var args = asArray(arguments);
  var url = join(args.slice(1).join('/'));
  
  return function () {
    return request.http({
      url: url,
      method: method
    });
  }
};

request.http = function (options) {
  return new Promise(function (resolve, reject) {
    http(options, function (err, response) {
      if (err) return reject(err);
      
      try{
        response.body = JSON.parse(response.body);
      }
      finally{
        if (response.statusCode >= 300) return reject(response);
        
        resolve(response);
      }
    });
  });
};

module.exports = request;