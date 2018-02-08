process.env.NODE_ENV = "test";
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

let BootupUnit = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));

class CreateUsers extends BootupUnit
{
    static load (callback)
    {
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
                const Administrator = require(Pathfinder.absPathInSrcFolder("/models/administrator.js")).Administrator;

                const createUser = function (user, callback)
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
                        if (isNull(err) && newUser != null)
                        {
                            callback(null, newUser);
                        }
                        else
                        {
                            console.log("[ERROR] Error creating new demo User at createUsers.Unit " + JSON.stringify(user));
                            callback(err, user);
                        }
                    });
                };
                const makeAdmin = function (newAdministrator, callback)
                {
                    const username = newAdministrator.username;
                    const password = newAdministrator.password;
                    const mbox = newAdministrator.mbox;
                    const firstname = newAdministrator.firstname;
                    const surname = newAdministrator.surname;

                    Administrator.findByUsername(username, function (err, administrator)
                    {
                        if (isNull(err) && administrator !== null)
                        {
                            callback(err, administrator);
                        }
                        else
                        {
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
                            function (err, newUser)
                            {
                                if (isNull(err) && newUser !== null && newUser instanceof Administrator)
                                {
                                    callback(err, null);
                                }
                                else
                                {
                                    const msg = "Error creating new Administrator at createUsers.Unit" + JSON.stringify(newUser);
                                    Logger.log("error", msg);
                                    callback(err, msg);
                                }
                            });
                        }
                    });
                };

                async.mapSeries(Config.demo_mode.users, createUser, function (err, results)
                {
                    if (isNull(err))
                    {
                        async.series([
                            function (callback)
                            {
                                Administrator.deleteAll(callback);
                            },
                            function (callback)
                            {
                                async.mapSeries(Config.administrators, makeAdmin, function (err)
                                {
                                    if (isNull(err))
                                    {
                                        Logger.log("info", "Admins successfully loaded at createUsers.Unit.");
                                    }
                                    else
                                    {
                                        Logger.log("error", "[ERROR] Unable to load admins at createUsers.Unit. Error : " + err);
                                    }

                                    callback(err);
                                });
                            }
                        ],
                        function (err, results)
                        {
                            if (isNull(err))
                            {
                                callback(err, results);
                            }
                            else
                            {
                                const msg = "Error creating Admins at createUsers.Unit";
                                Logger.log("error", msg);

                                callback(err, results);
                            }
                        });
                    }
                    else
                    {
                        var msg = "Error creating users at createUsers.Unit";
                        Logger.log("error", msg);

                        callback(err, results);
                    }
                });
            }
        });
    }

    static init (callback)
    {
        super.init(callback);
    }
}

module.exports = CreateUsers;
