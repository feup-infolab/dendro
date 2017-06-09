const Config = function() { return GLOBAL.Config; }();

const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;

const db = function() { return GLOBAL.db.default; }();
const gfs = function() { return GLOBAL.gfs.default; }();

const async = require('async');
const _ = require('underscore');

/*
 * GET users listing.
 */
exports.users_autocomplete = function(req, res){

    if(req.params.requestedResource != null)
    {

        User.autocomplete_search(
            req.query.user_autocomplete,
            Config.recommendation.max_autocomplete_results,
            function(err, users)
            {
                if(!err)
                {
                    res.json(
                        users
                    );
                }
                else
                {
                    res.status(500).json(
                        {
                            error_messages : [users]
                        }
                    );
                }
            }
        );
    }
}

exports.all = function(req, res){

    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    var viewVars = {
        title : 'Researchers in the knowledge base'
    };

    viewVars = DbConnection.paginate(req,
        viewVars
    );

    var getUserCount = function(cb)
    {
        User.getCount(function(err, count){
            cb(err, count);
        });
    }

    var getAllUsers = function(cb)
    {
        User.all(function(err, users) {
            cb(err, users);
        }, req, null, [Config.types.private, Config.types.locked], [Config.types.api_readable]);
    }

    async.parallel(
        [
            getUserCount, getAllUsers
        ], function(err, results)
        {
            if(!err)
            {
                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                {
                    var users = results[1];
                    res.json(
                        users
                    );
                }
                else
                {
                    viewVars.count = results[0];
                    viewVars.users = results[1];

                    res.render('users/all',
                        viewVars
                    )
                }
            }
            else
            {
                if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                {
                    res.json({
                        result : "error",
                        message : "Unable to fetch users list.",
                        error : results
                    });
                }
                else
                {
                    viewVars.users = [];
                    viewVars.error_messages = [results];
                    res.render('users/all',
                        viewVars
                    )
                }
            }
        }
    );
};

exports.username_exists = function(req, res){
    const username = req.query["username"];

    User.findByUsername(username, function(err, user)
    {
        if(!err)
        {
            if(user != null)
            {
                res.json(
                    {
                        result: "ok",
                        message: "found"
                    }
                );
            }
            else
            {
                res.json(
                    {
                        result: "ok",
                        message: "not_found"
                    }
                );
            }
        }
        else
        {
            res.status(500).json(
                {
                    result: "error"
                }
            );
        }
    }, true);
};

exports.show = function(req, res){
    var username = req.params["username"];

    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    User.findByUsername(username, function(err, user)
    {
        if(!err)
        {
            if(user != null)
            {
                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                {
                    res.json(
                        user
                    );
                }
                else
                {
                    res.render('users/show',
                        {
                            title : "Viewing user " + username,
                            user : user
                        }
                    )
                }
            }
            else
            {
                if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                {
                    res.json({
                        result : "error",
                        message : "User " + username + " does not exist."
                    });
                }
                else
                {
                    res.render('index',
                        {
                            error_messages : ["User " + username + " does not exist."]
                        }
                    )
                }
            }
        }
        else
        {
            if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
            {
                res.json(
                    {
                        result : "error",
                        message : "There is no user authenticated in the system."
                    }
                );
            }
            else
            {
                res.render('users/show',
                    {
                        title : "Viewing user " + username,
                        user : user
                    }
                )
            }
        }
    }, true);
};

exports.me = function(req, res){
    req.params.user = req.user;

    if(req.originalMethod == "GET")
    {
        res.render('users/edit',
            {
                user : req.user
            }
        );
    }
    else if (req.originalMethod == "POST")
    {
        //perform modifications

        res.render('users/edit',
            {
                user : req.user
            }
        );
    }
};

