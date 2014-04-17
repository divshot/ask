var mix = require('mix-into');

// Settings mixin
module.exports = mix({
  origin: function (origin) {
    if (!origin) return this.attributes.origin;
    
    this.attributes.origin = origin;
    return this;
  },
  
  header: function (name, value) {
    if (!value) return this.headers[name];
    
    this.headers[name] = value;
    return this;
  },
  
  xhrOption: function (name, value) {
    if (!value) return this.xhrOptions[name];
    
    this.xhrOptions[name] = value;
    return this;
  }
});