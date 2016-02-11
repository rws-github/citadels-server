'use-strict';

var game_store = require('./game_store');
var card_util  = require('./card_util');
var DistrictDeck = require('./district_deck');

var chooseCharacter = function(io, user_to_socket_id, message) {
	var player_id = message.player_id;
	var game_id = message.game_id;
	var character = message.character;
	console.log('player ' + shortId(player_id) + ' selects ' + character);
	game_store.getDoc(game_id, function(error, game) {
		if (error) {
			console.error(error);
			// TODO send exception
			return;
		}
		if (player_id !== game.game_state.state.current_player_id) {
			console.error('wrong player ' + shortId(player_id) + ' attempting character selection. expected player ' +
					shortId(game.game_state.state.current_player_id));
			// TODO send exception
			return;
		}
		if (!card_util.isAvailable(game.game_state.cards, character)) {
			console.error('player ' + shortId(player_id) + ' selected unavailable character ' + character);
			// TODO send exception
			return;
		}
		// remove available card and assign to player
		card_util.selectCard(game.game_state.cards, character);

		var player_index = game.getPlayerIndex(player_id);
		game.game_state.players[player_index].character = character;

		// next player selects character or done with character selection
		var next_player_index = game.nextPlayerForCharacterSelection(player_index);
		if (next_player_index === -1) {
			console.log('character selection complete. starting player turns.');
			card_util.completeSelection(game.game_state.cards);

			// done with character selection -> go on to turns
			game.startPlayerTurns(io, user_to_socket_id);
		}
		else {
			var next_player_id = game.game_state.players[next_player_index].id;
			game.game_state.state.current_player_id = next_player_id;
			game.game_state.state.current_player_index = next_player_index;

		    game_store.updateDoc(game, game.game_state._id, function(error, result) {
		    	if (error) {
		    		console.error(error);
		    		return;
		    	}
				var socket_id = user_to_socket_id[next_player_id];
				io.to(socket_id).emit('choose_character', game.obfuscateForPlayerId(next_player_id));
		    });
		}
	});
};

var specialAction = function(io, user_to_socket_id, message) {
	var player_id = message.player_id;
	var game_id = message.game_id;
	game_store.getDoc(game_id, function(error, game) {
		if (error) {
			console.error(error);
			// TODO send exception
			return;
		}
		if (player_id !== game.game_state.state.current_player_id) {
			console.error('wrong player ' + shortId(player_id) + ' attempting special action. expected player ' +
					shortId(game.game_state.state.current_player_id));
			// TODO send exception
			return;
		}
		else if (game.game_state.state.special_action_taken) {
			console.error('special action already taken by ' + shortId(player_id));
			// TODO send exception
			return;
		}

		var player_index = game.getPlayerIndex(player_id);
		var player = game.game_state.players[player_index];
		var character = player.character;

		if (card_util.all_cards[0] === character) { // Assassin
			assassinSpecialAction(io, user_to_socket_id, message, game, player_id);
		}
		else if (card_util.all_cards[1] === character) { // Thief
			thiefSpecialAction(io, user_to_socket_id, message, game, player_id);
		}
		else if (card_util.all_cards[2] === character) { // Magician
			magicianSpecialAction(io, user_to_socket_id, message, game, player_id);
		}
		else if (card_util.all_cards[7] === character) { // Warlord
			warlordSpecialAction(io, user_to_socket_id, message, game, player_id);
		}
	});
};

var assassinSpecialAction = function(io, user_to_socket_id, message, game, player_id) {
	var target = message.target;
	if (card_util.getAssassinTargets(game.game_state.cards).indexOf(target) < 0) {
		console.error('invalid Assassin target: ' + target);
		// TODO send exception
		return;
	}
	game.game_state.state.assassin_target = target;
	game.game_state.state.special_action_taken = true;
	console.log('player ' + shortId(player_id) + ' as Assassin is assassinating ' + target);
	game.saveGameAndNotifyOfTurn(io, user_to_socket_id);
};

