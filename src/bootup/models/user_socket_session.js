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
        //this.registerEvents(socket);
    }



    /*
    registerEvents (socket)
    {
        let self = this;
        socket.on("disconnect", function(data) {
            console.log("Got disconnect!");
            console.log("data is: " + JSON.stringify(data));
            let connectedSockets = _.filter(self.__sockets, function(socket){ return socket.connected === true; });
            self.__sockets = connectedSockets;
            if(self.__sockets.length === 0)
            {
                Logger.log("info", "User " + self.__userUri  + " has no more sockets, it should be deleted from IO.__usersSocketsSessions");
            }
            else
            {
                Logger.log("info", "User " + self.__userUri  + " now has " + self.__sockets.length + " sockets");
            }
        });
    }
    */

    addNewSocket (newSocket)
    {
        let self = this;
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

    removeDisconnectedSockets()
    {
        let self = this;
        let connectedSockets = _.filter(self.__sockets, function(socket){ return socket.connected === true; });
        self.__sockets = connectedSockets;
    }

    getUserSockets() {
        let self = this;
        return self.__sockets;
    };
}

module.exports.UserSocketSession = UserSocketSession;
