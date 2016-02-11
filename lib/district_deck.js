'use-strict';

/*
QTY NAME    		COST COLOR
5	Tavern			1 green
4	Market			2 green
3	Trading Post	2 green
3	Docks			3 green
3	Harbor			4 green
2	Town Hall		5 green
3	Temple			1 blue
3	Church			2 blue
3	Monastery		3 blue
2	Cathedral		5 blue
3	Watchtower		1 red
3	Prison			2 red
3	Battlefield		3 red
2	Fortress		5 red
5	Manor			3 yellow
4	Castle			4 yellow
3	Palace			5 yellow
1	Haunted City	2 purple
2	Keep			3 purple
1	Laboratory		5 purple
1	Smithy			5 purple
1	Graveyard		5 purple
1	Observatory		5 purple
1	School of Magic	6 purple
1	Library			6 purple
1	Great Wall		6 purple
1	University		8 purple
1	Dragon Gate		8 purple
 */
var all_cards = [
	{ 'color': 'green', 'name': 'Tavern', 'cost': 1 },
	{ 'color': 'green', 'name': 'Tavern', 'cost': 1 },
	{ 'color': 'green', 'name': 'Tavern', 'cost': 1 },
	{ 'color': 'green', 'name': 'Tavern', 'cost': 1 },
	{ 'color': 'green', 'name': 'Tavern', 'cost': 1 },
	{ 'color': 'green', 'name': 'Market', 'cost': 2 },
	{ 'color': 'green', 'name': 'Market', 'cost': 2 },
	{ 'color': 'green', 'name': 'Market', 'cost': 2 },
	{ 'color': 'green', 'name': 'Market', 'cost': 2 },
	{ 'color': 'green', 'name': 'Trading Post', 'cost': 2 },
	{ 'color': 'green', 'name': 'Trading Post', 'cost': 2 },
	{ 'color': 'green', 'name': 'Trading Post', 'cost': 2 },
	{ 'color': 'green', 'name': 'Docks', 'cost': 3 },
	{ 'color': 'green', 'name': 'Docks', 'cost': 3 },
	{ 'color': 'green', 'name': 'Docks', 'cost': 3 },
	{ 'color': 'green', 'name': 'Harbor', 'cost': 4 },
	{ 'color': 'green', 'name': 'Harbor', 'cost': 4 },
	{ 'color': 'green', 'name': 'Harbor', 'cost': 4 },
	{ 'color': 'green', 'name': 'Town Hall', 'cost': 5 },
	{ 'color': 'green', 'name': 'Town Hall', 'cost': 5 },

	{ 'color': 'blue', 'name': 'Temple', 'cost': 1 },
	{ 'color': 'blue', 'name': 'Temple', 'cost': 1 },
	{ 'color': 'blue', 'name': 'Temple', 'cost': 1 },
	{ 'color': 'blue', 'name': 'Church', 'cost': 2 },
	{ 'color': 'blue', 'name': 'Church', 'cost': 2 },
	{ 'color': 'blue', 'name': 'Church', 'cost': 2 },
	{ 'color': 'blue', 'name': 'Monastery', 'cost': 3 },
	{ 'color': 'blue', 'name': 'Monastery', 'cost': 3 },
	{ 'color': 'blue', 'name': 'Monastery', 'cost': 3 },
	{ 'color': 'blue', 'name': 'Cathedral', 'cost': 5 },
	{ 'color': 'blue', 'name': 'Cathedral', 'cost': 5 },

	{ 'color': 'red', 'name': 'Watchtower', 'cost': 1 },
	{ 'color': 'red', 'name': 'Watchtower', 'cost': 1 },
	{ 'color': 'red', 'name': 'Watchtower', 'cost': 1 },
	{ 'color': 'red', 'name': 'Prison', 'cost': 2 },
	{ 'color': 'red', 'name': 'Prison', 'cost': 2 },
	{ 'color': 'red', 'name': 'Prison', 'cost': 2 },
	{ 'color': 'red', 'name': 'Battlefield', 'cost': 3 },
	{ 'color': 'red', 'name': 'Battlefield', 'cost': 3 },
	{ 'color': 'red', 'name': 'Battlefield', 'cost': 3 },
	{ 'color': 'red', 'name': 'Fortress', 'cost': 5 },
	{ 'color': 'red', 'name': 'Fortress', 'cost': 5 },

    { 'color': 'yellow', 'name': 'Manor', 'cost': 3 },
		{ 'color': 'yellow', 'name': 'Manor', 'cost': 3 },
		{ 'color': 'yellow', 'name': 'Manor', 'cost': 3 },
		{ 'color': 'yellow', 'name': 'Manor', 'cost': 3 },
		{ 'color': 'yellow', 'name': 'Manor', 'cost': 3 },
    { 'color': 'yellow', 'name': 'Castle', 'cost': 4 },
		{ 'color': 'yellow', 'name': 'Castle', 'cost': 4 },
		{ 'color': 'yellow', 'name': 'Castle', 'cost': 4 },
		{ 'color': 'yellow', 'name': 'Castle', 'cost': 4 },
    { 'color': 'yellow', 'name': 'Palace', 'cost': 5 },
		{ 'color': 'yellow', 'name': 'Palace', 'cost': 5 },
		{ 'color': 'yellow', 'name': 'Palace', 'cost': 5 }
];

var DistrictDeck = function DistrictDeck(_cards) {
	this.cards = _cards;
};

/**
 * Shuffle an array in place and return it.
 */
DistrictDeck.prototype.shuffle = function() {
	var deck = this;
	deck.cards = JSON.parse(JSON.stringify(all_cards)); // deep copy
	var currentIndex = deck.cards.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = deck.cards[currentIndex];
		deck.cards[currentIndex] = deck.cards[randomIndex];
		deck.cards[randomIndex] = temporaryValue;
	}
	return deck.cards;
};

DistrictDeck.prototype.draw = function(number) {
	var deck = this;
	return deck.cards.splice(0, number);
};

DistrictDeck.prototype.exchange = function(card) {
	var deck = this;
	deck.cards.push(card);
	return deck.cards.splice(0, 1)[0];
};

module.exports = DistrictDeck;