var thiefSpecialAction = function(io, user_to_socket_id, message, game, player_id) {
	var target = message.target;
	if (card_util.getThiefTargets(game.game_state.cards).indexOf(target) < 0) {
		console.error('invalid Thief target: ' + target);
		// TODO send exception
		return;
	}
	game.game_state.state.thief_target = target;
	game.game_state.state.special_action_taken = true;
	console.log('player ' + shortId(player_id) + ' as Thief is stealing from ' + target);
	game.saveGameAndNotifyOfTurn(io, user_to_socket_id);
};

var magicianSpecialAction = function(io, user_to_socket_id, message, game, player_id) {
	// TODO implement exchange hand and swap districts cards
	var action = message.action;
	if ('exchange_with_player' === action) {
		var target = message.target; // player id to exchange with
		var target_index = game.getPlayerIndex(target);
		if (target_index < 0) {
			console.error('invalid Magician player target: ' + target);
			// TODO send exception
			return;
		}
		console.log('player ' + shortId(player_id) + ' as Magician is exchanging hands with ' + shortId(target));
		var exchange_cards = game.game_state.players[target_index].sensitive.district_cards;
		game.game_state.players[target_index].sensitive.district_cards = game.game_state.players[player_index].sensitive.district_cards;
		game.game_state.players[player_index].sensitive.district_cards = exchange_cards;
		game.game_state.state.special_action_taken = true;
		game.saveGameAndNotifyOfTurn(io, user_to_socket_id);
	}
	else if ('exchange_with_deck' === action) {
		var cards = message.cards; // can't send cards, they will not be uniques. need to use indexes
		var cards_length = cards.length;
		console.log('player ' + shortId(player_id) + ' as Magician is exchanging ' + cards_length + ' cards');
		var hand = game.game_state.players[player_index].sensitive.district_cards;
		var district_deck = new DistrictDeck(game.game_state.sensitive.district_cards);
		for (var card_index = cards.length - 1; card_index >= 0; card_index--) {
			var hand_index = cards[card_index];
			var exchange_card = hand.splice(hand_index, 1)
			var exchanged_card = district_deck.exchange(exchange_card);
			hand.push(exchanged_card);
			console.log('player ' + shortId(player_id) + ' as Magician exchanged ' + exchange_card + ' for ' + exchanged_card);
			game.game_state.state.special_action_taken = true;
			game.saveGameAndNotifyOfTurn(io, user_to_socket_id);
		}
	}
	else {
		console.error('invalid Magician special action: ' + action);
		// TODO send exception
		return;
	}
};

var warlordSpecialAction = function(io, user_to_socket_id, message, game, player_id) {
	var player_index = game.getPlayerIndex(player_id);
	var player = game.game_state.players[player_index];
	var target = message.target;
	var district_index = message.district_index;

	var target_index = game.getPlayerIndex(target);
	if (target_index < 0) {
		console.error('invalid Warlord player target: ' + target);
		// TODO send exception
		return;
	}
	var target_player = game.players[target_index];
	if (card_util.all_cards[4] === target_player.character) {
		console.error('invalid Warlord player target: Bishop');
		// TODO send exception
		return;
	}
	if (target_player.district_cards.length >= 8) {
		console.error('invalid Warlord district target: complete city');
		// TODO send exception
		return;
	}
	if (district_index < 0 || district_index >= target_player.district_cards.length) {
		console.error('invalid Warlord district target: ' + district_index);
		// TODO send exception
		return;
	}
	var district = target_player.district_cards[district_index];
	if (district.cost -1 > player.gold) {
		console.error('invalid Warlord district target due to cost: ' + district_index);
		// TODO send exception
		return;
	}
	target_player.district_cards.splice[district_index, 1];
	player.gold -= district.cost - 1;
	console.log('player ' + shortId(player_id) + ' as Warlord destroys ' + shortId(target) + ' district ' + JSON.stringify(district));
	game.game_state.state.special_action_taken = true;
	game.saveGameAndNotifyOfTurn(io, user_to_socket_id);
};

