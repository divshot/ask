var asArray = require('as-array');
var request = require('httpify');
var urlJoin = require('./lib/url-join');
var Promise = require('promise');
var deap = require('deap');
var clone = deap.clone;
var extend = deap.extend;
var settings = require('./lib/settings');

var HTTP_METHODS = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');

//
function RequestBuilder (options) {
  if (!options) options = {};
  
  this.origin(options.origin);
  this.headers = clone(options.headers);
  this.xhrOptions = clone(options.xhrOptions);
}

RequestBuilder.HTTP_METHODS = HTTP_METHODS;
RequestBuilder.join = urlJoin;
settings.mixInto(RequestBuilder.prototype);

RequestBuilder.prototype._rawHttp = function (options) {
  return request(options);
};

RequestBuilder.prototype.promise = function (callback) {
  return new Promise(callback);
};

RequestBuilder.prototype.http = function (method) {
  var instance = this;
  var args = asArray(arguments);
  var url = rest(args).join('/');
  
  // New resource object
  var resource = function (params) {
    if (resource.origin()) url = RequestBuilder.join(resource.origin(), url);
    
    var resourceObject = {
      url: url,
      method: method,
      headers: resource.headers,
      form: params
    };
    
    extend(resourceObject, resource.xhrOptions || {});
    
    return instance._rawHttp(resourceObject);
  };
  
  resource._builderInstance = instance;
  resource.attributes = clone(instance.attributes);
  resource.headers = clone(instance.headers);
  resource.xhrOptions = clone(instance.xhrOptions);
  settings.mixInto(resource);
  
  return resource;
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