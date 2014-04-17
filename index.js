var asArray = require('as-array');
var http = require('httpify');
var join = require('url-join');
var Promise = require('promise');
var httpMethods = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');

function RequestBuilder () {
  this.attributes = {};
}

RequestBuilder.httpMethods = httpMethods;

RequestBuilder.prototype._rawHttp = function (options) {
  return this.promise(function (resolve, reject) {
    http(options, function (err, response, body) {
      if (err) return reject(err);
      
      try{
        response.body = JSON.parse(body);
      }
      finally{
        if (response.statusCode >= 300) return reject(response);
        
        resolve(response);
      }
    });
  });
};

RequestBuilder.prototype.promise = function (callback) {
  return new Promise(callback);
};

RequestBuilder.prototype.http = function (method) {
  var instance = this;
  var args = asArray(arguments);
  var url = join(args.slice(1).join('/'));
  
  var request = function () {
    if (instance.attributes.origin) url = join(instance.attributes.origin, url);
    
    return instance._rawHttp({
      url: url,
      method: method
    });
  };
  
  request._builderInstance = instance;
  
  request.origin = function (origin) {
    instance.attributes.origin = origin;
    return request;
  };
  
  return request;
};

// Create help http verb functions
RequestBuilder.httpMethods.forEach(function (method) {
  RequestBuilder.prototype[method.toLowerCase()] = function () {
    var args = asArray(arguments);
    args.unshift(method);
    
    return this.http.apply(this, args);
  };
});

//
module.exports = RequestBuilder;