var expect = require('expect.js');
var Mocksy = require('mocksy');
var server = new Mocksy({port: 9876});
var request = require('../index.js');

describe('making bare requests', function () {
  var host = 'http://localhost:9876';
  
  beforeEach(function (done) {
    server.start(done);
  });
  
  afterEach(function (done) {
    server.stop(done);
  });
  
  it('makes a request with a given http method', function () {
    var apps = request('GET', host, 'apps');
    
    return apps().then(function (res) {
      expect(res.body.method).to.equal('GET');
      expect(res.body.url).to.equal('/apps');
    });
  });
  
  // Helpers
  request._httpMethods.forEach(function (method) {
    it('makes a ' + method + ' request', function () {
      var requester = request[method.toLowerCase()](host, 'requester');
      
      return requester().then(function (res) {
        expect(res.body.method).to.equal(method);
        expect(res.body.url).to.equal('/requester');
      });
    });
  });
  
});


// request()
// request.get()
// request.post()
// request.put()
// request.delete()
// request.patch()
// request.head()
// request.options()


// var getApps = request.get('apps')
//   .origin('https://api.divshot.com')
//   .header('Authorization', 'Session asdfwefon2o3f23uf');

// var getApps = request('GET', 'apps');

// getApps().then(function (apps) {
  
// });
