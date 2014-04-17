var expect = require('expect.js');
var Mocksy = require('mocksy');
var server = new Mocksy({port: 9876});
var RequestBuilder = require('../index.js');
var host = 'http://localhost:9876';

describe('request instance', function () {
  var request;
  
  beforeEach(function (done) {
    request = new RequestBuilder();
    server.start(done);
  });
  
  afterEach(function (done) {
    server.stop(done);
  });
  
  it('sets the default origin for all http requests on the instance', function () {
    request.origin(host);
    
    return request.get('test')().then(function (res) {
      expect(res.body.url).to.equal('/test');
      expect(res.body.method).to.equal('GET');
    });
  });
  
  it('sets the default headers for all http requests on the instance', function () {
    request
      .origin(host)
      .header('Authorization', 'Bearer 1234');
    
    return request.get('test')().then(function (res) {
      expect(res.body.headers.authorization).to.equal('Bearer 1234');
    });
  });
  
  it('sets the default xhr options for all http requests on the instance', function () {
    request
      .origin(host)
      .xhrOption('method', 'POST');
    
    return request.get('test')().then(function (res) {
      expect(res.body.method).to.equal('POST');
    });
  });
  
});

describe('making bare requests', function () {
  var request;
  
  beforeEach(function (done) {
    request = new RequestBuilder();
    server.start(done);
  });
  
  afterEach(function (done) {
    server.stop(done);
  });
  
  it('makes a request with a given http method', function () {
    var apps = request.http('GET', host, 'apps');
    
    return apps().then(function (res) {
      expect(res.body.method).to.equal('GET');
      expect(res.body.url).to.equal('/apps');
    });
  });
  
  // Helpers
  RequestBuilder.httpMethods.forEach(function (method) {
    
    // EXAMPLE: request.get('url', 123)
    
    it('makes a ' + method + ' request', function () {
      var requester = request[method.toLowerCase()](host, 'requester', 123);
      
      return requester().then(function (res) {
        expect(res.body.method).to.equal(method);
        expect(res.body.url).to.equal('/requester/123');
      });
    });
  });
  
  it('defaults to a get request');
  it('passes body parameters to various methods');
  
});

describe('setting options', function () {
  var request;
  var requester;
  
  beforeEach(function (done) {
    request = new RequestBuilder();
    server.start(done);
  });
  
  afterEach(function (done) {
    server.stop(done);
  });
  
  it('sets the request origin', function () {
    var requester = request
      .get('test')
      .origin(host);
    
    return requester().then(function (res) {
      expect(res.body.url).to.equal('/test');
    });
  });
  
  it('aliases origin with host', function () {
    var requester = request
      .get('test')
      .host(host);
    
    return requester().then(function (res) {
      expect(res.body.url).to.equal('/test');
    });
  });
  
  it('sets the header for the request', function () {
    var requester = request
      .get('test')
      .host(host)
      .header('Authorization', 'Bearer 1234');
      
    return requester().then(function (res) {
      expect(res.body.headers.authorization).to.equal('Bearer 1234')
    });
  });
  
  it('sets an xhr options for the request', function () {
    var requester = request
      .get('test')
      .host(host)
      .xhrOption('method', 'POST')
      .xhrOption('form', {test: 'test'});
      
    return requester().then(function (res) {
      expect(res.body.method).to.equal('POST');
      expect(res.body.body).to.eql({test: 'test'});
    });
  });
  
  it('sets the default settings from the instance on the request');
  
  // FROM: Collin
  // 
  // it('does not modify state', function() {
  //   var requester = request.http();
  //   var requester2 = requester.origin('host1');
  //   var requester3 = requester2.origin('host2');
  //   expect(requester2._builderInstance.attributes.origin).to.equal('host1');
  // });
  
});



// var getApps = request.get('apps')
//   .origin('https://api.divshot.com')
//   .header('Authorization', 'Session asdfwefon2o3f23uf');

// var getApps = request('GET', 'apps');

// getApps().then(function (apps) {
  
// });
