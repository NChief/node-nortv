var request = require('request');

module.exports = function(client, config, plugins) {
  var BASE_URL = 'https://www.googleapis.com/customsearch/v1';
  var REQUEST_URL = BASE_URL + '?key=' + config.key + '&cx=' + config.cx + '&gl=no&googlehost=google.no&hl=no';
  
  var onMessage = function(nick, to, text, message) {
    res = text.split(' ');
    if((res[0] == '!google' || res[0] == '!g') && res[1]) {
      var searchStr = encodeURIComponent(res.splice(1, res.length-1).join(' '));
      request(REQUEST_URL + '&q=' + searchStr, function(error, response, body) {
        if(error) {
          console.log('error:', error);
          console.log('statusCode:', response && response.statusCode);
          client.say(to, "Greide ikke nå google");
        } else {
          data = JSON.parse(body);
          //console.log(data);
          if(data.items != null && data.items.length) {
            var length = data.items.length;
            if(length > 3) length = 3;
            for(var i = 0; i < length; i++) {
              client.say(to, data.items[i].title + ' => ' + data.items[i].link);
            }
          } else {
            client.say(to, "Ingen treff");
          }
        }
      });
    }
  }
  
  
  module.listeners = [
    {
      type: 'message#',
      function: onMessage
    }
  ];
  module.commands = {
    'google': {
      usage: "!google <query> | ex: !google aids",
      description: "Searches google."
    },
    'g': {
      usage: "!g <query> | ex: !g aids",
      description: "Searches google."
    }
  };
  
  client.addListener('message#', onMessage);
  
  return module;
}