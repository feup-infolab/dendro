process.env.NODE_ENV = 'test';
const Config = global.Config;

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const async = require('async');
const colors = require('colors');

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const start = function()
{
    if(Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".green);
        console.log("[Create Users Unit] Creating new users...".green);
        console.log("**********************************************".green);
    }
};

const end = function()
{
    if(Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".blue);
        console.log("[Create Users Unit] Complete".blue);
        console.log("**********************************************".blue);
    }
};

module.exports.setup = function(finish)
{
    start();
    let bootupUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/bootup.Unit.js"));

    bootupUnit.setup(function (err, results) {
        if(err)
        {
            end();
            finish(err, results);
        }
        else
        {
            const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
            console.log("[INFO] Loading demo users. Demo users (in config.js file) -->" + JSON.stringify(Config.demo_mode.users));


            const makeAdmin = function (newAdministrator, callback) {

                const username = newAdministrator.username;
                const password = newAdministrator.password;
                const mbox = newAdministrator.mbox;
                const firstname = newAdministrator.firstname;
                const surname = newAdministrator.surname;

                User.findByUsername(username, function (err, user) {

                    if (!err && user != null) {
                        user.makeGlobalAdmin(function (err, result) {
                            callback(err, result);
                        });
                    }
                    else {
                        console.log("Non-existent user " + username + ". Creating new for promoting to admin.");

                        User.createAndInsertFromObject({
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
                                if (!err && newUser != null && newUser instanceof User) {
                                    newUser.makeGlobalAdmin(function (err, newUser) {
                                        callback(err, newUser);
                                    });
                                }
                                else {
                                    const msg = "Error creating new User" + JSON.stringify(newUser);
                                    console.error(msg);
                                    callback(err, msg);
                                }
                            });
                    }
                })
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
                    function (err, newUser) {
                        if (!err && newUser != null) {
                            callback(null, newUser);
                        }
                        else {
                            console.log("[ERROR] Error creating new demo User " + JSON.stringify(user));
                            callback(err, user);
                        }
                    });
            };

            async.mapSeries(Config.demo_mode.users, createUser, function(err, results) {
                if(!err)
                {
                    console.log("[INFO] Existing demo users recreated. ");
                    console.log("[INFO] Loading default administrators. Admins (in config.js file) -->" + JSON.stringify(Config.administrators));

                    async.series([
                            function(callback)
                            {
                                User.removeAllAdmins(callback);
                            },
                            function(callback)
                            {
                                async.mapSeries(Config.administrators, makeAdmin, function(err){
                                    if(!err)
                                    {
                                        console.log("[OK] Admins successfully loaded.");
                                    }
                                    else {
                                        console.log("[ERROR] Unable to load admins. Error : " + err);
                                    }

                                    callback(err);
                                });
                            }
                        ],
                        function(err, results){
                            if(!err)
                            {
                                end();
                                finish(err, results);
                            }
                            else
                            {
                                const msg = "Error creating Admins at createUsers.Unit";
                                console.error(msg);
                                end();
                                finish(err, results);
                            }
                        });
                }
                else
                {
                    var msg = "Error creating users at createUsers.Unit";
                    console.error(msg);
                    end();
                    finish(err, results);
                }
            });

        }
    });
};