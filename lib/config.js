"use-strict";

var config = require("../config.json");

var cloudantUser = process.env.CLOUDANT_USER || config.cloudantUser;

module.exports = {
    contextPath: process.env.CONTEXT_PATH || config.contextPath,
    httpsPort: process.env.HTTPS_PORT || config.httpsPort,
    cloudantDB: process.env.CLOUDANT_DB || config.cloudantDB,
    cloudantUser: cloudantUser,
    cloudantPassword: process.env.CLOUDANT_PASSWORD || config.cloudantPassword,
    cloudantUrl: cloudantUser + '.cloudant.com',
    jsonLimit: process.env.JSON_LIMIT || config.jsonLimit,
    numberOfPlayers: process.env.NUMBER_OF_PLAYERS || config.numberOfPlayers || 4
}
