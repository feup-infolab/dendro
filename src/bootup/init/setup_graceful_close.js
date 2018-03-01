const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DbConnection = require(Pathfinder.absPathInSrcFolder("kb/db.js")).DbConnection;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;

const npid = require("npid");
const async = require("async");
const mkdirp = require("mkdirp");
const path = require("path");
const _ = require("underscore");

const setupGracefulClose = function (app, server, callback)
{

};



module.exports.setupGracefulClose = setupGracefulClose;