var takeGold = function(io, user_to_socket_id, message) {
	var player_id = message.player_id;
	var game_id = message.game_id;
	game_store.getDoc(game_id, function(error, game) {
		if (error) {
			console.error(error);
			// TODO send exception
			return;
		}
		if (player_id !== game.game_state.state.current_player_id) {
			console.error('wrong player ' + shortId(player_id) + ' attempting action. expected player ' +
					shortId(game.game_state.state.current_player_id));
			// TODO send exception
			return;
		}
		else if (game.game_state.state.action_taken) {
			console.error('action already taken by ' + shortId(player_id));
			// TODO send exception
			return;
		}

		var player_index = game.getPlayerIndex(player_id);
		var player = game.game_state.players[player_index];

		console.log('player ' + shortId(player_id) + ' is taking 2 gold');
		if (!player.gold) {
			player.gold = 0;
		}
		player.gold += 2;
		actionTakenPreSave(game, player);
		game.saveGameAndNotifyOfTurn(io, user_to_socket_id);
	});
};

var actionTakenPreSave = function(game, player) {
	var player_id = player.id;
	var character = player.character;

	// King gets 1 gold per yellow district
	if (card_util.all_cards[3] === character) {
		var gold = 0;
		for (var index = 0; index < player.district_cards.length; index++) {
			var district_card = player.district_cards[index];
			if ('yellow' === district_card.color) {
				gold += 1;
			}
		}
		console.log('player ' + shortId(player_id) + ' as King collects ' + gold + ' gold for yellow districts');
		player.gold += gold;
	}
	// Bishop get 1 gold per blue district
	if (card_util.all_cards[4] === character) {
		var gold = 0;
		for (var index = 0; index < player.district_cards.length; index++) {
			var district_card = player.district_cards[index];
			if ('blue' === district_card.color) {
				gold += 1;
			}
		}
		console.log('player ' + shortId(player_id) + ' as Bishop collects ' + gold + ' gold for blue districts');
		player.gold += gold;
	}
	// Merchant get 1 extra gold
	// Merchant get 1 gold per green district
	else if (card_util.all_cards[5] === character) {
		player.gold += 1;
		console.log('player ' + shortId(player_id) + ' as Merchant collects 1 extra gold');

		var gold = 0;
		for (var index = 0; index < player.district_cards.length; index++) {
			var district_card = player.district_cards[index];
			if ('green' === district_card.color) {
				gold += 1;
			}
		}
		console.log('player ' + shortId(player_id) + ' as Merchant collects ' + gold + ' gold for green districts');
		player.gold += gold;
	}
	// Architect draws 2 additional cards
	else if (card_util.all_cards[6] === character) {
		var district_cards = new DistrictDeck(game.game_state.state.sensitive.district_cards);
		var drawn_cards = district_cards.draw(2);
		console.log('player ' + shortId(player_id) + ' as Architect additionally drew ' + JSON.stringify(drawn_cards));
		if (!player.sensitive.district_cards) {
			player.sensitive.district_cards = [];
		}
		player.sensitive.district_cards.push(drawn_cards[0]);
		player.sensitive.district_cards.push(drawn_cards[1]);
	}
	// Warlord get 1 gold per red district
	else if (card_util.all_cards[7] === character) {
		var gold = 0;
		for (var index = 0; index < player.district_cards.length; index++) {
			var district_card = player.district_cards[index];
			if ('red' === district_card.color) {
				gold += 1;
			}
		}
		console.log('player ' + shortId(player_id) + ' as Warlord collects ' + gold + ' gold for red districts');
		player.gold += gold;
	}
	game.game_state.state.action_taken = true;
};

