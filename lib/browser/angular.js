'use strict';

var Ask = require('../../index.js');
var angularRequest = require('./angular.http');
var angularPromise = require('./angular.promise');

//
// Prepares Rapper for use in AngularJS
//
angular.module('ask', [])
  .provider('ask', function () {
    var client;
    
    return {
      _options: null,
      
      configure: function (options) {
        this._options = options;
      },
      
      $get: function ($rootScope, $q, $http) {
        if (!client) {
          client = new Ask(this._options);
          
          client._rawHttp = angularRequest($http, $q, $rootScope);
          client.promise = angularPromise($q);
        }
        
        return client;
      }
    };
  })
  .factory('Ask', function ($q, $http) {
    Ask.prototype._rawHttp = angularRequest($http, $q);
    Ask.prototype.promise = angularPromise($q);
    
    return Ask;
  });