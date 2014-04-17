'use strict';

var RequestBuilder = require('../../index.js');
var angularRequest = require('./angular.http');
var angularPromise = require('./angular.promise');

//
// Prepares Rapper for use in AngularJS
//
angular.module('requestBuilder', [])
  .provider('request', function () {
    var client;
    
    return {
      _options: null,
      
      configure: function (options) {
        this._options = options;
      },
      
      $get: function ($q, $http) {
        if (!client) {
          client = new RequestBuilder(this._options);
          
          client._rawHttp = angularRequest($http, $q);
          client.promise = angularPromise($q);
        }
        
        return client;
      }
    };
  })
  .factory('RequestBuilder', function ($q, $http) {
    RequestBuilder.prototype._rawHttp = angularRequest($http, $q);
    RequestBuilder.prototype.promise = angularPromise($q);
    
    return RequestBuilder;
  });