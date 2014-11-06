describe('angular providers', function () {
  var app;
  var askProvider;
  var scope;
  var ctrl;
  var httpMock;
  
  beforeEach(function () {
    app = angular.module('BuilderTest', ['ask']);
    app.config(function (_askProvider_) {
      askProvider = _askProvider_;
    });
    app.controller('TestController', function ($scope, ask) {
      ask.origin('http://testhost.com');
      var tester = ask.get('test');
      
      $scope.origin = tester.origin();
      $scope.ask = ask;
      
      $scope.test = function () {
        return tester().then(function (res) {
          $scope.response = res.body;
        });
      };
    });
  });
  
  beforeEach(module('BuilderTest'));
  
  beforeEach(inject(function ($rootScope, $controller, ask, $httpBackend) {
    scope = $rootScope.$new();
    ctrl = $controller('TestController', {
      '$scope': scope,
      ask: ask
    });
    
    httpMock = $httpBackend;
  }));
  
  it('can configure the request provider', function () {
    askProvider.configure({
      origin: 'http://somehost.com'
    });
    
    expect(askProvider._options).to.eql({origin: 'http://somehost.com'});
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