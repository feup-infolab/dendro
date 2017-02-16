var Config = function() { return GLOBAL.Config; }();

var db = function() { return GLOBAL.db.default; }();

var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var UploadManager = require(Config.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;

module.exports.login = function(req, res){

    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(req.originalMethod == "GET")
    {
        res.render('auth/login');
    }
    else if (req.originalMethod == "POST")
    {
        //prevent injections, test for alphanumeric and _ characters only in the username
        var alphaNumericTest = new RegExp(/^[a-zA-Z0-9_]+$/);
        if(req.body.username != null && alphaNumericTest.test(req.body.username))
        {
            User.findByUsername(req.body.username,
                function(err, user) {
                    if(!err)
                    {
                        if( user != null )
                        {
                            var bcrypt = require('bcrypt');
                            console.log(user.ddr.salt);
                            bcrypt.hash(req.body.password, user.ddr.salt, function(err, hashedPassword) {
                                if(!err)
                                {
                                    if(user.ddr.password == hashedPassword)
                                    {
                                        req.session.user = user;
                                        req.session.upload_manager = new UploadManager(user.ddr.username);

                                        user.isAdmin(function(err, isAdmin){
                                            if(!err)
                                            {
                                                req.session.isAdmin = isAdmin;

                                                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                                                {
                                                    res.json(
                                                        {
                                                            result : "ok",
                                                            message : "Welcome, " + user.foaf.firstName + " " + user.foaf.surname + "."
                                                        }
                                                    );
                                                }
                                                else
                                                {
                                                    req.flash('success', "Welcome, " + user.foaf.firstName + " " + user.foaf.surname + ".");
                                                    console.log("User " + req.body.username + " signed in.");
                                                    res.redirect('/projects/my');
                                                }
                                            }
                                            else
                                            {
                                                res.json(
                                                    {
                                                        result : "error",
                                                        message : "Error occurred when checking if user " + user.ddr.username + " is an administrator. Error reported: " + JSON.stringify(isAdmin)
                                                    }
                                                );
                                            }
                                        });
                                    }
                                    else
                                    {
                                        if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                                        {
                                            res.status(401).json(
                                                {
                                                    result : "error",
                                                    message : "Invalid username/password combination."
                                                }
                                            );
                                        }
                                        else
                                        {
                                            res.render('auth/login',
                                                {
                                                    title : 'Error Logging in',
                                                    error_messages: [
                                                        "Invalid username/password combination"
                                                    ]
                                                }
                                            );
                                        }
                                    }
                                }
                                else
                                {
                                    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                                    {
                                        res.status(401).json(
                                            {
                                                result : "error",
                                                message : "Unknown error during authentication"
                                            }
                                        );
                                    }
                                    else
                                    {
                                        res.render('auth/login',
                                            {
                                                title : 'Error Logging in',
                                                error_messages: [
                                                    "Unknown error during authentication"
                                                ]
                                            }
                                        );
                                    }
                                }
                            });
                        }
                        else
                        {
                            res.render('auth/login',
                                {
                                    title : 'Error Logging in',
                                    error_messages :
                                        [
                                            "Non-existent user " + req.body.username
                                        ]
                                }
                            );
                        }
                    }
                    else
                    {
                        res.render('auth/login',
                            {
                                title : 'Error Logging in',
                                error_messages :
                                    [
                                        "Error accessing user data " + user
                                    ]
                            }
                        );
                    }
            });
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
    req.session.user = null;
    req.session.isAdmin = null;
    req.session.upload_manager = null;

    req.flash('success', "Successfully logged out");

    console.log("Redirecting...");
    res.redirect('/');

};

module.exports.register = function(req, res){

    if(req.originalMethod == "GET")
    {
        res.render('auth/register',
            {
                title : "Register on Dendro"
            }
        );
    }
    else if (req.originalMethod == "POST")
    {
        if(req.body.username != null && !req.body.username.match(/^[0-9a-z]+$/))
        {
            res.render('auth/register',
                {
                    title: "Register on Dendro",
                    error_messages: ["Username can not include spaces or special characters. It should only include non-capital letters (a to z) and numbers (0 to 9). Valid : johndoe91. Invalid: johndoe 01, johndoe*01, john@doe, john%doe9$ "]
                }
            );
        }
        else
        {
            User.findByUsername(req.body.username, function(err, user){
                if(!err)
                {
                    if(user != null)
                    {
                        res.render('auth/register',
                            {
                                title : "Register on Dendro",
                                error_messages: ["Username already exists"]
                            }
                        );
                    }
                    else
                    {
                        if(req.body.password == req.body.repeat_password)
                        {
                            var userData = {
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

                            User.createAndInsertFromObject(userData, function(err, newUser){
                                if(!err)
                                {
                                    req.session.user = newUser;
                                    req.flash('success', "New user " + req.body.username +" created successfully");
                                    var messages = req.flash('info');
                                    res.redirect('/projects/my');
                                }
                                else
                                {
                                    res.render('index',
                                        {
                                            error_messages: [newUser]
                                        }
                                    );
                                }

                            });
                        }
                        else
                        {
                            res.render('auth/register',
                                {
                                    title : "Register on Dendro",
                                    error_messages: ["Passwords do not match"]
                                }
                            );
                        }
                    }
                }
                else
                {
                    res.render('auth/register',
                        {
                            error_messages: [user]
                        }
                    );
                }
            });
        }
    }
};
