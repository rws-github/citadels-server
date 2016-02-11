"use strict";

var fs = require("fs");

var VERSION = JSON.parse(fs.readFileSync("build_info.json", {encoding: "utf-8"}));

module.exports = function(req, res, next) {
    var id = req.params.propertyId;
    
    switch (req.method) {
        case "GET":
            res.status(200).type('application/json').send(VERSION);
            break;
        default:
            res.status(405).send("HTTP 405 - " + req.method + " not allowed for this path");
    }
};