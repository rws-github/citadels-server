'use-strict';

var card_util      = require('./card_util');
var game_store     = require('./game_store');
var DistrictDeck   = require('./district_deck');

var Game = function Game(_game_state) {
	this.game_state = _game_state;
};

Game.prototype.init = function() {
	var self = this;
	self.game_state.all_cards = card_util.all_cards;
	self.game_state.crown = self.game_state.players[0].id;
	self.game_state.state = {
		'sensitive': {
			'district_cards': new DistrictDeck().shuffle()
		}
	};
};

Game.prototype.getPlayerIndex = function(player_id) {
	var self = this;
	for (i = 0; i < self.game_state.players.length; i++) {
		if (player_id === self.game_state.players[i].id) {
			return i;
		}
	}
	return -1;
}

Game.prototype.getPlayerByCharacter = function(character) {
	var self = this;
	for (i = 0; i < self.game_state.players.length; i++) {
		if (character === self.game_state.players[i].character) {
			return i;
		}
	}
	return -1;
}

Game.prototype.startCharacterSelection = function(io, user_to_socket_id) {
	var self = this;
	self.game_state.state.mode = 'character_selection';
	self.game_state.state.current_player_id = self.game_state.crown;
	delete self.game_state.state.current_player_index;
	delete self.game_state.state.current_character;
	self.game_state.cards = card_util.shuffle(self.game_state.players.length);
	game_store.updateDoc(self, self.game_state._id, function(error, result) {
		if (error) {
			console.error(error);
			return;
		}
		var current_player_id = self.game_state.state.current_player_id;
		console.log("sending 'choose_character' to player " + shortId(current_player_id));
		var socket_id = user_to_socket_id[current_player_id];
		var game_data = self.obfuscateForPlayerId(current_player_id);
	//	console.log("sending 'choose_character' to socket " + socket_id);
		io.to(socket_id).emit('choose_character', game_data);
	});
}

Game.prototype.nextPlayerForCharacterSelection = function(current_player_index) {
	var self = this;
	var next_player_index = current_player_index + 1;
	if (next_player_index >= self.game_state.players.length) {
		next_player_index = 0;
	}
	if (self.game_state.players[next_player_index].character) {
		// next player has already selected a character -> done with character selection, return -1
		return -1;
	}
	else {
		return next_player_index;
	}
}

Game.prototype.startPlayerTurns = function(io, user_to_socket_id) {
	var self = this;
	// TODO clear out the state - maybe introduce a turn_state that we reset
	self.game_state.state.mode = 'player_turns';
	delete self.game_state.state.current_player_id;
	delete self.game_state.state.current_player_index;
	delete self.game_state.state.current_character;
	self.setTurnToNextPlayer();
	self.saveGameAndNotifyOfTurn(io, user_to_socket_id);
};

Game.prototype.findPlayerWithNextTurn = function() {
	var self = this;
	var character_index = 0;
	var current_player_id = self.game_state.state.current_player_id;
	if (current_player_id) {
		var current_player_index = self.getPlayerIndex(current_player_id);
		var current_character = self.game_state.players[current_player_index].character;
		character_index = card_util.indexByName(current_character) + 1;
	}
//	console.log('character_index: ' + character_index);
//	console.log('current_player_id: ' + current_player_id);

	if (character_index > card_util.all_cards.length) {
		return null;
	}

	var next_player_id = null;
	while (!next_player_id && character_index < card_util.all_cards.length) {
		var next_character = card_util.all_cards[character_index++];
		var next_player_index = self.getPlayerByCharacter(next_character);
		if (next_player_index >= 0) {
			next_player_id = self.game_state.players[next_player_index].id;
//			console.log('next_player_id: ' + next_player_id);
		}
	}
	return next_player_id;
}

Game.prototype.setTurnToNextPlayer = function() {
	var self = this;
	var next_player_id = self.findPlayerWithNextTurn();
	if (next_player_id) {
		self.game_state.state.current_player_id = next_player_id;
		var next_player_index = self.getPlayerIndex(next_player_id);
		self.game_state.state.current_player_index = next_player_index;
		var character = self.game_state.players[next_player_index].character;
		self.game_state.state.current_character = character;
		console.log('current_character: ' + self.game_state.state.current_character);
		self.game_state.state.action_taken = false;
		self.game_state.state.special_action_taken = false;
		self.game_state.state.played_card = false;
		if (self.game_state.state.thief_target && self.game_state.state.thief_target === character) {
			self.stealGold();
		}
		if (self.game_state.state.assassin_target && self.game_state.state.assassin_target === character) {
			// skip character, assassinated
			return self.setTurnToNextPlayer();
		}
		// TODO if the character is the target of another special action, handle it here
	}
	return next_player_id;
};

