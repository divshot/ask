var expect = require('chai').expect;
var requestBuilder = require('../../index.js');

describe('mocking http requests', function () {
  var request;
  
  beforeEach(function () {
    request = requestBuilder();
  });
  
  it('intercepts a get request with a relative path and returns custom data', function () {
    request
      .when('GET', '/some/endpoint')
      .respond('mock response');
    
    return request.get('some', 'endpoint')().then(function (res) {
      expect(res.body).to.equal('mock response');
    });
  });
  
  it('defaults to a null responseText if no response is provided', function () {
    request.when('get', '/some/endpoint');
    
    return request.get('some', 'endpoint')().then(function (res) {
      expect(res.body).to.equal(null);
    });
  });
  
  it('sets a custom status code', function () {
    request
      .when('GET', '/some/endpoint')
      .respond('done')
      .status(201);
    
    return request.get('some', 'endpoint')().then(function (res) {
      expect(res.statusCode).to.equal(201);
    });
  });
  
  it('defaults the status code to 200', function () {
    request.when('GET', '/some/endpoint');
    
    return request.get('some', 'endpoint')().then(function (res) {
      expect(res.statusCode).to.equal(200);
    });
  });
  
  it('rejects the promise if the status code is rejectable', function () {
    request
      .when('GET', '/some/endpoint')
      .respond('done')
      .status(400);
    
    return request.get('some', 'endpoint')().then(function (res) {
      throw new Error('Status code should have forced response to be rejected');
    }, function (res) {
      expect(res.statusCode).to.equal(400);
    });
  });
  
  it('sets custom response headers', function () {
    request
      .when('GET', '/some/endpoint')
      .respond('done')
      .header('content-type', 'text/html');
    
    return request.get('some', 'endpoint')().then(function (res) {
      expect(res.headers['content-type']).to.equal('text/html');
    });
  });
  
});