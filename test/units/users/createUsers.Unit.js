process.env.NODE_ENV = "test";
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const LoadOntologies = require(Pathfinder.absPathInTestsFolder("units/ontologies/loadOntologies.Unit.js"));
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const Administrator = require(Pathfinder.absPathInSrcFolder("/models/administrator.js")).Administrator;

class CreateUsers extends LoadOntologies
{
    static load (callback)
    {
        const self = this;
        self.startLoad();
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                const createUser = function (user, callback)
                {
                    User.findByUsername(user.username, function (err, existingUser)
                    {
                        if (isNull(err))
                        {
                            if (isNull(existingUser))
                            {
                                User.createAndInsertFromObject(
                                    {
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
                                        if (isNull(err) && newUser !== null)
                                        {
                                            callback(null, newUser);
                                        }
                                        else
                                        {
                                            console.log("[ERROR] Error creating new demo User at createUsers.Unit " + JSON.stringify(user));
                                            callback(err, user);
                                        }
                                    });
                            }
                            else
                            {
                                console.log("[ERROR] Demo User " + user.username + " at createUsers.Unit already exists, skipping creation.");
                                callback(null);
                            }
                        }
                        else
                        {
                            callback(err, existingUser);
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

                function createUsers (callback)
                {
                    async.mapSeries(Config.demo_mode.users, createUser, function (err, results)
                    {
                        if (isNull(err))
                        {
                            callback(err, results);
                        }
                        else
                        {
                            var msg = "Error creating users at createUsers.Unit";
                            Logger.log("error", msg);
                            callback(1, msg);
                        }
                    });
                }

                function createAdministrators (callback)
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
                                    Logger.log("Admins successfully loaded at createUsers.Unit.");
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

                async.series([
                    createUsers,
                    createAdministrators
                ], function (err, results)
                {
                    if (!err)
                    {
                        self.endLoad(callback);
                    }
                    else
                    {
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
    static shutdown (callback)
    {
        super.shutdown(callback);
    }

    static setup (callback)
    {
        super.setup(callback);
    }
}

module.exports = CreateUsers;
