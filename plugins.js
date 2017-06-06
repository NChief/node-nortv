const EventEmitter = require('events');
//require('node-hot')

class Plugins extends EventEmitter {
  constructor(client) {
    super();
    
    this.client = client;
    
    /*
    var pluginClass = this;
    var plugins = [];
    plugin_arr.forEach(function(plugin) {
      if(!plugin.disabled) {
        plugins.push(require(plugin.file)(client, plugin.config, pluginClass));
        pluginClass.emit('plugin-added', plugin);
      }
    });
    this.plugins = plugins;
    */
    
    super.constructor();
  }
  
  add(plugin_arr) {
    var pluginClass = this;
    var plugins = [];
    plugin_arr.forEach(function(plugin) {
      if(!plugin.disabled) {
        plugins.push(require(plugin.file)(pluginClass.client, plugin.config, pluginClass));
        pluginClass.emit('plugin-added', plugin);
      }
    });
    this.plugins = plugins;
  }
  
}

module.exports = Plugins;