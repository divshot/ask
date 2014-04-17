!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.RequestBuilder=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var asArray = _dereq_('as-array');
var http = _dereq_('httpify');
var urlJoin = _dereq_('./lib/url-join');
var Promise = _dereq_('promise');
var deap = _dereq_('deap');
var clone = deap.clone;
var extend = deap.extend;
var settings = _dereq_('./lib/settings');
var HTTP_METHODS = 'GET POST PUT DELETE PATCH OPTIONS'.split(' ');

//
function RequestBuilder (options) {
  if (!options) options = {};
  
  this.origin(options.origin);
  this.headers = clone(options.headers);
  this.xhrOptions = clone(options.xhrOptions);
}

RequestBuilder.HTTP_METHODS = HTTP_METHODS;
RequestBuilder.join = urlJoin;
settings.mixInto(RequestBuilder.prototype);

RequestBuilder.prototype._rawHttp = function (options) {
  return http(options);
};

RequestBuilder.prototype.promise = function (callback) {
  return new Promise(callback);
};

RequestBuilder.prototype.http = function (method) {
  var instance = this;
  var args = asArray(arguments);
  var url = rest(args).join('/');
  
  // New request object
  var request = function (params) {
    if (request.origin()) url = RequestBuilder.join(request.origin(), url);
    
    var requestObject = {
      url: url,
      method: method,
      headers: request.headers,
      form: params
    };
    
    extend(requestObject, request.xhrOptions || {});
    
    return instance._rawHttp(requestObject);
  };
  
  request._builderInstance = instance;
  request.attributes = clone(instance.attributes);
  request.headers = clone(instance.headers);
  request.xhrOptions = clone(instance.xhrOptions);
  settings.mixInto(request);
  
  return request;
};

// Create help http verb functions
RequestBuilder.HTTP_METHODS.forEach(function (method) {
  RequestBuilder.prototype[method.toLowerCase()] = function () {
    var args = asArray(arguments);
    args.unshift(method);
    
    return this.http.apply(this, args);
  };
});

function rest (arr) {
  return arr.slice(1);
}

