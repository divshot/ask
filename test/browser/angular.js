describe('angular providers', function () {
  var app;
  var bidProvider;
  var scope;
  var ctrl;
  var httpMock;
  
  beforeEach(function () {
    app = angular.module('BuilderTest', ['bid']);
    app.config(function (_bidProvider_) {
      bidProvider = _bidProvider_;
    });
    app.controller('TestController', function ($scope, bid) {
      bid.origin('http://testhost.com');
      var tester = bid.get('test');
      
      $scope.origin = tester.origin();
      $scope.bid = bid;
      
      $scope.test = function () {
        return tester().then(function (res) {
          $scope.response = res.body;
        });
      };
    });
  });
  
  beforeEach(module('BuilderTest'));
  
  beforeEach(inject(function ($rootScope, $controller, bid, $httpBackend) {
    scope = $rootScope.$new();
    ctrl = $controller('TestController', {
      '$scope': scope,
      bid: bid
    });
    
    httpMock = $httpBackend;
  }));
  
  it('can configure the request provider', function () {
    bidProvider.configure({
      origin: 'http://somehost.com'
    });
    
    expect(bidProvider._options).to.eql({origin: 'http://somehost.com'});
  });
  
  // it.skip('overwrites the request object with angular $http', function (done) {
  //   httpMock.when("GET", "http://testhost.com/test").respond("tested");
    
  //   return scope.test().then(function (res) {
  //     httpMock.flush();
  //   // //   // expect(res.body).to.equal('tested');
  //   // //   // expect(scope.host).to.equal('http://testhost.com');
  //   // //   // expect(scope.response).to.equal('tested');
  //   });
  // });
  
  // it('overwrites the promise method with anguar $q', function () {
  //   var promise = scope.request.promise(function (resolve, reject) {
  //     resolve('promised');
  //   });
    
  //   return promise.then(function (val) {
  //     expect(val).to.equal('promised');
  //   });
  // });
});