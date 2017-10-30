const fs = require("fs");
const async = require("async");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const loadDemoUsers = function(app, callback)
{
    if (Config.demo_mode.active && Config.startup.load_databases && Config.startup.reload_demo_users_on_startup)
    {
        Logger.log_boot_message("info", "Recreating demo users... ");
        //try to delete all demo users
        const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;

        const createUser = function (user, callback) {

            User.findByUsername(user.username, function (err, fetchedUser) {
                if (isNull(err)) {
                    if (isNull(fetchedUser)) {
                        User.createAndInsertFromObject({
                                foaf: {
                                    mbox: user.mbox,
                                    firstName: user.firstname,
                                    surname: user.surname
                                },
                                ddr: {
                                    username: user.username,
                                    password: user.password
                                }
                            },
                            function (err, newUser)
                            {
                                if (isNull(err) && !isNull(newUser))
                                {
                                    return callback(null, newUser);
                                }
                                else
                                {
                                    console.error("[ERROR] Error creating new demo User ");
                                    console.error(err.stack);
                                    return callback(err, user);
                                }
                            });
                    }
                    else {
                        Logger.log_boot_message("info","Demo user with username " + fetchedUser.ddr.username + " found. Will not create again.");
                        return callback(null, null);
                    }
                }
                else {
                    console.error("[ERROR] Unable to delete user with username " + user.username + ". Error: " + user);
                    return callback(err, user);
                }
            });
        };


        Logger.log_boot_message("info", "Loading Demo Users... ");

        async.mapSeries(Config.demo_mode.users, createUser, function (err, results)
        {
            if (isNull(err))
            {
                Logger.log_boot_message("success", "Demo users creation complete. ");
                return callback(null);
            }
            else
            {
                return callback("Unable to create demo users" + JSON.stringify(results));
            }
        });
    }
    else
    {
        return callback(null);
    }
};

module.exports.loadDemoUsers = loadDemoUsers;