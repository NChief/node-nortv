var api = require('twitch-api-v5');
const { URL } = require('url');
var fs = require('fs');

module.exports = function(client, config, plugins) {
  api.clientID = config.client_id;
  
  /*var twitch = new TwitchApi({
    clientId: config.client_id,
    clientSecret: config.client_secret,
    redirectUri: config.redirect_uri,
    scopes: ['user_read', 'user_follows_edit']
  });*/
  
  var authUrl = 'https://api.twitch.tv/kraken/oauth2/authorize?response_type=code&client_id='+api.clientID+'&redirect_uri='+config.redirect_uri+'&scope=user_read+user_follows_edit';
  
  var admins = client.nconf.get('admins');
  var files = client.nconf.get('files');
  
  var awaitingResponse = false;
  var accessToken = null;
  var user = null;
  
  var checkTokenCB = function(err, body) {
    if(err) {
      console.log('unable to access twitch');
      accessToken = null;
    } else {
      if(body.token.valid) {
        user = {
          name: body.token.user_name,
          id: body.token.user_id
        };
      } else {
        console.log('invalid token');
        accessToken = null;
      }
    }
    console.log(err,body, user);
  }
  
  fs.readFile(files + 'twitch.access_token', 'utf8', function(err, data) {
    if(!err) {
      accessToken = data;
      
      api.auth.checkToken({auth: accessToken}, checkTokenCB);
      
    }
    console.log("access_token", accessToken);
  });
  
  
  var onPm = function(nick, text, message) {
    console.log(text, message);
    if(admins[nick] != null && accessToken == null) { // is admin
      var res = text.split(' ');
      if(res[0] == '!twitchAuth' && !awaitingResponse) {
        client.say(nick, 'Click on the following URL, authorize the application and respond back with the URL you get redirected to.');
        client.say(nick, authUrl);
        awaitingResponse = true;
      } else if(awaitingResponse) {
        try {
          const myURL = new URL(text);
          var code = myURL.searchParams.get('code');
          console.log("code:", code);
          if(code != null) {
            api.auth.getAccessToken({clientSecret: config.client_secret, redirectURI: config.redirect_uri, code: code}, (err, body) => {
              if(err) {
                console.log(err);
                client.say(nick, 'There was an error obtaining your access token..');
              } else {
                console.log(body);
                accessToken = body.access_token;
                if(accessToken) {
                  fs.writeFile(files + 'twitch.access_token', accessToken, 'utf8', function(err) {
                    if(err) {
                      client.say(nick, 'Unable to save your access token to "' + files + 'twitch.access_token"');
                      console.log(err);
                      accessToken = null;
                    }
                    
                    client.say(nick, 'Authorization success!');
                  });
                } else {
                  client.say(nick, 'There was an error obtaining your access token..');
                  console.log(body);
                }
                awaitingResponse = false;
              }
            });
          } else {
            client.say(nick, 'code is missing in URL. Wrong URL? the auth URL is: ' + authUrl);
          }
        } catch (e) {
          client.say(nick, 'Invalid URL, try again. The auth URL is: ' + authUrl);
        }
      }
    }
  };
  
  var streamToStr = function(stream, nourl) {
    var out = "\002"+ stream.channel.display_name +"\002 spiller \002"+ stream.game +"\002 med \002"+ stream.viewers +"\002 seere ("+ stream.channel.status +")";
    if (!nourl) out += ' - ' + stream.channel.url;
    return out;
  };
  
  
  
  var onMessage = function(nick, to, text, message) {
    
    var channelStreamCallback = function(err, body) {
      if(err) {
        client.say(to, 'Greide ikke hente info.');
        return;
      }
      
      console.log(body);
      
      if(body.stream) {
        if(body.stream.stream_type == 'live')
            client.say(to, streamToStr(body.stream, text.charAt(0) == '!' ? false : true));
        else client.say(to, channel + ' streamer ikke live nå');
      } else {
        client.say(to, channel + ' streamer ikke nå');
      }
    };
    
    var getUserChannelStreamCallback = function(err, body) {
      if(!err) {
        if(body._id)
          api.streams.channel({channelID: body._id}, channelStreamCallback);
        else
          client.say(to, 'Unknown user');
      } else {
        client.say(to, 'Unable to access twitch');
      }
    }
    
    res = text.split(' ');
    res[0] = res[0].toLowerCase();
    if(res[0] == '!twitch') {
      if(accessToken == null) {
        client.say(to, 'Client not authenticated with twitch.');
        return;
      }
      if(res[1] == null) {
        api.streams.followed({auth: accessToken}, (err, body) => {
          if(err) {
            client.say(to, 'Greide ikke hente liste.');
            return;
          }
          //console.log(body);
          if(body.streams != null && body.streams.length) {
            client.say(to, 'Channels currently streaming:');
            body.streams.forEach(function(stream) {
              if(stream.stream_type == 'live')
                client.say(to, streamToStr(stream));
            });
          } else {
            client.say(to, 'No channels streaming.');
          }
        });
      } else { // !twitch channel
        var channel = res[1];
        api.other.getUser({channelName: channel}, getUserChannelStreamCallback);
      }
    } 
    
    var re = /(?:www\.|\s|^)twitch.tv\/(\S+?)(?:\/|$|\s)/;
    var match = re.exec(text);
    if(match) {
      var channel = match[1];
      api.other.getUser({channelName: channel}, getUserChannelStreamCallback);
    }
    
    if(res[0] == '!follow' && res[1] != null) {
      //twitch.userFollowChannel();
      api.other.getUser({channelName: res[1]}, (err, body) => {
        if(!err) {
          if(body._id)
            //api.streams.channel({channelID: body._id}, channelStreamCallback);
            api.users.followChannel({auth: accessToken, userID: user.id, channelID: body._id}, (err, body) => {
              if(!err) client.say(to, 'Channel followed');
              else client.say(to, 'Unable to follow');
            });
          else
            client.say(to, 'Unknown user');
        } else {
          client.say(to, 'Unable to follow [1]');
        }
      });
    } else if(res[0] == '!unfollow' && res[1] != null) {
      api.other.getUser({channelName: res[1]}, (err, body) => {
        if(!err) {
          if(body._id)
            //api.streams.channel({channelID: body._id}, channelStreamCallback);
            api.users.unfollowChannel({auth: accessToken, userID: user.id, channelID: body._id}, (err, body) => {
              if(err.statusCode == 204) client.say(to, 'Channel unfollowed');
              else {client.say(to, 'Unable to unfollow'); console.log(err)}
            });
          else
            client.say(to, 'Unknown user');
        } else {
          client.say(to, 'Unable to unfollow [1]');
        }
      });
    } else if(res[0] == '!following') {
      api.users.follows({userID: user.id}, (err, body) => {
        if(!err) {
          if(body._total) {
            var channels = [];
            body.follows.forEach(function(channel) {
              console.log(channel);
              channels.push(channel.channel.display_name);
            });
            console.log(channels);
            client.say(to, 'You are following: ' + channels.join(', '));
          }
        } else {
          console.log(err);
        }
      });
    } else if(res[0] == '!twitchrandom') {
      api.other.randomStream({},(err, body) => {
        console.log(err,body);
      });
    }
  };
  
  
  module.listeners = [
    {
      type: 'pm',
      function: onPm
    },
    {
      type: 'message#',
      function: onMessage
    }
  ];
  client.addListener('pm', onPm);
  client.addListener('message#', onMessage);
  
  return module;
}