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
            console.log("Received a message from the client: ", data.message);
        });
    }
    */

    addNewSocket (newSocket)
    {
        let connectedSockets = _.filter(this.__sockets, function(socket){ return socket.connected === true; });
        this.__sockets = connectedSockets;
        this.__sockets.push(newSocket);
        console.log("Num connectedSockets for user " + this.__userUri + " : " + this.__sockets.length);
    };

    emitMessage (message)
    {
        let self = this;
        _.map(self.__sockets, function (socket) {
            socket.emit(self.__userUri +":message", {message: message});
        });
        //this.__socket.emit(this.__userUri +":message", {message: message});
    }

    emitNotification (notificationObject)
    {
        let self = this;
        //this.__socket.emit(this.__userUri + ":notification", notificationObject);
        _.map(self.__sockets, function (socket) {
            socket.emit(self.__userUri + ":notification", notificationObject);
        });
    }

    disconnect ()
    {
        //this.__socket.disconnect(true);
        let self = this;
        _.map(self.__sockets, function (socket) {
            socket.disconnect(true);
        });
    }
}

module.exports.UserSocketSession = UserSocketSession;