var drawDistrictCards = function(io, user_to_socket_id, message) {
	var player_id = message.player_id;
	var game_id = message.game_id;
	game_store.getDoc(game_id, function(error, game) {
		if (error) {
			console.error(error);
			// TODO send exception
			return;
		}
		if (player_id !== game.game_state.state.current_player_id) {
			console.error('wrong player ' + shortId(player_id) + ' attempting action. expected player ' +
					shortId(game.game_state.state.current_player_id));
			// TODO send exception
			return;
		}
		else if (game.game_state.state.action_taken) {
			console.error('action already taken by ' + shortId(player_id));
			// TODO send exception
			return;
		}

		var player_index = game.getPlayerIndex(player_id);
		var player = game.game_state.players[player_index];
		console.log('player ' + shortId(player_id) + ' is drawing district cards');
		var district_cards = new DistrictDeck(game.game_state.state.sensitive.district_cards);
		var drawn_cards = district_cards.draw(2);
		console.log('player ' + shortId(player_id) + ' drew ' + JSON.stringify(drawn_cards));
		if (!player.sensitive.district_cards) {
			player.sensitive.district_cards = [];
		}
		player.sensitive.district_cards.push(drawn_cards[0]);
		player.sensitive.district_cards.push(drawn_cards[1]);
		actionTakenPreSave(game, player);
		game.saveGameAndNotifyOfTurn(io, user_to_socket_id);
	});
};

/**
 * Player a district card.
 * Expecting message:
{
  'player_id': 'player1',
	'game_id: 'game1',
	'card_index': 0
}
 */
var playDistrictCard = function(io, user_to_socket_id, message) {
	var player_id = message.player_id;
	var game_id = message.game_id;
	game_store.getDoc(game_id, function(error, game) {
		if (error) {
			console.error(error);
			// TODO send exception
			return;
		}
		if (player_id !== game.game_state.state.current_player_id) {
			console.error('wrong player ' + shortId(player_id) + ' attempting district card play. expected player ' +
					shortId(game.game_state.state.current_player_id));
			// TODO send exception
			return;
		}
		else if (game.game_state.state.played_card) {
			console.error('district cards already played by ' + shortId(player_id));
			// TODO send exception
			return;
		}

		var player_index = game.getPlayerIndex(player_id);
		var player = game.game_state.players[player_index];
		var district_cards = player.sensitive.district_cards;

		var card_index = message.card_index;
		if (card_index < 0 || card_index >= district_cards.length) {
			console.error('district card selected is not in the hand of ' + shortId(player_id));
			// TODO send exception
			return;
		}

		var district_card =	district_cards.splice(card_index, 1)[0];
		if (district_card.cost > player.gold) {
			console.error('not enough gold to play district card selected by player ' + shortId(player_id));
			// TODO send exception
			return;
		}

		console.log('player ' + shortId(player_id) + ' is playing district ' + JSON.stringify(district_card));
		if (!player.district_cards) {
			player.district_cards = [];
		}
		player.district_cards.push(district_card);
		player.gold -= district_card.cost;
		game.game_state.state.played_card = true;
		game.saveGameAndNotifyOfTurn(io, user_to_socket_id);
	});
};

var endTurn = function(io, user_to_socket_id, message) {
	var player_id = message.player_id;
	var game_id = message.game_id;
	game_store.getDoc(game_id, function(error, game) {
		if (error) {
			console.error(error);
			// TODO send exception
			return;
		}
		if (player_id !== game.game_state.state.current_player_id) {
			console.error('wrong player ' + shortId(player_id) + ' attempting district card play. expected player ' +
					shortId(game.game_state.state.current_player_id));
			// TODO send exception
			return;
		}
		var next_player_id = game.setTurnToNextPlayer();
		if (next_player_id) {
			game.saveGameAndNotifyOfTurn(io, user_to_socket_id);
		}
		else {
			// TODO end player turns
			console.log("end of player turns");
			game.endPlayerTurns(io, user_to_socket_id);
		}
	});
};

var shortId = function(id) {
	return id.substring(0, 8);
};

module.exports.chooseCharacter = chooseCharacter;
module.exports.specialAction = specialAction;
module.exports.takeGold = takeGold;
module.exports.drawDistrictCards = drawDistrictCards;
module.exports.playDistrictCard = playDistrictCard;
module.exports.endTurn = endTurn;