Game.prototype.endPlayerTurns = function(io, user_to_socket_id) {
	var self = this;
	// reposition the crown to the King and reset characters
	var players = self.game_state.players;
	for (var player_index = 0; player_index < players.length; player_index++) {
		var player = players[player_index];
		if (card_util.all_cards[3] === player.character) {
			self.game_state.state.crown = player.id;
		}
		delete player.character;
	}
	// game ends if any player has at least 8 districts
	if (self.isGameOver()) {
		console.log('game over: ' + shortId(self.game_state._id));
		// TODO calculate score fully
		// - first to 8 is worth 4 points
		// - all others with at least 8 get 2 points
		// - at least one of each color is 3 points
		for (var player_index = 0; player_index < self.game_state.players.length; player_index++) {
			var player = self.game_state.players[player_index];
			var score = player.gold;
			if (player.district_cards.length >= 8) {
				score += 2; // TODO only if not the first to 8
			}
			for (var card_index = 0; card_index < player.district_cards.length; card_index++) {
				score += player.district_cards[card_index].cost;
			}
			console.log('player ' + shortId(player.id) + ' scores ' + score);
			player.score = score;
		}
		// TODO notify players of game end and scores
	}
	else {
		self.startCharacterSelection(io, user_to_socket_id);
	}
};

Game.prototype.isGameOver = function() {
	var self = this;
	for (var player_index = 0; player_index < self.game_state.players.length; player_index++) {
		var player = self.game_state.players[player_index];
		if (player.district_cards && player.district_cards.length >= 8) {
			return true;
		}
	}
	return false;
};

/**
 *  Transfer gold from the current player to the Thief.
 */
Game.prototype.stealGold = function() {
	var self = this;
	var thief_index = self.getPlayerByCharacter(card_util.all_cards[1]);
	if (thief_index >= 0) {
		var current_player_index = self.getPlayerIndex(self.game_state.state.current_player_id);
		self.game_state.players[thief_index].gold += self.game_state.players[current_player_index].gold;
		self.game_state.players[current_player_index].gold = 0;
	}
};

Game.prototype.saveGameAndNotifyOfTurn = function(io, user_to_socket_id) {
	var self = this;
	var player_id = self.game_state.state.current_player_id;
	var player_index = self.getPlayerIndex(player_id);
	var character = self.game_state.players[player_index].character;

  game_store.updateDoc(self, self.game_state._id, function(error, result) {
  	if (error) {
  		console.error(error);
  		return;
  	}

  	if (!self.game_state.state.special_action_taken) {
    	if (card_util.all_cards[0] === character) { // Assassin
    		self.game_state.state.assassin_targets = card_util.getAssassinTargets(self.game_state.cards);
    	}
    	else if (card_util.all_cards[1] === character) { // Thief
    		self.game_state.state.thief_targets = card_util.getThiefTargets(self.game_state.cards, self.game_state.state.assassin_target);
    	}
  	}

		var socket_id = user_to_socket_id[player_id];
		io.to(socket_id).emit('take_turn', self.obfuscateForPlayerId(player_id));
  });
};

Game.prototype.obfuscateForPlayerId = function(player_id) {
	var self = this;
	// deep copy
	var obfuscated_game_state = JSON.parse(JSON.stringify(self.game_state));
//	if (obfuscated_game_state.state.current_player_id) {
//		delete obfuscated_game_state.state.current_player_id;
//	}
	for (var player_index = 0; player_index < obfuscated_game_state.players.length; player_index++) {
		if (player_id !== obfuscated_game_state.players[player_index].id) {
			if (obfuscated_game_state.players[player_index].sensitive) {
				delete obfuscated_game_state.players[player_index].sensitive;
			}
		}
	}
	if (obfuscated_game_state.state.sensitive) {
		delete obfuscated_game_state.state.sensitive;
	}
  // console.log("sending: " + JSON.stringify(obfuscated_game_state, null, 2));
	return obfuscated_game_state;
}

var shortId = function(id) {
  return id.substring(0, 8);
};

module.exports = Game;
