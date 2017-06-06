/**
 *  Plugin for Opers
 */
module.exports = function(client, config, plugins) {
  client.addListener('registered', function(message) {
    client.send('OPER', config.nick, config.password);
  });
  
  return module;
}