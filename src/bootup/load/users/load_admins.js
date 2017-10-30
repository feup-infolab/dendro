const async = require("async");
const fs = require("fs");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Administrator = require(Pathfinder.absPathInSrcFolder("/models/administrator.js")).Administrator;

const loadAdmins = function(app, callback)
{
    if(Config.startup.load_databases && Config.startup.reload_administrators_on_startup)
    {
        Logger.log_boot_message("info","Loading default administrators.");
        async.series([
                function(callback)
                {
                    Administrator.deleteAll(callback);
                },
                function(callback)
                {
                    const createAdmin = function (newAdministrator, callback) {

                        const username = newAdministrator.username;
                        const password = newAdministrator.password;
                        const mbox = newAdministrator.mbox;
                        const firstname = newAdministrator.firstname;
                        const surname = newAdministrator.surname;

                        Administrator.findByUsername(username, function (err, administrator) {

                            if (isNull(err) && !isNull(administrator)) {
                                return callback(err, administrator);
                            }
                            else {
                                Logger.log_boot_message("info","Non-existent administrator " + username + ". Creating new admin...");

                                Administrator.createAndInsertFromObject({
                                        foaf: {
                                            mbox: mbox,
                                            firstName: firstname,
                                            surname: surname
                                        },
                                        ddr: {
                                            username: username,
                                            password: password
                                        }
                                    },
                                    function (err, newUser) {
                                        if (isNull(err) && !isNull(newUser) && newUser instanceof Administrator) {
                                            return callback(err, newUser);
                                        }
                                        else {
                                            const msg = "Error creating new Administrator" + JSON.stringify(newUser);
                                            console.error(msg);
                                            return callback(err, msg);
                                        }
                                    });
                            }
                        })
                    };

                    async.mapSeries(Config.administrators, createAdmin, function(err){
                        if(isNull(err))
                        {
                            Logger.log_boot_message("success","Admins successfully loaded.");
                        }
                        else {
                            console.error("[ERROR] Unable to load admins. Error : " + err);
                        }

                        return callback(err);
                    });
                }
            ],
            function(err, results){
                if(isNull(err))
                {
                    return callback(null);
                }
                else
                {
                    return callback("Error promoting default admins " + JSON.stringify(results));
                }
            });
    }
    else
    {
        return callback(null);
    }
};

module.exports.loadAdmins = loadAdmins;