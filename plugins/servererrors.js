/**
 *  Plugin to output server errors.
 */
module.exports = function(client, config) {
  client.addListener('raw', function(message) {
    if(message.commandType == 'error') {
      if(config.debug) console.error('SERVERERROR:', message.args[1]);
      else console.error('SERVERERROR:', message);
    }
  });
  
  return module;
}