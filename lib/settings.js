var mix = require('mix-into');

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