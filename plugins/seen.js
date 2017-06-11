var fs = require('fs');

module.exports = function(client, config, plugins) {
  var seen = {};
  var files = client.nconf.get('files');
  
  var onMessage = function(nick, to, text, message) {
    res = text.split(' ');
    if(res[0] == '!seen' && res[1]) {
      var nick = res[1].toLowerCase();
      if(seen[nick] != null) {
        var time = new Date(seen[nick].time);
        client.say(to, seen[nick].message.nick + ' was last seen ' + time.toString() + ' => ' + seen[nick].message.command + ' ' + seen[nick].message.args.join(' '));
      } else {
        client.say(to, "I have not seen " + res[1]);
      }
    }
  }
  
  var onRaw = function(message) {
    //console.log(message);
    if(message.nick != null) {
      seen[message.nick.toLowerCase()] = {
        message: message,
        time: new Date()
      };
      saveToFile();
    }
  };
  
  var saveToFile = function() {
    fs.writeFile(files + 'seen.json', JSON.stringify(seen), 'utf8', function(err) {
      if(err) {
        console.log('Unable to save seen.json: ' + err);
        return;
      }
      //console.log("seen.json saved.");
    });
  };
  
  if (fs.existsSync(files + 'seen.json')) {
    fs.readFile(files + 'seen.json', 'utf8', function(err, data) {
      if(err) {
        console.log('unable to read seen.json: ' + err);
        return;
      }
      seen = JSON.parse(data);
    });
  }
  
  //setInterval(saveToFile, 3600000); // Every hour.
 
  module.listeners = [
    {
      type: 'raw',
      function: onRaw
    },
    {
      type: 'message#',
      function: onMessage
    }
  ];
  module.commands = {
    'seen': {
      usage: "!seen <nick> | ex: !seen mordi",
      description: "last seen."
    }
  };
  
  client.addListener('raw', onRaw);
  client.addListener('message#', onMessage);
  return module;
}