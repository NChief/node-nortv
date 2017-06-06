/**
 *  Plugin to authenticate with NickServ
 */

module.exports = function(client, config, plugins) {
  var onMessage = function(message) {
    client.say(config.nick, 'IDENTIFY ' + config.password);
  }
  module.listeners = [
    {
      type: 'registered',
      function: onMessage
    }
  ];
  
  client.addListener('registered', onMessage);
  
  return module;
}