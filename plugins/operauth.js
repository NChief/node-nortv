/**
 *  Plugin for Opers
 */
module.exports = function(client, config, plugins) {
  var onMessage = function(message) {
    client.send('OPER', config.nick, config.password);
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