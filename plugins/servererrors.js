/**
 *  Plugin to output server errors.
 */
module.exports = function(client, config, plugins) {
  var onMessage = function(message) {
    if(message.commandType == 'error') {
      if(config.debug) console.error('SERVERERROR:', message.args[1]);
      else console.error('SERVERERROR:', message);
    }
  }
  module.listeners = [
    {
      type: 'raw',
      function: onMessage
    }
  ];
  
  client.addListener('raw', onMessage);
  
  return module;
}