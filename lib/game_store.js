var config = require('./config');

var Game = require('./game');

var encodedUser = encodeURIComponent(config.cloudantUser);
var encodedPassword = encodeURIComponent(config.cloudantPassword);
var url = 'https://' + encodedUser + ':' + encodedPassword + '@' + config.cloudantUrl;

var nano = require('nano')(url),
db = nano.use(config.cloudantDB);

var updateDoc = function(doc, id, callback) {
  if (doc.game_state) {
    doc = doc.game_state;
  }
  if (doc._id && doc._id != id) {
    throw new Error("document _id does not match the URL id");
  }
  // console.log("updating: " + id + " as " + JSON.stringify(doc, null, 2));
  db.get(id, function(error, existing_doc) {
    var ok = false;
    if (error) {
      if (error.error === 'not_found') { //} && error.reason === 'deleted') {
        ok = true;
      }
    }
    else {
      ok = true;
      doc._rev = existing_doc._rev;
    }

    if (ok) {
      db.insert(doc, id, function(error, result) {
        if (error && error.error === 'conflict') {
          // retry
          updateDoc(doc, id, callback);
        }
        else {
          callback(error, result);
        }
      });
    }
    else {
      callback(error, existing_doc);
    }
  });
};

module.exports.getDoc = function(id, callback) {
  db.get(id, function(error, doc) {
    // if (doc) {
    //   console.log("restored " + doc._id + " rev " + doc._rev);
    // }
    callback(error, new Game(doc));
  });
};

module.exports.deleteDoc = function(id, callback) {
  db.get(id, function(err, doc) {
    if (err) {
      callback(err, new Game(doc));
      return;
    }
    db.destroy(id, doc._rev, function(error, doc) {
      callback(error, new Game(doc));
    });
  });
};

module.exports.updateDoc = updateDoc;
