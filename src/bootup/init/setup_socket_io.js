const rlequire = require("rlequire");
const IO = rlequire("dendro", "src/bootup/models/io.js").IO;

const setupSocketIO = function (app, server, callback)
{
    IO.__usersSessions = {};
    IO.__io = require("socket.io")(server);
    IO.registerIOConnections();
    callback(null, app, server);
};

module.exports.setupSocketIO = setupSocketIO;
