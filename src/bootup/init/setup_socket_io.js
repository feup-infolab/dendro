const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const http = require("http");
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const setupSocketIO = function (app, server, callback)
{
    const initSocket = function (callback) {
        const io = require("socket.io")(server);
        callback(null, io);
    };

    const registerSocketEvents = function (io) {
        //TODO find a way to save user socket sessions -> so that for example you can send a message to only a specific user
        let userSessions = [];
        io.on("connection", function (socket) {
            console.log("a user connected");
            console.log("ID: ", socket.id);
            //socket.emit('identify', {socketID: socket.id});
            socket.on("forceDisconnect", function (data) {
                //req.session.socketID = null;
                socket.disconnect(true);
                console.log("disconnected socketID: ", data.socketID);
            });

            socket.on("identifyUser", function (data) {
                console.log("user: " + data.userUri  + " identified!");
                socket.emit("identified", {socketID: socket.id});
            });
        });
    };

    initSocket(function (err, io) {
        registerSocketEvents(io);
        Config.io = io;
        callback(null, app, server);
    });
};

module.exports.setupSocketIO = setupSocketIO;
