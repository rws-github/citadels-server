'use-strict';

var uuid  = require('node-uuid'),
fs    = require('fs');

var game_store = require('./game_store'),
actions        = require('./actions'),
card_util      = require('./card_util');
var config = require('./config.js');

var Game = require('./game');

var io = null;

var user_to_socket_id = {};
var waiting_game;

var CitadelsSocket = function CitadelsSocket(_io) {
  io = _io;
  createNextGame();
  console.log("using number of players per game of " + config.numberOfPlayers);
};

CitadelsSocket.prototype.onConnect = function(socket) {
  //    console.log(socket.id + ' connected');
  initSocket(socket);
};

var initSocket = function(socket) {
  var socket_id = socket.id;
  // add initial handlers like joining a game
  socket.on("join_game", function(message) {
    var player_id = message.player_id;
    user_to_socket_id[player_id] = socket_id;
    var game = waiting_game;
    var length = game.game_state.players.push({ 'id': player_id, 'gold': 0, 'district_cards': [], 'sensitive' : { 'district_cards': [] } });
    joinedGame(socket, game, player_id);
    if (length >= config.numberOfPlayers) {
      game.init();
      game.startCharacterSelection(io, user_to_socket_id);
      //createNextGame();
      startGame(socket, game);
    }
  });
};

var createNextGame = function() {
  waiting_game = new Game({ _id: uuid.v4(), players: [] });
  game_store.updateDoc(waiting_game, waiting_game.game_state._id, loggingCallback);
};

var stopClient = function(socket) {
  io.to(socket).emit('stop');
};

var startGame = function(socket, game) {
  game.game_state.players.forEach(function(player, index, array) {
    var socket_id = user_to_socket_id[player.id];
    io.to(socket_id).emit('game_started');
  });
};

var joinedGame = function(socket, game, player_id) {
  console.log('player ' + shortId(player_id) + ' joined ' + shortId(game.game_state._id));
  // TODO register quit game
  io.to(socket.id).emit('joined_game', { 'game_id': game.game_state._id });

  // register game actions
  socket.on('choose_character', actions.chooseCharacter.bind(undefined, io, user_to_socket_id));
  socket.on('take_gold', actions.takeGold.bind(undefined, io, user_to_socket_id));
  socket.on('draw_district_cards', actions.drawDistrictCards.bind(undefined, io, user_to_socket_id));
  socket.on('take_special_action', actions.specialAction.bind(undefined, io, user_to_socket_id));
  socket.on('play_district_card', actions.playDistrictCard.bind(undefined, io, user_to_socket_id));
  socket.on('end_turn', actions.endTurn.bind(undefined, io, user_to_socket_id));
};

var loggingCallback = function(error, result) {
  if (error) {
    console.error(error);
  }
};

var shortId = function(id) {
  return id.substring(0, 8);
};

module.exports = CitadelsSocket;
