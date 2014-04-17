var asArray = require('as-array');
var http = require('httpify');
var join = require('url-join');
var Promise = require('promise');
var httpMethods = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');
var extend = require('extend');

function RequestBuilder () {
  this.attributes = {};
  this.headers = {};
  this.xhrOptions = {};
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
  
  //
  var request = function () {
    if (instance.attributes.origin) url = join(instance.attributes.origin, url);
    
    var requestObject = {
      url: url,
      method: method,
      headers: instance.headers
    };
    
    extend(requestObject, instance.xhrOptions);
    
    return instance._rawHttp(requestObject);
  };
  
  request._builderInstance = instance;
  
  request.origin = function (origin) {
    instance.attributes.origin = origin;
    return request;
  };
  
  request.host = request.origin;
  
  request.header = function (name, value) {
    instance.headers[name] = value;
    return request;
  };
  
  request.xhrOption = function (name, value) {
    instance.xhrOptions[name] = value;
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