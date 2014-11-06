var asArray = require('as-array');
var slash = require('slasher');
var request = require('httpify');
var join = require('join-path');
var Promise = require('promise');
var deap = require('deap');
var clone = deap.clone;
var extend = deap.extend;
var proto = require('./lib/proto');
var mockRequestResponse = require('./lib/mock-request-response');

var HTTP_METHODS = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');

//
function Ask (options) {
  if (!(this instanceof Ask)) return new Ask(options);
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

Ask.HTTP_METHODS = HTTP_METHODS;
Ask.join = join;
proto.mixInto(Ask.prototype);

Ask.prototype._rawHttp = function (options) {
  return request(options);
};

Ask.prototype.promise = function (callback) {
  return new Promise(callback);
};

Ask.prototype.asPromise = function (data) {
  return this.promise(function (resolve) {
    resolve(data);
  });
};

Ask.prototype.asRejectedPromise = function (data) {
  return this.promise(function (resolve, reject) {
    reject(data);
  });
};

Ask.prototype.mock = function (method, pathname, mockObject) {
  if (mockObject === undefined) return this.mocks[method.toLowerCase()][slash(pathname)]; 
  
  return this.mocks[method.toLowerCase()][slash(pathname)] = mockObject;
};

Ask.prototype.http = function (method) {
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
  proto.mixInto(resource);
  
  return resource;
};

Ask.prototype.when = function (method, pathname) {
  var mockedRequest = mockRequestResponse(this, method, pathname);
  return this.mock(method, pathname, mockedRequest);
};

// Create help http verb functions
Ask.HTTP_METHODS.forEach(function (method) {
  Ask.prototype[method.toLowerCase()] = function () {
    var args = asArray(arguments);
    args.unshift(method);
    
    return this.http.apply(this, args);
  };
});

function rest (arr) {
  return arr.slice(1);
}

//
module.exports = Ask;