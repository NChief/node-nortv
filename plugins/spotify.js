var SpotifyWebApi = require('spotify-web-api-node');
var colors = require('colors');

module.exports = function(client, config, plugins) {
  var re = /(?:spotify:|https?:\/\/(?:open|play)\.spotify\.com\/)(track|album)[\/:]([A-Za-z0-9]+)/;
  var expires = null;
  
  var spotifyApi = new SpotifyWebApi({
    clientId : config.client_id,
    clientSecret : config.client_secret,
  });
  
  var updateCredentials = function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);
    //console.log(data.body);
    
    expires = new Date();
    expires.setSeconds(expires.getSeconds() + data.body['expires_in']);
    console.log(expires.toString());

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  };
  
  spotifyApi.clientCredentialsGrant()
    .then(updateCredentials, function(err) {
      console.log('Something went wrong when retrieving an access token', err);
    });
    
  
  
  
  
  var onMessage = function(nick, to, text, message) {
    var match = re.exec(text);
    if(match != null) {
      var id = match[2];
      var type = match[1];
      var url = '';
      if(!match[0].startsWith('http')) url = 'https://open.spotify.com/' + type + '/' + id;
      else url = 'spotify:' + type + ':' + id;
      
      var getTrackCallback = function(data) {
        if(data.statusCode == 200) {
          var artist = data.body.artists[0].name,
            tittel = data.body.name;
            album = data.body.album.name;
          client.say(to, url + ' : ' + 'Artist: '.bold + artist + ' - ' + 'Tittel: '.bold + tittel + ' | ' + 'Album: '.bold + album);
        } else {
          client.say(to, "Unable to handle request to spotify (" + data.statusCode + ')');
        }
      };
      
      var getAlbumCallback = function(data) {
        if(data.statusCode == 200) {
          var artist = data.body.artists[0].name,
            tittel = data.body.name;
            year = data.body.year;
          client.say(to, url + ' : ' + 'Artist: '.bold + artist + ' - ' + 'Tittel: '.bold + tittel + ' | ' + 'År: '.bold + year);
        } else {
          client.say(to, "Unable to handle request to spotify (" + data.statusCode + ')');
        }
      };
      
      //console.log("KEK", url, type);
      now = new Date();
      
      if(type == 'track') {
        if(now > expires) {
          console.log("EXPIRED");
          spotifyApi.clientCredentialsGrant()
            .then(updateCredentials, function(err) {
              client.say(to, 'Something went wrong when retrieving an access token: ' + err);
            }).then(function() {
              spotifyApi.getTrack(id).then(getTrackCallback).catch(function(error) {
                client.say(to, error);
              });
            });
        } else {
          spotifyApi.getTrack(id).then(getTrackCallback).catch(function(error) {
            client.say(to, error);
          });
        }
      } else if(type == 'album') {
        if(now > expires) {
          spotifyApi.clientCredentialsGrant()
            .then(updateCredentials, function(err) {
              client.say(to, 'Something went wrong when retrieving an access token: ' + err);
            }).then(function() {
              spotifyApi.getTrack(id).then(getAlbumCallback).catch(function(error) {
                client.say(to, error);
              });
            });
        } else {
          spotifyApi.getAlbum(id).then(getAlbumCallback).catch(function(error) {
            client.say(to, error);
          });
        }
      }
      
    }
  };
  
  
  module.listeners = [
    {
      type: 'message#',
      function: onMessage
    }
  ];
  
  client.addListener('message#', onMessage);
  
  return module;
}