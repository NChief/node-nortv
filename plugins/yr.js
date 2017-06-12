var fs = require('fs');
var request = require('request');
var colors = require('colors');
var parseString = require('xml2js').parseString;
const util = require('util');

module.exports = function(client, config, plugins) {
  var files = client.nconf.get('files');
  var places = {};
  
  if (fs.existsSync(files + 'places.json')) {
    fs.readFile(files + 'places.json', 'utf8', function(err, data) {
      if(err) {
        console.log('unable to read places.json: ' + err);
        return;
      }
      places = JSON.parse(data);
    });
  }
  
  var onMessage = function(nick, to, text, message) {
    res = text.split(' ');
    if(res[0] == '!v' && res[1]) {
      var place = res[1].toLowerCase();
      if(places[place] != null) {
        var url = places[place];
        request(url, function(error, response, body) {
          if(error) {
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);
            client.say(to, "Greide ikke nå yr");
          } else {
            parseString(body, function (err, result) {
              //console.log(result.forecast);
              //console.log(util.inspect(result, false, null));
              var location = result.weatherdata.location[0].name[0];
              var forecast = result.weatherdata.forecast[0].tabular[0].time[0];
              var temp = forecast.temperature[0].$.value + '°C';
              var winddir = forecast.windDirection[0].$.name;
              var windspeed = forecast.windSpeed[0].$.name;
              var symbol = forecast.symbol[0].$.name;
              
              var str = location + ' nå: ';
              
              client.say(to, str.bold + temp + ', ' + (symbol + ' og ' + windspeed + ' fra ' + winddir).toLowerCase());
              
              //console.log(location, temp, winddir, windspeed, symbol);
              
            });
          }
        });
      } else {
        client.say(to, "Plass ikke funnet");
      }
    }
  }
  
  
  module.listeners = [
    {
      type: 'message#',
      function: onMessage
    }
  ];
  module.commands = {
    'v': {
      usage: "!v <sted> | ex: !v gjøvik",
      description: "Været."
    }
  };
  
  client.addListener('message#', onMessage);
  
  return module;
}