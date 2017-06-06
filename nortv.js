//require('node-hot')
var irc = require('irc');
var nconf = require('nconf');
var Plugins = require('./plugins.js');
//import Plugins from './plugins.js';

nconf.argv().file('./config.json');

var serverinfo = nconf.get('serverinfo');

var client = new irc.Client(serverinfo.server, serverinfo.nick, serverinfo.options);

// Dont't fail on error, output it.
client.addListener('error', function(message) {
    console.log('error: ', message);
});

var plugins = new Plugins(client);
//var pluginss = new Plugins(nconf.get('plugins'), client);
plugins.add(nconf.get('plugins'));

// Load plugins.
/*
var plugins = nconf.get('plugins');
plugins.forEach(function(plugin) {
  if(!plugin.disabled) require(plugin.file)(client, plugin.config);
});
*/

client.connect();

console.log("Started!");