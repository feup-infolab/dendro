const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const _ = require("underscore");

class UserSocketSession
{
    constructor (userUri, socket)
    {
        this.__userUri = userUri;
        this.__sockets = [socket];
        //this.registerEvents();
    }


    /*
    registerEvents (socket)
    {
        this.__socket.on(this.__userUri +":message", function (data) {
            Logger.log("info", "Received a message from the client: ", data.message);
        });
    }
    */

    addNewSocket (newSocket)
    {
        let self = this;
        let connectedSockets = _.filter(self.__sockets, function(socket){ return socket.connected === true; });
        self.__sockets = connectedSockets;
        self.__sockets.push(newSocket);
        Logger.log("info", "Num connectedSockets for user " + self.__userUri + " : " + self.__sockets.length);
    };

    emitMessage (message)
    {
        let self = this;
        _.map(self.__sockets, function (socket) {
            socket.emit(self.__userUri +":message", {message: message});
        });
    }

    emitNotification (notificationObject)
    {
        let self = this;
        _.map(self.__sockets, function (socket) {
            socket.emit(self.__userUri + ":notification", notificationObject);
        });
    }

    disconnect ()
    {
        let self = this;
        _.map(self.__sockets, function (socket) {
            socket.disconnect(true);
        });
    }
}

module.exports.UserSocketSession = UserSocketSession;
