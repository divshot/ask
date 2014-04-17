# request-builder

## Install

Bower

```
bower install request-builder --save
```

NPM

```
npm install request-builder --save
```

## Usage

### Include in App

Standalone

```html
<script src="/bower_components/request-builder/dist/requestbuilder.js"></script>
```

Nodejs/Browserify

```js
var builder = require('request-builder');
```

### Build Requests

Simple `GET` request

```js
var request = new RequestBuilder({
	origin: '', /* default origin */
	headers: {/* set default headers */},
  xhrOptions: {/* default xhr options */
});

// Settings for all endpoints
request
  .origin('http://api.example.com')
  .header('Authorzation', 'Bearer 1234')
  .xhrOption('withCredentials', true);

// Create an endpoint and customize with endpoint-specific settings
// Returns a function to execute later
var getAllUsers = request
  .get('users')
  .query('page', 1)
  .query('limit', 10);

getAllUsers().then(function (res) {
  var users = res.body;
}, function (err) {
  // err.body
});
```

Simple `POST` request

```js
var request = new RequestBuilder();

request.origin('http://api.example.com');

var createUser = reqest.post('users');

// Send body data with request
createUser({
	name: 'example',
  email: 'something@aol.com'
}).then(function (res) {
	// Success!
});

```

## API

(Coming soon)

## Build

Builds standalone and Angular version of the module

```
npm install
npm run build
```

## Run Tests

```
npm install
npm test
```