'use-strict';

var all_cards = [
    'Assassin',
    'Thief',
    'Magician',
    'King',
    'Bishop',
    'Merchant',
    'Architect',
    'Warlord'
];

if (!Array.prototype.remove) {
  Array.prototype.remove = function(vals, all) {
    var i, removedItems = [];
    if (!Array.isArray(vals)) vals = [vals];
    for (var j=0;j<vals.length; j++) {
      if (all) {
        for(i = this.length; i--;){
          if (this[i] === vals[j]) removedItems.push(this.splice(i, 1));
        }
      }
      else {
        i = this.indexOf(vals[j]);
        if(i>-1) removedItems.push(this.splice(i, 1));
      }
    }
    return removedItems;
  };
};

module.exports.all_cards = all_cards;

module.exports.indexByName = function (name) {
	return all_cards.indexOf(name);
};

module.exports.shuffle = function (number_of_players) {
	var cards = {
		'down_cards': [],
		'unselected_cards': [],
		'up_cards': [],
		'draw_cards': []
	};

	// select the down card
	cards.draw_cards = all_cards.slice(0);
	cards.down_cards.push(cards.draw_cards.splice(Math.random() * all_cards.length | 0, 1));

	// king can not be face up
	if (number_of_players < 6) {
		var index = Math.random() * cards.draw_cards.length | 0;
		while (cards.draw_cards[index] === all_cards[3]) {
			index = Math.random() * cards.draw_cards.length | 0;
		}
		cards.up_cards.push(cards.draw_cards.splice(index, 1)[0]);
	}
	if (number_of_players < 5) {
		var index = Math.random() * cards.draw_cards.length | 0;
		while (cards.draw_cards[index] === all_cards[3]) {
			index = Math.random() * cards.draw_cards.length | 0;
		}
		cards.up_cards.push(cards.draw_cards.splice(index, 1)[0]);
	}
	return cards;
};

module.exports.isAvailable = function(cards, name) {
	// console.log('checking if ' + name + ' is available in ' + cards.draw_cards);
	return cards.draw_cards.indexOf(name) >= 0;
};

module.exports.selectCard = function(cards, name) {
	var index = cards.draw_cards.indexOf(name);
	cards.draw_cards.splice(index, 1);
	return name;
};

module.exports.completeSelection = function(cards) {
	Array.prototype.push.apply(cards.unselected_cards, cards.draw_cards);
	cards.draw_cards = [];
};

/**
 * Get the character targets for the Assassin which is all cards - Assassin - original down cards - up cards
 * The assassin is the first to select and sees all possible character cards
 */
module.exports.getAssassinTargets = function(cards) {
	var targets = [];
	Array.prototype.push.apply(targets, all_cards);
	targets.remove(all_cards[0]);
	targets.remove(cards.down_cards);
	targets.remove(cards.up_cards);
	return targets;
};

/**
 * Get the character targets for the Thief which is all cards - Assassin - Thief - Assassin target -
 * original down cards - up cards
 */
module.exports.getThiefTargets = function(cards, assassin_target) {
	var targets = [];
	Array.prototype.push.apply(targets, all_cards);
	targets.remove(all_cards[0]); // remove Assassin
	targets.remove(all_cards[1]); // remove Thief
	if (assassin_target) {
		targets.remove(assassin_target);
	}
	targets.remove(cards.down_cards);
	targets.remove(cards.up_cards);
	return targets;
};
