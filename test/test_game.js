var expect    = require("chai").expect;
var Game = require("../lib/game");

describe("Game", function() {
  describe("Find Next Player Turn", function() {
    it("gets the Magician at the start of player turns", function() {
      var game = new Game({
        "_id": "bc58ee39-daf7-45f5-97d2-01617865aea7",
        "_rev": "2-bf60a3e77d43e834213b55e6784b7cec",
        "players": [
          {
            "id": "693ef36a-704b-4bf0-a6c1-0354728c0bac",
            "character": "Magician"
          }
        ],
        "all_cards": [
          "Assassin",
          "Thief",
          "Magician",
          "King",
          "Bishop",
          "Merchant",
          "Architect",
          "Warlord"
        ],
        "cards": {
          "down_cards": [
            [
              "Assassin"
            ]
          ],
          "unselected_cards": [],
          "up_cards": [
            "Thief",
            "Warlord"
          ],
          "draw_cards": []
        },
        "crown": "693ef36a-704b-4bf0-a6c1-0354728c0bac",
        "state": {}
      });
      var player_id = game.findPlayerWithNextTurn();
      expect('693ef36a-704b-4bf0-a6c1-0354728c0bac').to.equal(player_id);
    });
  });

  describe('Steal Gold', function() {
    it("Thief steals gold from the Magician", function() {
      var game = new Game({
        "_id": "bc58ee39-daf7-45f5-97d2-01617865aea7",
        "_rev": "2-bf60a3e77d43e834213b55e6784b7cec",
        "players": [
          {
            "id": "123",
            "character": "Thief",
            "gold": 1
          },
          {
            "id": "456",
            "character": "Magician",
            "gold": 3
          }
        ],
        "all_cards": [
          "Assassin",
          "Thief",
          "Magician",
          "King",
          "Bishop",
          "Merchant",
          "Architect",
          "Warlord"
        ],
        "state": {
          "current_player_id": "456",
          "thief_target": "Magician"
        }
      });
      game.stealGold();
      expect(3, game.game_state.players[0].gold);
    });
  });
});
