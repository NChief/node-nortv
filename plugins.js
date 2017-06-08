const EventEmitter = require('events');
//require('node-hot')

class Plugins extends EventEmitter {
  constructor(client) {
    super();
    
    this.plugins = [];
    var pluginClass = this;
    
    client.addListener('message', function (from, to, message) {
      var res = message.split(' ');
      if(res[0] == '!reload' && res[1] != null) {
        for(var i = 0; i < pluginClass.plugins.length; i++) {
          var plugin = pluginClass.plugins[i];
          if(plugin.info.file == res[1]) {
            pluginClass.reload(pluginClass.plugins.splice(i,1)[0])
          }
        }
        //pluginClass.reload(pluginClass.plugins[0]);
        //pluginClass.reload(pluginClass.plugins.splice(0,1)[0]);
      }
    });
    
    this.client = client;
    
    super.constructor();
  }
  
  add(plugin_arr) {
    var pluginClass = this;
    plugin_arr.forEach(function(plugin) {
      //console.log(plugin);
      if(!plugin.disabled) {
        var module = require(plugin.file)(pluginClass.client, plugin.config, pluginClass);
        //console.log(module);
        module.info = plugin;
        //console.log(module);
        pluginClass.plugins.push(module);
        //plugin[plugin.file] = module;
        pluginClass.emit('plugin-added', plugin);
      }
    });
  }
  
  reload(module) {
    var pluginClass = this;

    this.unload(module);
    
    var req = require(module.info.file)(this.client, module.info.config, this);
    req.info = module.info;
    this.plugins.push(req);
    this.emit('plugin-reloaded', module);
    return req;
  }
  
  unload(module) {
    var pluginClass = this;
    if(module.listeners != null && module.listeners.length) {
      module.listeners.forEach(function(data) {
        pluginClass.client.removeListener(data.type, data.function);
        pluginClass.emit('plugin-listener-removed');
      });
    }
    
    delete require.cache[require.resolve(module.info.file)];
    this.emit('plugin-unloaded', module);
  }
}

module.exports = Plugins;