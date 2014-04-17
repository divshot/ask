var asArray = require('as-array');
var http = require('httpify');
var join = require('url-join');
var Promise = require('promise');

function RequestBuilder () {
  this.requestObject = requestObject;
  
  var instance = this;
  var requestObject = function (method) {
    var args = asArray(arguments);
    var url = join(args.slice(1).join('/'));
    
    // This allows the developer to return a method and
    // still have access to the request builder instance
    return function () {
      return this._http({
        url: url,
        method: method
      });
    }.bind(this);
  }.bind(this);
  
  // Create help http verb functions
  RequestBuilder.httpMethods.forEach(function (method) {
    requestObject[method.toLowerCase()] = function () {
      var args = asArray(arguments);
      args.unshift(method);
      
      return requestObject.apply(instance, args);
    };
  });
  
  return requestObject;
}

RequestBuilder.httpMethods = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');

RequestBuilder.prototype._http = function (options) {
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

module.exports = RequestBuilder;