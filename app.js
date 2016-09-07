var config = require('./config.js'),
    telegram = require('telegram-bot-api'),
    SteamTotp = require('steam-totp'),
    fs = require('fs');

var api = new telegram({
  token: config.apiKey,
  updates: {
    enabled: true
  }
});

var commands = {
  'start':  'Hello, I\'m steam totp bot! I will generate steam codes for you! You can set keys by: /set <name> ' + 
            '<shared_secret>. After this you can do /code <name>',
  'set': 'Your shared_secret for ?? has been saved',
  'code': 'Your code: ??'
};

console.log('telegram steam totp bot is running..');

api.on('message', function(message)
{
  if(message.text[0] == '/') {
    words = message.text.slice(1).split(' ');
    parseCommand(message.from.id, words[0], words.slice(1));
  }
});

var parseCommand = function(id, command, argumets) {
  if(argumets == undefined)
    argumets = [];
  if(commands[command] == undefined) {
    return response(id, 'Command /' + command + ' not found.')
  }

  if(command == 'start') {
    return responseCommand(id, command);
  }

  if(command == 'set') {
    if(argumets.length < 2)
      return response(id, 'You should run command /set <name> <shared_secret>.');
    data = JSON.parse(fs.readFileSync(config.filename));
    data[[id,argumets[0]].join('@@@')] = argumets[1];
    fs.writeFileSync(config.filename, JSON.stringify(data));
    return responseCommand(id, command, argumets[0]);
  }

  if(command == 'code') {
    data = JSON.parse(fs.readFileSync(config.filename));
    if(argumets.length < 1)
      return response(id, 'You should run command /code <name>');
    if(data[[id,argumets[0]].join('@@@')] == undefined) 
      return response(id, 'Code for ' + argumets[0] + ' doesn\'t exist. You can set it by /set <name> <shared_secret>.');
    return responseCommand(id, command, SteamTotp.generateAuthCode(data[[id,argumets[0]].join('@@@')]));
  }
};

var response = function(id, message) {
  api.sendMessage({
    chat_id: id,
    text: message
  });
};

var responseCommand = function(id, command, arg) {
  if(arg) {
    return response(id, commands[command].replace('??', arg));
  } else {
    return response(id, commands[command])
  }
}

