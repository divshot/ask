var asArray = require('as-array');
var slash = require('slasher');
var request = require('httpify');
var urlJoin = require('./lib/url-join');
var Promise = require('promise');
var deap = require('deap');
var clone = deap.clone;
var extend = deap.extend;
var settings = require('./lib/settings');
var mockRequestResponse = require('./lib/mock-request-response');

var HTTP_METHODS = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');

//
function RequestBuilder (options) {
  if (!(this instanceof RequestBuilder)) return new RequestBuilder(options);
  if (!options) options = {};
  
  this.origin(options.origin);
  this.headers = clone(options.headers);
  this.xhrOptions = clone(options.xhrOptions);
  
  // Set up http method mocks
  this.mocks = {};
  HTTP_METHODS.forEach(function (method) {
    this.mocks[method.toLowerCase()] = {};
  }, this);
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

RequestBuilder.prototype.asPromise = function (data) {
  return this.promise(function (resolve) {
    resolve(data);
  });
};

RequestBuilder.prototype.asRejectedPromise = function (data) {
  return this.promise(function (resolve, reject) {
    reject(data);
  });
};

RequestBuilder.prototype.mock = function (method, pathname, mockObject) {
  if (mockObject === undefined) return this.mocks[method.toLowerCase()][slash(pathname)]; 
  
  return this.mocks[method.toLowerCase()][slash(pathname)] = mockObject;
};

RequestBuilder.prototype.http = function (method) {
  var rawHttp = this._rawHttp;
  var uri = rest(asArray(arguments)).join('/');
  
  // Handle mocking requests
  var mock = this.mock(method, uri);
  if (mock) return mock.fn();
  
  // New resource object
  var resource = function (params) {
    var resourceObject = {
      url: resource.url(),
      method: method,
      headers: resource.headers,
      form: params
    };
    
    extend(resourceObject, resource.xhrOptions || {});
    
    return rawHttp(resourceObject);
  };
  
  resource._uri = uri;
  resource._builderInstance = this;
  resource.attributes = clone(this.attributes);
  resource.headers = clone(this.headers);
  resource.xhrOptions = clone(this.xhrOptions);
  resource.queries = clone(this.queries);
  settings.mixInto(resource);
  
  return resource;
};

RequestBuilder.prototype.when = function (method, pathname) {
  var mockedRequest = mockRequestResponse(this, method, pathname);
  return this.mock(method, pathname, mockedRequest);
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