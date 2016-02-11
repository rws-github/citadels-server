'use-strict';

var uuid          = require("node-uuid"),
    sioClient     = require('socket.io-client'),
    fs            = require('fs');

var url = "https://localhost:3001";
var socket = sioClient(url);

var player_id = uuid.v4();
var game_id;

console.log("Connecting player " + player_id + " to " + url);

socket.on('connect', function() {
    console.log("connected with socket " + socket.id);
    socket.emit("join_game", { 'player_id': player_id });
});

socket.on('joined_game', function(message) {
    game_id = message.game_id;
    console.log("Joined game " + game_id);
});

socket.on('choose_character', function(game) {
  var card_index = Math.floor(Math.random() * game.cards.draw_cards.length);
	var message = {
		'player_id': player_id,
		'game_id': game_id,
		'character': game.cards.draw_cards[card_index]
	};
  if (!message.character) {
    console.log(JSON.stringify(game, null, 2));
  }
	console.log("choosing character: " + message.character + ' from ' + JSON.stringify(game.cards.draw_cards));
	socket.emit('choose_character', message);
});

socket.on('take_turn', function(game) {
  var player_index = game.state.current_player_index;
  var player = game.players[player_index];
	var character = game.state.current_character;
  var gold = player.gold;
  var district_cards = player.sensitive.district_cards;
  var action_taken = game.state.action_taken;
  var special_action_taken = game.state.special_action_taken;
  var played_card = game.state.played_card;
  console.log(JSON.stringify(player));

  if (!action_taken) {
    if (gold < 1) {
      // take gold when you have none
      console.log('taking gold');
    	socket.emit('take_gold', {
    		'player_id': player_id,
    		'game_id': game_id
    	});
    }
    else if (!district_cards || district_cards.length === 0) {
      // draw cards when you have none
      console.log('drawing districts');
      socket.emit('draw_district_cards', {
    		'player_id': player_id,
    		'game_id': game_id
    	});
    }
    else {
      // just take gold for now
      console.log('taking gold');
      socket.emit('take_gold', {
    		'player_id': player_id,
    		'game_id': game_id
    	});
    }
  }
  else if (!special_action_taken) {
  	if ('Assassin' === character) {
  		var target_index = Math.floor(Math.random() * game.state.assassin_targets.length);
  		var target = game.state.assassin_targets[target_index];
  		console.log('Assassin targeting ' + target);
  		var message = {
  			'player_id': player_id,
  			'game_id': game_id,
  			'target': target
  		};
  		socket.emit('take_special_action', message);
  	}
  	else if ('Thief' === character) {
  		var target_index = Math.floor(Math.random() * game.state.thief_targets.length);
  		var target = game.state.thief_targets[target_index];
  		console.log('Thief targeting ' + target);
  		var message = {
  			'player_id': player_id,
  			'game_id': game_id,
  			'target': target
  		};
  		socket.emit('take_special_action', message);
  	}
  	else if ('Magician' === character) {
      special_action_taken = true;
      // TODO implement exchange hand and swap districts cards
  	}
  	else if ('King' === character) {
      special_action_taken = true;
      // TODO implement gold for yellow districts
  	}
  	else if ('Bishop' === character) {
      special_action_taken = true;
      // TODO implement gold for blue districts
  	}
  	else if ('Merchant' === character) {
      special_action_taken = true;
      // TODO implement gold for green districts
  	}
  	else if ('Architect' === character) {
      special_action_taken = true;
      // TODO may builds up to 3 districts
  	}
  	else if ('Warlord') {
      special_action_taken = true;
      // TODO implement gold for red districts
      // TODO destroy a district by paying gold = cost -1
  	}
  }

  if (action_taken && special_action_taken) {
    var end_turn = true;
    if (!played_card) {
    	if (gold > 0 && district_cards != undefined && district_cards.length > 0) {
        // play the first one that we have gold for
        for (var card_index = 0; card_index < district_cards.length; card_index++) {
          var district_card = district_cards[card_index];
          if (district_card.cost <= gold) {
            // play it
            console.log('playing district: ' + JSON.stringify(district_card));
            socket.emit('play_district_card', {
          		'player_id': player_id,
          		'game_id': game_id,
              'card_index': card_index
          	});
            end_turn = false;
            break;
          }
        }
      }
    }

    if (end_turn) {
      console.log('ending turn\n');
    	socket.emit('end_turn', {
    		'player_id': player_id,
    		'game_id': game_id
    	});
    }
  }
});

socket.on('stop', function() {
});

socket.on('disconnect', function() {
	console.log("disconnected");// as " + socket.id);
  process.exit(1);
});
