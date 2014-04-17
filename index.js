var asArray = require('as-array');
var http = require('httpify');
var join = require('url-join');
var Promise = require('promise');

var request = function (method) {
  var args = asArray(arguments);
  var url = join(args.slice(1).join('/'));
  
  return function () {
    return request._http({
      url: url,
      method: method
    });
  };
};

request._http = function (options) {
  return new Promise(function (resolve, reject) {
    http(options, function (err, response, body) {
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

request.get = function () {
  var args = asArray(arguments);
  args.unshift('GET');
  
  return request.apply(request, args);
};

module.exports = request;