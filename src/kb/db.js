const path = require("path");
const Pathfinder = global.Pathfinder;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

if(Config.virtuosoConnector === "http")
    module.exports.DbConnection = require(Pathfinder.absPathInSrcFolder("kb/db/db_http.js")).DbConnection;
else if(Config.virtuosoConnector === "jdbc")
    module.exports.DbConnection = require(Pathfinder.absPathInSrcFolder("kb/db/db_jdbc.js")).DbConnection;
else
    throw "Invalid Virtuoso Server connector type " + Config.virtuosoConnector;

