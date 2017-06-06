/**
 *  Plugin to authenticate with NickServ
 */

module.exports = function(client, config, plugins) {
  client.addListener('registered' function(message) {
    client.say(config.nick, 'IDENTIFY ' + config.password);
  });
  
  return module;
}