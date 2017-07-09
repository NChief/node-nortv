var fs = require('fs');
var request = require('request');
var colors = require('colors');
var parseString = require('xml2js').parseString;
const util = require('util');

module.exports = function(client, config, plugins) {
  var files = client.nconf.get('files');
  var places = {};
  
  var saved = {};
  
  if (fs.existsSync(files + 'places.json')) {
    fs.readFile(files + 'places.json', 'utf8', function(err, data) {
      if(err) {
        console.log('unable to read places.json: ' + err);
        return;
      }
      places = JSON.parse(data);
    });
  }
  
  if (fs.existsSync(files + 'yr-saved.json')) {
    fs.readFile(files + 'yr-saved.json', 'utf8', function(err, data) {
      if(err) {
        console.log('unable to read yr-saved.json: ' + err);
        return;
      }
      saved = JSON.parse(data);
    });
  }
  
  var onMessage = function(nick, to, text, message) {
    res = text.split(' ');
    if(res[0] == '!v') {
      //console.log(saved);
      var place;
      if(res[1])
        place = res[1].toLowerCase();
      else if (saved[nick])
        place = saved[nick];
      else
        return;
      if(places[place] != null) {
        saved[nick] = place;
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
        
        fs.writeFile(files + 'yr-saved.json', JSON.stringify(saved), 'utf8', function(err) {
          if(err) {
            console.log('Unable to save yr-saved.json: ' + err);
            return;
          }
          //console.log("yr-saved.json saved.");
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