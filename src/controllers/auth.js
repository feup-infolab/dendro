const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const UploadManager = require(Pathfinder.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;

const async = require('async');

module.exports.login = function(req, res, next){

    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(req.originalMethod === "GET")
    {
        res.render('auth/login');
    }
    else if (req.originalMethod === "POST")
    {
        //prevent injections, test for alphanumeric and _ characters only in the username
        const alphaNumericTest = new RegExp(/^[a-zA-Z0-9_]+$/);
        if(!isNull(req.body.username) && alphaNumericTest.test(req.body.username))
        {
            req.passport.authenticate(
                'local',
                {
                    failureRedirect: '/login',
                    failureFlash: true
                },
                function(err, user, info)
                {
                    if(isNull(err))
                    {
                        req.logIn(user, function(err) {
                            if (isNull(err))
                            {
                                req.session.isAdmin = info.isAdmin;
                                req.session.upload_manager = new UploadManager(user.ddr.username);

                                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                                {
                                    res.json(
                                        {
                                            result : "ok",
                                            message : "User " + user.ddr.username+ " signed in."
                                        }
                                    );
                                }
                                else
                                {
                                    req.flash('success', "Welcome, " + user.foaf.firstName + " " + user.foaf.surname + ".");

                                    if(Config.debug.permissions.log_authorizations)
                                    {
                                        console.log("User " + user.ddr.username + " signed in.");
                                    }

                                    res.redirect('/projects/my');
                                }
                            }
                            else
                            {
                                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                                {
                                    res.json(
                                        {
                                            result : "error",
                                            message : "Error signing in user",
                                            error : err
                                        }
                                    );
                                }
                                else
                                {
                                    req.flash('success', "There was an error signing you in.");
                                    console.log("Error signing in user " + JSON.stringify(err));
                                    throw err;
                                }
                            }
                        });
                    }
                    else
                    {
                        res.status(401).json(
                            {
                                result : "error",
                                message : err
                            }
                        );
                    }
                }
            )(req, res, next);
        }
        else
        {
            res.render('auth/login',
                {
                    title : 'Error Logging in',
                    error_messages :
                        [
                            "Usernames must be alphanumeric only"
                        ]
                }
            );
        }
    }
};

module.exports.logout = function(req, res){

    if(!isNull(req.user))
    {
        req.logOut();
        delete req.user;
        delete req.session.isAdmin;
        delete req.session.upload_manager;
        delete res.locals.user;
        delete res.locals.session;

        req.flash("success", "Successfully logged out");
        res.redirect('/');
    }
    else
    {
        req.flash("error", "Cannot log you out because you are not logged in");
        res.redirect('/');
    }
};

module.exports.register = function(req, res){
    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        res.status(405).json(
            {
                result : "error",
                message : "This function is not yet available via the JSON API. You need to register at " + Config.host + " ."
            }
        );
    }
    else
    {
        if(req.originalMethod === "GET")
        {
            res.render('auth/register',
                {
                    title : "Register on Dendro"
                }
            );
        }
        else if (req.originalMethod === "POST")
        {
            if(isNull(req.body.username))
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your username"]
                    }
                );
            }
            else if(isNull(req.body.email))
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your email"]
                    }
                );
            }
            else if(isNull(req.body.password))
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your password"]
                    }
                );
            }
            else if(typeof req.body.repeat_password === "undefined")
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please repeat your password"]
                    }
                );
            }
            else if(isNull(req.body.firstname))
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your first name"]
                    }
                );
            }
            else if(isNull(req.body.surname))
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your surname"]
                    }
                );
            }
            else if(!isNull(req.body.username) && !req.body.username.mat0ch(/^[0-9a-zA-Z]+$/))
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Username can not include spaces or special characters. It should only include letters (a to Z) and numbers (0 to 9). Valid : joHNdoe91. Invalid: johndoe 01, johndoe*01, john@doe, john%doe9$ "]
                    }
                );
            }
            else
            {
                const findByUsername = function(callback)
                {
                    User.findByUsername(req.body.username, function(err, user){
                        if(isNull(err))
                        {
                            if(!isNull(user))
                            {
                                return callback(1, "Username already exists");
                            }
                            else
                            {
                                if(typeof req.body.password === req.body.repeat_password)
                                {
                                    const userData = {
                                        ddr : {
                                            username : req.body.username,
                                            password : req.body.password
                                        },
                                        foaf: {
                                            mbox : req.body.email,
                                            firstName : req.body.firstname,
                                            surname : req.body.surname
                                        }
                                    };

                                    return callback(null, userData);
                                }
                                else
                                {
                                    return callback(1, "Passwords do not match");
                                }
                            }
                        }
                        else
                        {
                            return callback(1, user);
                        }
                    });
                };

                const findByORCID = function(callback)
                {
                    User.findByORCID(req.body.orcid, function(err, user){
                        if(isNull(err))
                        {
                            if(!isNull(user))
                            {
                                return callback(1, "User with that ORCID already exists");
                            }
                            else
                            {
                                if(req.body.password === req.body.repeat_password)
                                {
                                    const userData = {
                                        ddr : {
                                            username : req.body.username,
                                            password : req.body.password,
                                            orcid : req.body.orcid
                                        },
                                        foaf: {
                                            mbox : req.body.email,
                                            firstName : req.body.firstname,
                                            surname : req.body.surname
                                        }
                                    };

                                    return callback(null, userData);
                                }
                                else
                                {
                                    return callback(1, "Passwords do not match");
                                }
                            }
                        }
                        else
                        {
                            return callback(1, user);
                        }
                    });
                };

                const insertUserRecord = function(userData, callback)
                {
                    User.createAndInsertFromObject(userData, function(err, newUser){
                        if(isNull(err))
                        {
                            return callback(null, "New user " + userData.ddr.username +" created successfully. You can now login with the username and password you specified.");
                        }
                        else
                        {
                            return callback(1, newUser);
                        }

                    });
                };

                async.waterfall([
                    function(cb)
                    {
                        if(!isNull(req.body.orcid))
                        {
                            findByORCID(cb);
                        }
                        else
                        {
                            findByUsername(cb);
                        }
                    },
                    function(user, cb)
                    {
                        if(!isNull(user))
                        {
                            insertUserRecord(user, cb);
                        }
                        else
                        {
                            cb(1, user);
                        }

                    }
                ], function(err, user){
                    if(isNull(err))
                    {
                        res.render('/login', {
                            success_messages : [user]
                        });
                    }
                    else
                    {
                        
                    }


                });
            }
        }
    }
};
