var asArray = require('as-array');
var http = require('httpify');
var urlJoin = require('./lib/url-join');
var Promise = require('promise');
var extend = require('xtend');
var clone = require('clone');
var settings = require('./lib/settings');
var HTTP_METHODS = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');

//
function RequestBuilder () {
  this.attributes = {};
  this.headers = {};
  this.xhrOptions = {};
}

RequestBuilder.HTTP_METHODS = HTTP_METHODS;
RequestBuilder.join = urlJoin;
settings.mixInto(RequestBuilder.prototype);

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
  var url = rest(args).join('/');
  
  // New request object
  var request = function () {
    if (request.attributes.origin) url = RequestBuilder.join(request.attributes.origin, url);
    
    var requestObject = {
      url: url,
      method: method,
      headers: request.headers
    };
    
    return instance._rawHttp(extend(requestObject, request.xhrOptions));
  };
  
  request._builderInstance = instance;
  request.attributes = clone(instance.attributes);
  request.headers = clone(instance.headers);
  request.xhrOptions = clone(instance.xhrOptions);
  settings.mixInto(request);
  
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

function rest (arr) {
  return arr.slice(1);
}

//
module.exports = RequestBuilder;