//
module.exports = RequestBuilder;
},{"./lib/settings":2,"./lib/url-join":3,"as-array":4,"deap":7,"httpify":10,"promise":20}],2:[function(_dereq_,module,exports){
var mix = _dereq_('mix-into');

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
    if (!value) return this.headers[name];
    
    this.headers[name] = value;
    return this;
  },
  
  xhrOption: function (name, value) {
    if (!this.xhrOptions) this.xhrOptions = {};
    if (!value) return this.xhrOptions[name];
    
    this.xhrOptions[name] = value;
    return this;
  }
});
},{"mix-into":15}],3:[function(_dereq_,module,exports){
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
},{}],4:[function(_dereq_,module,exports){
var isArgs = _dereq_('lodash.isarguments');

module.exports = function (data) {
  if (!data) data = [];
  if (isArgs(data)) data = [].splice.call(data, 0);
  
  return Array.isArray(data)
    ? data
    : [data];
};
},{"lodash.isarguments":5}],5:[function(_dereq_,module,exports){
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

},{}],6:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
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
process.once = noop;
process.off = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],7:[function(_dereq_,module,exports){
var lib = _dereq_('./lib/deap');

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

},{"./lib/deap":8}],8:[function(_dereq_,module,exports){
var typeOf = _dereq_('./typeof'),
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

},{"./typeof":9}],9:[function(_dereq_,module,exports){

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

},{}],10:[function(_dereq_,module,exports){
var Promise = _dereq_('promise');
var request = _dereq_('request');

module.exports = function (options, callback) {
  return new Promise(function (resolve, reject) {
    request(options, function (err, response, body) {
      var status = (response) ? response.statusCode : 0;
      callback = callback || function () {};
      
      if (err) {
        callback(err);
        reject(err);
        return 
      }
      
      if (status >= 400 && status < 600) {
        callback(null, response);
        reject(response);
        return
      }
      
      try{
        response.body = JSON.parse(body);
      }
      catch (e) {}
      
      callback(null, response);
      resolve(response);
    });
  });
};
},{"promise":20,"request":11}],11:[function(_dereq_,module,exports){
var request = _dereq_('xhr');

// Wrapper to make the features more similiar between
// request and xhr

module.exports = function (options, callback) {
  callback = callback || function () {};
  
  // Set up for Request module
  if (options.data && !window) options.form = options.data;
  
  // Set up for xhr module
  if (options.form && window) {
    options.body = (typeof options.form === 'object')
      ? JSON.stringify(options.form)
      : options.form;
  }
  
  if (options.data) {
    options.body = (typeof options.data === 'object')
      ? JSON.stringify(options.data)
      : options.data;
  }
  
  if (options.url && window) options.uri = options.url;
  if (window) options.cors = options.withCredentials;
  
  return request(options, callback);
};
},{"xhr":12}],12:[function(_dereq_,module,exports){
var window = _dereq_("global/window")
var once = _dereq_("once")

var messages = {
    "0": "Internal XMLHttpRequest Error",
    "4": "4xx Client Error",
    "5": "5xx Server Error"
}

var XHR = window.XMLHttpRequest || noop
var XDR = "withCredentials" in (new XHR()) ?
        window.XMLHttpRequest : window.XDomainRequest

module.exports = createXHR

function createXHR(options, callback) {
    if (typeof options === "string") {
        options = { uri: options }
    }

    options = options || {}
    callback = once(callback)

    var xhr = options.xhr || null

    if (!xhr && options.cors) {
        xhr = new XDR()
    } else if (!xhr) {
        xhr = new XHR()
    }

    var uri = xhr.url = options.uri || options.url;
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false

    if ("json" in options) {
        isJson = true
        headers["Content-Type"] = "application/json"
        body = JSON.stringify(options.json)
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = load
    xhr.onerror = error
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    // hate IE
    xhr.ontimeout = noop
    xhr.open(method, uri, !sync)
    if (options.cors) {
        xhr.withCredentials = true
    }
    // Cannot set timeout with sync request
    if (!sync) {
        xhr.timeout = "timeout" in options ? options.timeout : 5000
    }

    if ( xhr.setRequestHeader) {
        Object.keys(headers).forEach(function (key) {
            xhr.setRequestHeader(key, headers[key])
        })
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }

    xhr.send(body)

    return xhr

    function readystatechange() {
        if (xhr.readyState === 4) {
            load()
        }
    }

    function load() {
        var error = null
        var status = xhr.statusCode = xhr.status
        var body = xhr.body = xhr.response ||
            xhr.responseText || xhr.responseXML

        if (status === 0 || (status >= 400 && status < 600)) {
            var message = xhr.responseText ||
                messages[String(xhr.status).charAt(0)]
            error = new Error(message)

            error.statusCode = xhr.status
        }

        if (isJson) {
            try {
                body = xhr.body = JSON.parse(body)
            } catch (e) {}
        }

        callback(error, xhr, body)
    }

    function error(evt) {
        callback(evt, xhr)
    }
}


function noop() {}

},{"global/window":13,"once":14}],13:[function(_dereq_,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window
} else if (typeof global !== "undefined") {
    module.exports = global
} else {
    module.exports = {}
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(_dereq_,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],15:[function(_dereq_,module,exports){
var clone = _dereq_('deap').cone;

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
},{"deap":16}],16:[function(_dereq_,module,exports){
module.exports=_dereq_(7)
},{"./lib/deap":17}],17:[function(_dereq_,module,exports){
module.exports=_dereq_(8)
},{"./typeof":18}],18:[function(_dereq_,module,exports){
module.exports=_dereq_(9)
},{}],19:[function(_dereq_,module,exports){
'use strict';

var asap = _dereq_('asap')

module.exports = Promise
function Promise(fn) {
  if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
  if (typeof fn !== 'function') throw new TypeError('not a function')
  var state = null
  var value = null
  var deferreds = []
  var self = this

  this.then = function(onFulfilled, onRejected) {
    return new Promise(function(resolve, reject) {
      handle(new Handler(onFulfilled, onRejected, resolve, reject))
    })
  }

  function handle(deferred) {
    if (state === null) {
      deferreds.push(deferred)
      return
    }
    asap(function() {
      var cb = state ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        (state ? deferred.resolve : deferred.reject)(value)
        return
      }
      var ret
      try {
        ret = cb(value)
      }
      catch (e) {
        deferred.reject(e)
        return
      }
      deferred.resolve(ret)
    })
  }

  function resolve(newValue) {
    try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.')
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then
        if (typeof then === 'function') {
          doResolve(then.bind(newValue), resolve, reject)
          return
        }
      }
      state = true
      value = newValue
      finale()
    } catch (e) { reject(e) }
  }

  function reject(newValue) {
    state = false
    value = newValue
    finale()
  }

  function finale() {
    for (var i = 0, len = deferreds.length; i < len; i++)
      handle(deferreds[i])
    deferreds = null
  }

  doResolve(fn, resolve, reject)
}


function Handler(onFulfilled, onRejected, resolve, reject){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.resolve = resolve
  this.reject = reject
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}

},{"asap":21}],20:[function(_dereq_,module,exports){
'use strict';

//This file contains then/promise specific extensions to the core promise API

var Promise = _dereq_('./core.js')
var asap = _dereq_('asap')

module.exports = Promise

/* Static Functions */

function ValuePromise(value) {
  this.then = function (onFulfilled) {
    if (typeof onFulfilled !== 'function') return this
    return new Promise(function (resolve, reject) {
      asap(function () {
        try {
          resolve(onFulfilled(value))
        } catch (ex) {
          reject(ex);
        }
      })
    })
  }
}
ValuePromise.prototype = Object.create(Promise.prototype)

var TRUE = new ValuePromise(true)
var FALSE = new ValuePromise(false)
var NULL = new ValuePromise(null)
var UNDEFINED = new ValuePromise(undefined)
var ZERO = new ValuePromise(0)
var EMPTYSTRING = new ValuePromise('')

Promise.from = Promise.cast = function (value) {
  if (value instanceof Promise) return value

  if (value === null) return NULL
  if (value === undefined) return UNDEFINED
  if (value === true) return TRUE
  if (value === false) return FALSE
  if (value === 0) return ZERO
  if (value === '') return EMPTYSTRING

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value))
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return new ValuePromise(value)
}
Promise.denodeify = function (fn, argumentCount) {
  argumentCount = argumentCount || Infinity
  return function () {
    var self = this
    var args = Array.prototype.slice.call(arguments)
    return new Promise(function (resolve, reject) {
      while (args.length && args.length > argumentCount) {
        args.pop()
      }
      args.push(function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
      fn.apply(self, args)
    })
  }
}
Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    try {
      return fn.apply(this, arguments).nodeify(callback)
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) { reject(ex) })
      } else {
        asap(function () {
          callback(ex)
        })
      }
    }
  }
}

