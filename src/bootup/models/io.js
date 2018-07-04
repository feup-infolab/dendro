const rlequire = require("rlequire");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const UserSession = rlequire("dendro", "src/bootup/models/user_session.js").UserSession;

class IO
{
    constructor ()
    {

    }

    static registerIOConnections ()
    {
        const getSessionForUser = function (userUri)
        {
            if (IO.__usersSessions.hasOwnProperty(userUri))
            {
                return IO.__usersSessions[userUri];
            }

            return null;
        };

        const updateUserSession = function (userUri, newSocket)
        {
            let userSession = getSessionForUser(userUri);
            if (!isNull(userSession))
            {
                userSession.addNewSocket(newSocket);
            }
            else
            {
                let userSession = new UserSession(userUri, newSocket);
                IO.__usersSessions[userUri] = userSession;
            }
        };

        const removeSocketFromUserSession = function (userUri, socket)
        {
            let userSession = getSessionForUser(userUri);
            if (!isNull(userSession))
            {
                userSession.removeDisconnectedSockets();
                let numberConnectedSocketsForUser = userSession.getUserSockets().length;
                Logger.log("info", "user " + userUri + " has " + numberConnectedSocketsForUser + " active sockets!");
                if (numberConnectedSocketsForUser === 0)
                {
                    Logger.log("info", "user " + userUri + " has no more active sockets!");
                    Logger.log("info", "Before deletion -> IO.__usersSessions number : " + Object.keys(IO.__usersSessions).length);
                    delete IO.__usersSessions[userUri];
                    Logger.log("info", "user " + userUri + " was removed from IO.__usersSessions");
                    Logger.log("info", "After deletion -> IO.__usersSessions number : " + Object.keys(IO.__usersSessions).length);
                }
            }
        };

        IO.__io.on("connection", function (clientSocket)
        {
            clientSocket.on("identifyUser", function (data)
            {
                if (!isNull(data.userUri))
                {
                    clientSocket.userUri = data.userUri;
                    Logger.log("info", "user: " + data.userUri + " identified with socket iD: " + clientSocket.id);
                    updateUserSession(data.userUri, clientSocket);
                    clientSocket.emit(data.userUri + ":identified", {socketID: clientSocket.id, userUri: data.user});
                }
                else
                {
                    Logger.log("error", "Could not identify user, data.userUri is missing!");
                }
            });

            clientSocket.on("disconnect", function (data)
            {
                console.log("Got a socket disconnect event for user " + clientSocket.userUri);
                if (!isNull(clientSocket.userUri))
                {
                    removeSocketFromUserSession(clientSocket.userUri, clientSocket);
                }
            });
        });
    }

    static getUserSession (userUri)
    {
        if (IO.__usersSessions.hasOwnProperty(userUri))
        {
            return IO.__usersSessions[userUri];
        }

        return null;
    }

    static destroyUserSession (userUri)
    {
        if (IO.__usersSessions.hasOwnProperty(userUri))
        {
            IO.__usersSessions[userUri].disconnect();
            IO.__usersSessions[userUri].removeDisconnectedSockets();
            delete IO.__usersSessions[userUri];
        }
    }
}

module.exports.IO = IO;
