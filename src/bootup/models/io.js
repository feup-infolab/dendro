const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const UserSocketSession = require(Pathfinder.absPathInSrcFolder("bootup/models/user_socket_session.js")).UserSocketSession;

class IO
{
    constructor ()
    {

    }

    static registerIOConnections (server)
    {
        const updateUserSocketSession = function (userUri, newSocket)
        {
            if(!IO.__usersSocketsSessions.hasOwnProperty(userUri))
            {
                let userSockeSession = new UserSocketSession(userUri, newSocket);
                IO.__usersSocketsSessions[userUri] = userSockeSession;
            }
            else
            {
                IO.__usersSocketsSessions[userUri].addNewSocket(newSocket);
            }
        };

        IO.__io.on("connection", function (clientSocket) {
            clientSocket.on("identifyUser", function (data) {
                if(!isNull(data.userUri))
                {
                    Logger.log("info", "user: " + data.userUri  + " identified with socket iD: " + clientSocket.id);
                    updateUserSocketSession(data.userUri, clientSocket);
                    clientSocket.emit(data.userUri + ":identified", {socketID: clientSocket.id, userUri: data.user});
                }
                else
                {
                    Logger.log("error", "Could not identify user, data.userUri is missing!");
                }
            });
        });

        IO.__io.on("forceDisconnect", function (data) {
            Logger.log("info", "received a forced disconnect");
            Logger.log("info", "data is: " + JSON.stringify(data));
        });
    }

    static getUserSocketSession (userUri)
    {
        if(IO.__usersSocketsSessions.hasOwnProperty(userUri))
        {
            return IO.__usersSocketsSessions[userUri];
        }
        else
        {
            return null;
        }
    }

    /*
    static destroyUserSocketSession (userUri)
    {
        if(IO.__usersSocketsSessions.hasOwnProperty(userUri))
        {
            IO.__usersSocketsSessions[userUri].disconnect();
            delete IO.__usersSocketsSessions[userUri];
            return true;
        }
        else
        {
            return false;
        }
    }
    */
}

module.exports.IO = IO;
