var request = require('request');
//require('request-debug')(request);
var colors = require('colors');
var fs = require('fs');

module.exports = function(client, config, plugins) {
  
  var BASE_URL = 'https://20kiyaost7.execute-api.us-west-2.amazonaws.com/prod';
  
  var p2i = {
    'xbox': 1,
    'psn': 2,
    'steam': 3
  };
  
  var sl = {
    'Un-Ranked': 'unranked',
    'Ranked Duel 1v1': '1v1',
    'Ranked Doubles 2v2': '2v2',
    'Ranked Solo Standard 3v3': '3v3s',
    'Ranked Standard 3v3': '3v3'
  };
  
  var v2r = {
    0: 'Unranked',
    1: 'Bronze',
    2: 'Silver',
    3: 'Gold',
    4: 'Platinum',
    5: 'Diamond',
    6: 'Champion',
    7: 'Grand Champion'
  }
  
  var saved = {};
  var files = client.nconf.get('files');
  
  if (fs.existsSync(files + 'rl-saved.json')) {
    fs.readFile(files + 'rl-saved.json', 'utf8', function(err, data) {
      if(err) {
        console.log('unable to read rl-saved.json: ' + err);
        return;
      }
      saved = JSON.parse(data);
    });
  }
  
  var onMessage = function(nick, to, text, message) {
    res = text.split(' ');
    if(res[0] == '!rl') {
      var sNick = nick, platform = 'steam';
      if(res[1] != null) sNick = res[1];
      else if(saved[nick] != null) sNick = saved[nick];
      if(res[2] != null) platform = encodeURIComponent(res[2]);
      
      var options = {
        method: 'GET',
        url: BASE_URL,// + '?platform=' + platform + '&name=' + encodeURIComponent(sNick),
        qs: { platform: p2i[platform], name: sNick },
        //hostname: '20kiyaost7.execute-api.us'
        headers: {
          'X-API-Key': config.api_key,
          "Content-Type": "application/json"
        }
      }
      //console.log(options),
      
      request(options, function(error, response, body) {
        if(error) {
          console.log('error:', error);
          console.log('statusCode:', response && response.statusCode);
          client.say(to, "Greide ikke nå API");
        } else {
          if(body && body != 'Bad Request') {
            data = JSON.parse(body);
            //console.log(data);
            var usr = data.platformUserHandle;
            var statA = [];
            var srl = {};
            data.stats.forEach(function(stat) {
              if(stat.category == 'Ranked Season' && stat.label != 'Un-Ranked') {
                var label = stat.label.substr(stat.label.indexOf(" ") + 1);
                var subLabelA = stat.subLabel.split(' ');
                var div = subLabelA[0].slice(1, -1);
                var rank = subLabelA.splice(1, subLabelA.length-1).join(' ');
                statA.push((label + ': ').green + rank + ' div ' + div);
              } else if(stat.label == 'Reward Level') {
                srl.rank = v2r[stat.value];
              } else if(stat.label = 'Reward Wins') {
                srl.wins = stat.value;
              }
            });
            client.say(to, usr.bold + ' => ' + statA.join(', ') + ' | ' + 'SRL: '.bold + srl.rank + ' (Wins: ' + srl.wins + ') - ' 
              + 'https://rocketleague.tracker.network/profile/' + data.platformName + '/' + data.platformUserHandle);
          } else {
            client.say(to, 'Fant ikke bruker');
          }
        }
      });
    } else if (res[0] == '!rlsave' && res[1]) {
      saved[nick] = res[1];
      fs.writeFile(files + 'rl-saved.json', JSON.stringify(saved), 'utf8', function(err) {
        if(err) {
          console.log('Unable to save rl-saved.json: ' + err);
          return;
        }
        //console.log("rl-saved.json saved.");
        client.say(to, 'Done!');
      });
    }
  };
  
  module.listeners = [
    {
      type: 'message#',
      function: onMessage
    }
  ];
  module.commands = {
    'rl': {
      usage: "!rl [user] | ex: !rl aids",
      description: "Rocket league stats."
    },
  };
  
  client.addListener('message#', onMessage);
  
  return module;
}