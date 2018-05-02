const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

class UserSocketSession
{
    //static __userUri;
    //static __socket;

    constructor (userUri, socket)
    {
        this.__userUri = userUri;
        this.__socket = socket;
        this.registerEvents();
    }

    registerEvents ()
    {
        this.__socket.on("forceDisconnect", function (data) {
            this.__socket.disconnect(true);
            //console.log("disconnected socketID: ", data.socketID);
        });

        this.__socket.on("identifyUser", function (data) {
            //console.log("user: " + data.userUri  + " identified!");
            this.__socket.emit("identified", {socketID: this.__socket.id, userUri: this.__userUri});
        });

        this.__socket.on("message", function (data) {
            console.log("Received a message from the client: ", data.message);
        });
    }

    emitMessage (message)
    {
        this.__socket.emit("message", {message: message});
    }

    emitNotification (notificationObject)
    {
        this.__socket.emit("notification", notificationObject);
    }

    disconnect ()
    {
        this.__socket.disconnect(true);
    }
}

module.exports.UserSocketSession = UserSocketSession;
