var expect    = require("chai").expect;
var card_util = require("../lib/card_util");

describe("Card Utils", function() {
  describe("Select Card", function() {
    it("select card", function() {
    	var cards = {
  			'down_cards': [ card_util.all_cards[1] ], // Thief
  			'unselected_cards': [],
  			'up_cards': [ card_util.all_cards[2], card_util.all_cards[3] ], // Magician and King
  			'draw_cards': [ card_util.all_cards[4], card_util.all_cards[5], card_util.all_cards[6], card_util.all_cards[7] ]
  		};
    	card_util.selectCard(cards, card_util.all_cards[4]);
    	card_util.selectCard(cards, card_util.all_cards[5]);
    	var targets = card_util.getAssassinTargets(cards);
    	expect(2).to.equal(cards.draw_cards.length);
    	expect(card_util.all_cards[6]).to.equal(cards.draw_cards[0]);
    	expect(card_util.all_cards[7]).to.equal(cards.draw_cards[1]);
    });
  });

  describe("Get Assassin Targets", function() {
    it("gets the assassin targets", function() {
    	var cards = {
			'down_cards': [ card_util.all_cards[1] ], // Thief
			'unselected_cards': [],
			'up_cards': [ card_util.all_cards[2], card_util.all_cards[3] ], // Magician and King
			'draw_cards': []
		};
    	card_util.selectCard(cards, card_util.all_cards[0]);
    	card_util.selectCard(cards, card_util.all_cards[4]);
    	card_util.selectCard(cards, card_util.all_cards[5]);
    	card_util.selectCard(cards, card_util.all_cards[6]);
    	card_util.completeSelection(cards);
    	var targets = card_util.getAssassinTargets(cards);
    	expect(targets.length).to.equal(4);
    	expect(targets[0]).to.equal(card_util.all_cards[4]);
    	expect(targets[1]).to.equal(card_util.all_cards[5]);
    	expect(targets[2]).to.equal(card_util.all_cards[6]);
    	// Warlord was not selected but the Assassin does not know that
    	expect(targets[3]).to.equal(card_util.all_cards[7]);
    });
  });

  describe("Get Thief Targets", function() {
    it("gets the thief targets with Merchant assassinated", function() {
    	var cards = {
			'down_cards': [ card_util.all_cards[2] ], // Magician
			'unselected_cards': [],
			'up_cards': [ card_util.all_cards[3], card_util.all_cards[4] ], // King and Bishop
			'draw_cards': []
		};
    	card_util.selectCard(cards, card_util.all_cards[0]);
    	card_util.selectCard(cards, card_util.all_cards[1]);
    	card_util.selectCard(cards, card_util.all_cards[5]);
    	card_util.selectCard(cards, card_util.all_cards[6]);
    	card_util.completeSelection(cards);
    	var targets = card_util.getThiefTargets(cards, card_util.all_cards[5]);
//    	console.log(targets);
    	expect(targets.length).to.equal(2);
    	expect(targets[0]).to.equal(card_util.all_cards[6]);
    	// Warlord was not selected but the Thief does not know that
    	expect(targets[1]).to.equal(card_util.all_cards[7]);
    });
    it("gets the thief targets with no one assassinated", function() {
    	var cards = {
			'down_cards': [ card_util.all_cards[2] ], // Magician
			'unselected_cards': [],
			'up_cards': [ card_util.all_cards[3], card_util.all_cards[4] ], // King and Bishop
			'draw_cards': []
		};
    	card_util.selectCard(cards, card_util.all_cards[0]);
    	card_util.selectCard(cards, card_util.all_cards[1]);
    	card_util.selectCard(cards, card_util.all_cards[5]);
    	card_util.selectCard(cards, card_util.all_cards[6]);
    	card_util.completeSelection(cards);
    	var targets = card_util.getThiefTargets(cards, null);
//    	console.log(targets);
    	expect(targets.length).to.equal(3);
    	expect(targets[0]).to.equal(card_util.all_cards[5]);
    	expect(targets[1]).to.equal(card_util.all_cards[6]);
    	// Warlord was not selected but the Thief does not know that
    	expect(targets[2]).to.equal(card_util.all_cards[7]);
    });
  });
});
