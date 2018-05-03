const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const http = require("http");
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const IO = require(Pathfinder.absPathInSrcFolder("bootup/models/io.js")).IO;

const setupSocketIO = function (app, server, callback)
{
    IO.__usersSocketsSessions = {};
    IO.__io = require("socket.io")(server);
    IO.registerIOConnections();
    callback(null, app, server);
};

module.exports.setupSocketIO = setupSocketIO;
