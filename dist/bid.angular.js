(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var asArray = require('as-array');
var slash = require('slasher');
var request = require('httpify');
var urlJoin = require('./lib/url-join');
var Promise = require('promise');
var deap = require('deap');
var clone = deap.clone;
var extend = deap.extend;
var settings = require('./lib/settings');
var mockRequestResponse = require('./lib/mock-request-response');

var HTTP_METHODS = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');

//
function Bid (options) {
  if (!(this instanceof Bid)) return new Bid(options);
  if (!options) options = {};
  
  this.origin(options.origin);
  this.headers = clone(options.headers);
  this.xhrOptions = clone(options.xhrOptions);
  
  // Set up http method mocks
  this.mocks = {};
  HTTP_METHODS.forEach(function (method) {
    this.mocks[method.toLowerCase()] = {};
  }, this);
}

Bid.HTTP_METHODS = HTTP_METHODS;
Bid.join = urlJoin;
settings.mixInto(Bid.prototype);

Bid.prototype._rawHttp = function (options) {
  return request(options);
};

Bid.prototype.promise = function (callback) {
  return new Promise(callback);
};

Bid.prototype.asPromise = function (data) {
  return this.promise(function (resolve) {
    resolve(data);
  });
};

Bid.prototype.asRejectedPromise = function (data) {
  return this.promise(function (resolve, reject) {
    reject(data);
  });
};

Bid.prototype.mock = function (method, pathname, mockObject) {
  if (mockObject === undefined) return this.mocks[method.toLowerCase()][slash(pathname)]; 
  
  return this.mocks[method.toLowerCase()][slash(pathname)] = mockObject;
};

Bid.prototype.http = function (method) {
  var rawHttp = this._rawHttp;
  var uri = rest(asArray(arguments)).join('/');
  
  // Handle mocking requests
  var mock = this.mock(method, uri);
  if (mock) return mock.fn();
  
  // New resource object
  var resource = function (params) {
    var resourceObject = {
      url: resource.url(),
      method: method,
      headers: resource.headers,
      form: params
    };
    
    extend(resourceObject, resource.xhrOptions || {});
    
    return rawHttp(resourceObject);
  };
  
  resource._uri = uri;
  resource._builderInstance = this;
  resource.attributes = clone(this.attributes);
  resource.headers = clone(this.headers);
  resource.xhrOptions = clone(this.xhrOptions);
  resource.queries = clone(this.queries);
  settings.mixInto(resource);
  
  return resource;
};

Bid.prototype.when = function (method, pathname) {
  var mockedRequest = mockRequestResponse(this, method, pathname);
  return this.mock(method, pathname, mockedRequest);
};

// Create help http verb functions
Bid.HTTP_METHODS.forEach(function (method) {
  Bid.prototype[method.toLowerCase()] = function () {
    var args = asArray(arguments);
    args.unshift(method);
    
    return this.http.apply(this, args);
  };
});

function rest (arr) {
  return arr.slice(1);
}

//
module.exports = Bid;
},{"./lib/mock-request-response":5,"./lib/settings":6,"./lib/url-join":7,"as-array":8,"deap":13,"httpify":10,"promise":10,"slasher":17}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{"../../index.js":1,"./angular.http":2,"./angular.promise":4}],4:[function(require,module,exports){
'use strict';

module.exports = function ($q) {
  return function (callback) {
    var d = $q.defer();
    
    callback(function (data) {
      d.resolve(data);
    }, function (err) {
      d.reject(err);
    });
    
    return d.promise;
  };
};
},{}],5:[function(require,module,exports){
module.exports = function (context, method, pathname) {
  return {
    context: context,
    method: method,
    pathname: pathname,
    body: null,
    statusCode: 200,
    headers: {},
    
    respond: function (body) {
      this.body = body;
      this.context.mock(this.method, this.pathname, this);
      return this;
    },
    
    status: function (code) {
      if (code === undefined) return this.statusCode;
      this.statusCode = code;
      return this;
    },
    
    header: function (name, value) {
      if (value === undefined) return this.headers[name.toLowerCase()];
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    
    // Custom function to return when a mock is present
    fn: function () {
      var self = this;
      return function () {
        var status = self.statusCode;
        
        if (status === 0 || (status >= 400 && status < 600)) {
          return context.asRejectedPromise(self);
        }
        
        return context.asPromise(self);
      };
    }
  };
};
},{}],6:[function(require,module,exports){
var mix = require('mix-into');
var join = require('./url-join');
var extend = require('deap').extend;

// Settings mixin
module.exports = mix({
  origin: function (origin) {
    if (!this.attributes) this.attributes = {};
    if (!origin) return this.attributes.origin;
    
    this.attributes.origin = origin;
    return this;
  },
  
  header: function (name, value) {
    if (!this.headers) this.headers = {};
    
    if (typeof name === 'object') {
      extend(this.headers, name);
      return this;
    }
    
    if (name && !value) return this.headers[name];
    
    this.headers[name] = value;
    return this;
  },
  
  query: function (name, value) {
    if (!this.queries) this.queries = {};
    
    // Parse query string
    if (!name && !value) return parseQueryString(this.queries);
    
    // Add values from an object
    if (typeof name === 'object') {
      extend(this.queries, name);
      return this;
    }
    
    if (name && !value) return this.queries[name];
    
    this.queries[name] = value;
    return this;
  },
  
  xhrOption: function (name, value) {
    if (!this.xhrOptions) this.xhrOptions = {};
    if (name && !value) return this.xhrOptions[name];
    
    this.xhrOptions[name] = value;
    return this;
  },
  
  url: function () {
    var url = this._uri;
    if (this.origin()) url = join(this.origin(), this._uri);
    
    // Add query string
    if (Object.keys(this.queries || {}).length > 0) {
      var connector = (url.indexOf('?') > -1) ? '&' : '?';
      url = url + connector + this.query();
    }
    
    return url || '/';
  }
});

function parseQueryString (queryObject) {
  var qs = [];
  
  Object
    .keys(queryObject)
    .forEach(function (key) {
      var value = queryObject[key];
      
      if (value) qs.push(key + '=' + value);
    }, this);
  
  return qs.join('&');
}
},{"./url-join":7,"deap":13,"mix-into":16}],7:[function(require,module,exports){
function normalize (str) {
  return str
          .replace(/[\/]+/g, '/')
          .replace(/\/\?/g, '?')
          .replace(/\/\#/g, '#')
          .replace(/\:\//g, '://');
}

module.exports = function () {
  var joined = [].slice.call(arguments, 0).join('/');
  return normalize(joined);
};
},{}],8:[function(require,module,exports){
var isArgs = require('lodash.isarguments');

module.exports = function (data) {
  if (!data) data = [];
  if (isArgs(data)) data = [].splice.call(data, 0);
  
  return Array.isArray(data)
    ? data
    : [data];
};
},{"lodash.isarguments":9}],9:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** `Object#toString` result shortcuts */
var argsClass = '[object Arguments]';

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/**
 * Checks if `value` is an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
 * @example
 *
 * (function() { return _.isArguments(arguments); })(1, 2, 3);
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return value && typeof value == 'object' && typeof value.length == 'number' &&
    toString.call(value) == argsClass || false;
}

module.exports = isArguments;

},{}],10:[function(require,module,exports){

},{}],11:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":12}],12:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],13:[function(require,module,exports){
var lib = require('./lib/deap');

var deap = module.exports = lib.extend;

deap(deap, {
	clone: lib.clone,
	extend: lib.extend,
	update: lib.update,
	merge: lib.merge,
	cloneShallow: lib.cloneShallow,
	extendShallow: lib.extendShallow,
	updateShallow: lib.updateShallow,
	mergeShallow: lib.mergeShallow
});

},{"./lib/deap":14}],14:[function(require,module,exports){
var typeOf = require('./typeof'),
	slice = Array.prototype.slice;

module.exports = {
	clone: deepClone,
	cloneShallow: clone,
	extend: deepExtend,
	extendShallow: extend,
	update: deepUpdate,
	updateShallow: update,
	merge: deepMerge,
	mergeShallow: merge
};

function clone(val) {
	switch(typeOf(val)) {
		case 'object':
			var args = slice.call(arguments);
			args.unshift({});
			return extend.apply(null, args);
		case 'array':
			return [].concat(val);
		case 'date':
			return new Date(val.getTime());
		case 'regexp':
			return new RegExp(val);
		default:
			return val;
	}
}

function deepClone(val) {
	switch(typeOf(val)) {
		case 'object':
			var args = slice.call(arguments);
			args.unshift({});
			return deepExtend.apply(null, args);
		case 'array':
			return val.map(function(v) { return deepClone(v); });
		default:
			return clone(val);
	}
}

function extend(a, b /*, [b2..n] */) {
	slice.call(arguments, 1).forEach(function(b) {
		Object.keys(b).forEach(function(p) {
			a[p] = b[p];
		});
	});
	return a;
}

function deepExtend(a, b /*, [b2..n] */) {
	slice.call(arguments, 1).forEach(function(b) {
		Object.keys(b).forEach(function(p) {
			if(typeOf(b[p]) === 'object' && typeOf(a[p]) === 'object')
				deepExtend(a[p], b[p]);
			else
				a[p] = deepClone(b[p]);
		});
	});
	return a;
}

function update(a, b /*, [b2..n] */) {
	slice.call(arguments, 1).forEach(function(b) {
		Object.keys(b).forEach(function(p) {
			if(a.hasOwnProperty(p)) a[p] = b[p];
		});
	});
	return a;
}

function deepUpdate(a, b /*, [b2..n] */) {
	slice.call(arguments, 1).forEach(function(b) {
		var ap, bp, ta, tb;
		Object.keys(b).forEach(function(p) {
			if(a.hasOwnProperty(p)) {
				ap = a[p];
				bp = b[p];
				ta = typeOf(ap);
				tb = typeOf(bp);
				if(tb === 'object' && ta === 'object')
					deepUpdate(ap, bp);
				else if(tb === 'array' && ta === 'array') {
					ap.length = 0;
					ap.push.apply(ap, bp.map(function(v) { return deepClone(v); }));
				} else
					a[p] = deepClone(bp);
			}
		});
	});
	return a;
}

function merge(a, b /*, [b2..n] */) {
	slice.call(arguments, 1).forEach(function(b) {
		Object.keys(b).forEach(function(p) {
			if(!a.hasOwnProperty(p)) a[p] = b[p];
		});
	});
	return a;
}

function deepMerge(a, b /*, [b2..n] */) {
	slice.call(arguments, 1).forEach(function(b) {
		var ap, bp, ta, tb;
		Object.keys(b).forEach(function(p) {
			ap = a[p];
			bp = b[p];
			ta = typeOf(ap);
			tb = typeOf(bp);
			if(tb === 'object' && ta === 'object')
				deepMerge(ap, bp);
			else if(!a.hasOwnProperty(p))
				a[p] = deepClone(bp);
		});
	});
	return a;
}

},{"./typeof":15}],15:[function(require,module,exports){

module.exports = function(obj) {
	var t = typeof obj;
	if(t !== 'object') return t;

	// typeof null == 'object' so check seperately
	if(obj === null) return 'null';

	// typeof new Array|String|Number|Boolean|RegExp == 'object' so check seperately
	switch(obj.constructor) {
		case Array:		return 'array';
		case String:	return 'string';
		case Number:	return 'number';
		case Boolean:	return 'boolean';
		case RegExp:	return 'regexp';
		case Date:		return 'date';
	}
	return 'object';
};

},{}],16:[function(require,module,exports){
var clone = require('deap').cone;

var mix = function (source) {
  return new Mix(source);
};

var Mix = function (source) {
  this.source = source;
};

Mix.prototype.into = function (target) {
  target = target || {};
  
  var keys = Object.keys(this.source);
  var len = keys.length;
  var i = 0;
  var key;
  var val;
  
  for (i; i < len; i += 1) {
    key = keys[i]
    val = this.source[key];
    
    if (target[key] === undefined) target[key] = this.source[key];
  }
  
  if (target.mixInto === undefined) target.mixInto = mixInto;
  
  return target;
};

Mix.prototype.mixInto = function (target) {
  return this.into(target);
};

Mix.prototype.create = function () {
  return clone(this.source);
};

function mixInto (source) {
  return mix(this).into(source);
}

module.exports = mix;
},{"deap":13}],17:[function(require,module,exports){
var path = require('path');
var join = path.join;
var normalize = path.normalize;

var slasher = module.exports = function (data) {
  options = arguments[1] || {};
  
  if (typeof data === 'string') return slash(data);
  if (typeof data === 'number') return slash(data+'');
  if (typeof data === 'object') return objectSlash(data, options);
  
  return data;
};

function slash (pathname) {
  return normalize(join('/', pathname));
}

function objectSlash (original, options) {
  var slashed = {};
  var keys = Object.keys(original);
  var len = keys.length;
  var i = 0;
  
  for(i; i < len; i += 1) {
    var originalKey = keys[i];
    
    var key = (options.key === false) ? originalKey : slash(originalKey);
    var value = original[originalKey];
    
    slashed[key] = (options.value === false)
      ? value 
      : (typeof value === 'string')
        ? slash(value)
        : value;
  }
  
  return slashed;
}

module.exports = slasher;

},{"path":11}]},{},[3]);
