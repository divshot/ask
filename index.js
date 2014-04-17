var asArray = require('as-array');
var http = require('httpify');
var join = require('url-join');
var Promise = require('promise');
var extend = require('xtend');
var clone = require('clone');
var HTTP_METHODS = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');

function RequestBuilder () {
  this.attributes = {};
  this.headers = {};
  this.xhrOptions = {};
}

RequestBuilder.HTTP_METHODS = HTTP_METHODS;

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
    if (request.attributes.origin) url = join(request.attributes.origin, url);
    
    var requestObject = {
      url: url,
      method: method,
      headers: request.headers
    };
    
    requestObject = extend(requestObject, request.xhrOptions);
    
    return instance._rawHttp(requestObject);
  };
  
  request._builderInstance = instance;
  request.attributes = clone(instance.attributes);
  request.headers = clone(instance.headers);
  request.xhrOptions = clone(instance.xhrOptions);
  
  request.origin = function (origin) {
    if (!origin) return this.attributes.origin;
    
    request.attributes.origin = origin;
    return request;
  };
  
  request.host = request.origin;
  
  request.header = function (name, value) {
    if (!value) return request.headers[name];
    
    request.headers[name] = value;
    return request;
  };
  
  request.xhrOption = function (name, value) {
    if (!value) return request.xhrOptions[name];
    
    request.xhrOptions[name] = value;
    return request;
  };
  
  return request;
};

// Create help http verb functions
RequestBuilder.HTTP_METHODS.forEach(function (method) {
  RequestBuilder.prototype[method.toLowerCase()] = function () {
    var args = asArray(arguments);
    args.unshift(method);
    
    return this.http.apply(this, args);
  };
});

RequestBuilder.prototype.origin = function (origin) {
  if (!origin) return this.attributes.origin;
  
  this.attributes.origin = origin;
  return this;
};

RequestBuilder.prototype.header = function (name, value) {
  if (!value) return this.headers[name];
  
  this.headers[name] = value;
  return this;
};

RequestBuilder.prototype.xhrOption = function (name, value) {
  if (!value) return this.xhrOptions[name];
  
  this.xhrOptions[name] = value;
  return this;
};

//
module.exports = RequestBuilder;