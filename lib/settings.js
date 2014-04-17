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
    if (!value) return this.headers[name];
    
    this.headers[name] = value;
    return this;
  },
  
  xhrOption: function (name, value) {
    if (!this.xhrOptions) this.xhrOptions = {};
    if (!value) return this.xhrOptions[name];
    
    this.xhrOptions[name] = value;
    return this;
  },
  
  query: function (name, value) {
    if (!this.queries) this.queries = {};
    
    // Parse query string
    if (!name && !value) {
      var qs = [];
      
      Object
        .keys(this.queries)
        .forEach(function (key) {
          var value = this.query(key);
          
          if (value) qs.push(key + '=' + this.query(key));
        }, this);
      
      return qs.join('&');
    }
    
    // Add values from an object
    if (typeof name === 'object') {
      extend(this.queries, name);
      return this;
    }
    
    if (!value) return this.queries[name];
    
    this.queries[name] = value;
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