var expect    = require("chai").expect;
var DistrictDeck = require("../lib/district_deck");

describe("District Deck", function() {
  describe("Draw Cards", function() {
    it("gets the top 2 cards", function() {
      var deck = new DistrictDeck();
      deck.shuffle();
      var length = deck.cards.length;
      expect(54).to.equal(length);
      var card1 = deck.cards[0];
      var card2 = deck.cards[1];
      var cards = deck.draw(2);
    	expect(length - 2).to.equal(deck.cards.length);
      expect(2).to.equal(cards.length);
    	expect(card1).to.equal(cards[0]);
      expect(card2).to.equal(cards[1]);
    });
  });

  describe("Exchange Card", function() {
    it("exchange a card", function() {
      var deck = new DistrictDeck();
      deck.shuffle();
      var length = deck.cards.length;
      expect(54).to.equal(length);
      var card1 = deck.cards[0];
      var card2 = deck.cards[1];
      var cards = deck.draw(1);
    	expect(length - 1).to.equal(deck.cards.length);
      expect(1).to.equal(cards.length);
    	expect(card1).to.equal(cards[0]);
      var exchangedCard = deck.exchange(card1);
      expect(length - 1).to.equal(deck.cards.length);
      expect(card2).to.equal(exchangedCard);
      var lastCard = deck.cards[deck.cards.length - 1];
      expect(card1).to.equal(lastCard);
    });
  });
});
