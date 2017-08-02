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
        Logger.log_boot_message("info", "Existing demo users recreated. ");
        //try to delete all demo users
        const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
        const deleteUser = function (demoUser, callback) {
            User.findByUsername(demoUser.username, function (err, user) {

                if (isNull(err)) {
                    if (isNull(user)) {
                        //everything ok, user simply does not exist
                        return callback(null, null);
                    }
                    else {
                        Logger.log_boot_message("info","Demo user with username " + user.ddr.username + " found. Attempting to delete...");
                        user.deleteAllMyTriples(function (err, result) {
                            return callback(err, result);
                        });
                    }
                }
                else {
                    console.error("[ERROR] Unable to delete user with username " + demoUser.username + ". Error: " + user);
                    return callback(err, user);
                }
            });
        };

        const createUser = function (user, callback) {

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
        };


        async.map(Config.demo_mode.users, deleteUser, function (err, results)
        {
            if (isNull(err))
            {
                Logger.log_boot_message("info", "Existing demo users deleted. ");

                Logger.log_boot_message("info", "Loading Demo Users... ");

                async.map(Config.demo_mode.users, createUser, function (err, results)
                {
                    if (isNull(err))
                    {
                        Logger.log_boot_message("success", "Existing demo users recreated. ");
                        return callback(err);
                    }
                    else
                    {
                        return callback("Unable to create demo users" + JSON.stringify(results));
                    }
                });
            }
            else
            {
                return callback(err);
            }
        });
    }
    else
    {
        return callback(null);
    }
};

module.exports.loadDemoUsers = loadDemoUsers;