/**
 *  Plugin for Opers
 */
module.exports = function(client, config) {
  client.addListener('registered', function(message) {
    client.send('OPER', config.nick, config.password);
  });
  
  return module;
}