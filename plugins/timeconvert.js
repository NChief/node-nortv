module.exports = function(client, config, plugins) {
  var onMessage = function(nick, to, text, message) {
    res = text.split(' ');
    if(res[0] == '!time' && res[1]) {
      var timeStr = res.splice(1, res.length-1).join(' ');
      console.log(timeStr);
      var date = new Date(new Date().toDateString() + ' ' + timeStr).toTimeString();
      client.say(to, "\002Time:\002 " + date);
    }
  }
  
  
  module.listeners = [
    {
      type: 'message#',
      function: onMessage
    }
  ];
  module.commands = {
    'time': {
      usage: "!time <time> <timezone> | ex: !time 12:00 PDT",
      description: "Converts a time from a timezone to local time."
    }
  };
  
  client.addListener('message#', onMessage);
  
  return module;
}