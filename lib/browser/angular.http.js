'use strict';

module.exports = function ($http, $q) {
  return function (requestOptions) {
    var d = $q.defer();
    
    if (requestOptions.form) requestOptions.data = requestOptions.form;
    if (requestOptions.type) requestOptions.responseType = requestOptions.type;
    
    $http(requestOptions)
      .then(function (data) {
        data.statusCode = data.status;
        data.body = data.data;
        d.resolve(data);
      }, function (data) {
        data.statusCode = data.status;
        data.body = data.data;
        d.reject(data);
      });
    
    return d.promise;
  };
};