var expect = require('expect.js');
var Mocksy = require('mocksy');
var server = new Mocksy({port: 9876});
var request = require('../index.js');

describe('making bare requests', function () {
  
  beforeEach(function (done) {
    server.start(done);
  });
  
  afterEach(function (done) {
    server.stop(done);
  });
  
  it('makes a request with a given http method', function () {
    var apps = request('GET', 'http://localhost:9876', 'apps');
    
    return apps().then(function (res) {
      expect(res.body.method).to.equal('GET');
      expect(res.body.url).to.equal('/apps');
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
