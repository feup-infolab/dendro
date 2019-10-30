const fs = require("fs");
const async = require("async");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;
const User = rlequire("dendro", "src/models/user.js").User;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const loadDemoUsers = function (app, callback)
{
    if (Config.demo_mode.active && Config.startup.load_databases && Config.startup.reload_demo_users_on_startup)
    {
        Logger.log_boot_message("Recreating demo users... ");
        // try to delete all demo users
        const User = rlequire("dendro", "src/models/user.js").User;

        const createUser = function (user, callback)
        {
            User.findByUsername(user.username, function (err, fetchedUser)
            {
                if (isNull(err))
                {
                    if (isNull(fetchedUser))
                    {
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

                            Logger.log("error", "[ERROR] Error creating new demo User ");
                            Logger.log("error", err.stack);
                            return callback(err, user);
                        });
                    }
                    else
                    {
                        Logger.log_boot_message("Demo user with username " + fetchedUser.ddr.username + " found. Will not create again.");
                        return callback(null, null);
                    }
                }
                else
                {
                    Logger.log("error", "[ERROR] Unable to delete user with username " + user.username + ". Error: " + user);
                    return callback(err, user);
                }
            });
        };

        Logger.log_boot_message("Loading Demo Users... ");

        async.mapSeries(Config.demo_mode.users, createUser, function (err, results)
        {
            if (isNull(err))
            {
                Logger.log_boot_message("Demo users creation complete. ");
                return callback(null);
            }
            return callback("Unable to create demo users" + JSON.stringify(results));
        });
    }
    else
    {
        return callback(null);
    }
};

module.exports.loadDemoUsers = loadDemoUsers;
