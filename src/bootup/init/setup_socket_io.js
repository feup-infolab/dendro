const Pathfinder = global.Pathfinder;
const IO = require(Pathfinder.absPathInSrcFolder("bootup/models/io.js")).IO;

const setupSocketIO = function (app, server, callback)
{
    IO.__usersSessions = {};
    IO.__io = require("socket.io")(server);
    IO.registerIOConnections();
    callback(null, app, server);
};

module.exports.setupSocketIO = setupSocketIO;