exports.set_new_password = function(req, res) {

    if (req.originalMethod == "GET") {

        var email = req.query["email"];
        var token = req.query["token"];

        if(email == null || token == null)
        {
            res.render('index',
                {
                    info_messages : ["Invalid request."]
                }
            );
        }
        else
        {
            User.findByEmail(email, function(err, user){
                if(!err)
                {
                    if(!user)
                    {
                        res.render('index',
                            {
                                error_messages : ["Non-existent user with email " + email + " : " + JSON.stringify(user)]
                            }
                        );
                    }
                    else
                    {
                        user.checkIfHasPredicateValue("ddr:password_reset_token", token, function(err, tokenMatches){
                            if(!err)
                            {
                                if(tokenMatches)
                                {
                                    res.render('users/set_new_password',
                                        {
                                            email : email,
                                            token : token
                                        }
                                    );
                                }
                                else
                                {
                                    res.render('index',
                                        {
                                            error_messages : ["Invalid token"]
                                        }
                                    );
                                }
                            }
                            else
                            {
                                res.render('index',
                                    {
                                        error_messages : ["Error retrieving token : " + JSON.stringify(user)]
                                    }
                                );
                            }
                        });

                    }
                }
                else
                {
                    res.render('index',
                        {
                            error_messages : ["Error retrieving user with email " + email + " : " + JSON.stringify(user)]
                        }
                    );
                }
            });
        }
    }
    else if (req.originalMethod == "POST")
    {
        var email = req.body["email"];
        var token = req.body["token"];

        if (token == null || email == null) {
            res.render('users/set_new_password',
                {
                    token : token,
                    email : email,
                    "error_messages": [
                        "Wrong link specified."
                    ]
                }
            );
        }
        else
        {
            var new_password = req.body["new_password"];
            var new_password_confirm = req.body["new_password_confirm"];

            if(new_password != new_password_confirm)
            {
                res.render('users/set_new_password',
                    {
                        token : token,
                        email : email,
                        error_messages : [
                            "Please make sure that the password and its confirmation match."
                        ]
                    }
                );
            }
            else
            {
                User.findByEmail(email, function(err, user){
                    if(!err)
                    {
                        if(!user)
                        {
                            res.render('index',
                                {
                                    "error_messages" :
                                        [
                                            "Unknown account with email " + email + "."
                                        ]
                                }
                            );
                        }
                        else
                        {
                            user.finishPasswordReset(new_password, token, function(err, result)
                            {
                                if(err)
                                {
                                    res.render('index',
                                        {
                                            "error_messages" :
                                                [
                                                    "Error resetting password for email : " + email +". Error description: " + JSON.stringify(result)
                                                ]
                                        }
                                    );
                                }
                                else
                                {
                                    res.render('index',
                                        {
                                            "info_messages" :
                                                [
                                                    "Password successfully reset for : " + email +". You can now login with your new password."
                                                ]
                                        }
                                    );
                                }
                            });
                        }
                    }
                });
            }
        }
    }
};

exports.reset_password = function(req, res){

    if(req.originalMethod == "GET")
    {
        res.render('users/reset_password',
            {
            }
        );
    }
    else if (req.originalMethod == "POST")
    {
        var email = req.body["email"];
        if(email != null)
        {
            User.findByEmail(email, function(err, user){
                if(!err)
                {
                    if(!user)
                    {
                        res.render('users/reset_password',
                            {
                                "error_messages" :
                                    [
                                        "Unknown account with email " + email + "."
                                    ]
                            }
                        );
                    }
                    else
                    {
                        user.startPasswordReset(function(err, result)
                        {
                            if(err)
                            {
                                res.render('index',
                                    {
                                        "error_messages" :
                                            [
                                                "Error resetting password for email : " + email +". Error description: " + JSON.stringify(result)
                                            ]
                                    }
                                );
                            }
                            else
                            {
                                res.render('index',
                                    {
                                        "info_messages" :
                                            [
                                                "Password reset instructions have been sent to : " + email +"."
                                            ]
                                    }
                                );
                            }
                        });
                    }
                }
            });
        }
        else
        {
            res.render('users/reset_password',
                {
                    "error_messages" :
                        [
                            "Please specify a valid email address"
                        ]
                }
            );
        }
    }
};

exports.getLoggedUser = function (req, res) {

    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(req.user != null)
    {
        req.params.username = req.user.ddr.username;
        exports.show(req, res);
    }
    else
    {
        if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
        {
            res.json(
                {
                    result : "error",
                    message : "There is no user authenticated in the system."
                }
            );
        }
        else
        {
            viewVars.projects = [];
            viewVars.info_messages = ["There is no user authenticated in the system."];
            res.render('index',
                viewVars
            );
        }
    }
};