Promise.all = function () {
  var args = Array.prototype.slice.call(arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : arguments)

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([])
    var remaining = args.length
    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then
          if (typeof then === 'function') {
            then.call(val, function (val) { res(i, val) }, reject)
            return
          }
        }
        args[i] = val
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex)
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i])
    }
  })
}

/* Prototype Methods */

Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this
  self.then(null, function (err) {
    asap(function () {
      throw err
    })
  })
}

Promise.prototype.nodeify = function (callback) {
  if (callback === null || typeof callback == 'undefined') return this

  this.then(function (value) {
    asap(function () {
      callback(null, value)
    })
  }, function (err) {
    asap(function () {
      callback(err)
    })
  })
}

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
}


Promise.resolve = function (value) {
  return new Promise(function (resolve) { 
    resolve(value);
  });
}

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) { 
    reject(value);
  });
}

Promise.race = function (values) {
  return new Promise(function (resolve, reject) { 
    values.map(function(value){
      Promise.cast(value).then(resolve, reject);
    })
  });
}

},{"./core.js":19,"asap":21}],21:[function(_dereq_,module,exports){
(function (process){

// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// linked list of tasks (single, with head node)
var head = {task: void 0, next: null};
var tail = head;
var flushing = false;
var requestFlush = void 0;
var isNodeJS = false;

function flush() {
    /* jshint loopfunc: true */

    while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;
        var domain = head.domain;

        if (domain) {
            head.domain = void 0;
            domain.enter();
        }

        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function() {
                   throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    flushing = false;
}

if (typeof process !== "undefined" && process.nextTick) {
    // Node.js before 0.9. Note that some fake-Node environments, like the
    // Mocha test runner, introduce a `process` global without a `nextTick`.
    isNodeJS = true;

    requestFlush = function () {
        process.nextTick(flush);
    };

} else if (typeof setImmediate === "function") {
    // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        requestFlush = setImmediate.bind(window, flush);
    } else {
        requestFlush = function () {
            setImmediate(flush);
        };
    }

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    requestFlush = function () {
        channel.port2.postMessage(0);
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
    };

    if (!flushing) {
        flushing = true;
        requestFlush();
    }
};

module.exports = asap;


}).call(this,_dereq_("/Users/scott/www/divshot/request-builder/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/Users/scott/www/divshot/request-builder/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":6}]},{},[1])
(1)
});