const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const UserSocketSession = require(Pathfinder.absPathInSrcFolder("bootup/models/user_socket_session.js")).UserSocketSession;

class IO
{
    //static __usersSocketsSessions = {};
    //static __io = null;

    //constructor (server)
    constructor ()
    {
        //IO.__io = require("socket.io")(server);
        //this.registerIOConnection();
    }

    static registerIOConnection (server)
    {
        const registerUserSocketSession = function (userUri, socketSession)
        {
            console.log("socketSessionUsers is: " + IO.__usersSocketsSessions);
            if(!IO.__usersSocketsSessions.hasOwnProperty(userUri))
            {
                let userSockeSession = new UserSocketSession(userUri, socketSession);
                IO.__usersSocketsSessions[userUri] = userSockeSession;
                return true;
            }
            else
            {
                IO.__usersSocketsSessions[userUri].disconnect();
                delete IO.__usersSocketsSessions[userUri];
                let userSockeSession = new UserSocketSession(userUri, socketSession);
                IO.__usersSocketsSessions[userUri] = userSockeSession;
            }
        };

        IO.__io.on("connection", function (socket) {
            /*
            socket.on("forceDisconnect", function (data) {
                //req.session.socketID = null;
                //socket.disconnect(true);
                //console.log("disconnected socketID: ", data.socketID);
                if(!isNull(data) || isNull(data.userUri))
                {
                    this.destroyUserSocketSession(data.userUri);
                }
                else
                {
                    socket.disconnect(true);
                }
            });
            */

            socket.on("identifyUser", function (data) {
                if(!isNull(data.userUri))
                {
                    console.log("user: " + data.userUri  + " identified!");
                    registerUserSocketSession(data.userUri, socket);
                    socket.emit("identified", {socketID: socket.id, userUri: data.user});
                }
                else
                {
                    console.log("Could not identify user, data.userUri is missing!");
                }
            });
        });
    }

    /*
    static registerUserSocketSession (userUri, socketSession)
    {
        if(!IO.__usersSocketsSessions.hasOwnProperty(userUri))
        {
            let userSockeSession = new UserSocketSession(userUri, socketSession);
            IO.__usersSocketsSessions[userUri] = userSockeSession;
            return true;
        }
        else
        {
            IO.__usersSocketsSessions[userUri].disconnect();
            delete IO.__usersSocketsSessions[userUri];
            let userSockeSession = new UserSocketSession(userUri, socketSession);
            IO.__usersSocketsSessions[userUri] = userSockeSession;
        }
    }
    */

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
}

module.exports.IO = IO;
