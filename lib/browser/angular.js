'use strict';

var Bid = require('../../index.js');
var angularRequest = require('./angular.http');
var angularPromise = require('./angular.promise');

//
// Prepares Rapper for use in AngularJS
//
angular.module('bid', [])
  .provider('bid', function () {
    var client;
    
    return {
      _options: null,
      
      configure: function (options) {
        this._options = options;
      },
      
      $get: function ($rootScope, $q, $http) {
        if (!client) {
          client = new Bid(this._options);
          
          client._rawHttp = angularRequest($http, $q, $rootScope);
          client.promise = angularPromise($q);
        }
        
        return client;
      }
    };
  })
  .factory('Bid', function ($q, $http) {
    Bid.prototype._rawHttp = angularRequest($http, $q);
    Bid.prototype.promise = angularPromise($q);
    
    return Bid;
  });