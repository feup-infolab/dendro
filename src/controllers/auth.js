var Config = function() { return GLOBAL.Config; }();

var db = function() { return GLOBAL.db.default; }();

var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var UploadManager = require(Config.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;



module.exports.login = function(req, res, next){

    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

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
            req.passport.authenticate(
                'local',
                {
                    successRedirect: '/user/me',
                    failureRedirect: '/login',
                    failureFlash: true
                },
                function(err, user, info)
                {
                    if(!err)
                    {
                        req.session.user = user;
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
                            console.log("User " + user.ddr.username + " signed in.");
                            res.redirect('/projects/my');
                        }
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

    if(req.session.user != null)
    {
        req.session.user = null;
        req.session.isAdmin = null;
        req.session.upload_manager = null;

        res.render('index', {
            title : "Dendro",
            success_messages: ["Successfully logged out"]
        });
    }
    else
    {
        res.render('index', {
            title : "Dendro",
            success_messages: ["Cannot log you out because you are not logged in"]
        });
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
            if(req.body.username == null)
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your username"]
                    }
                );
            }
            else if(req.body.email == null)
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your email"]
                    }
                );
            }
            else if(req.body.password == null)
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your password"]
                    }
                );
            }
            else if(req.body.repeat_password == null)
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please repeat your password"]
                    }
                );
            }
            else if(req.body.firstname == null)
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your first name"]
                    }
                );
            }
            else if(req.body.surname == null)
            {
                res.render('auth/register',
                    {
                        title: "Register on Dendro",
                        error_messages: ["Please specify your surname"]
                    }
                );
            }
            else if(req.body.username != null && !req.body.username.match(/^[0-9a-z]+$/))
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

                                User.createAndInsertFromObject(userData, function(err, newUser){
                                    if(!err)
                                    {
                                        req.flash('success', "New user " + req.body.username +" created successfully. You can now login with the username and password you specified.");
                                        res.redirect('/login');
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
                                        error_messages: ["Passwords do not match"],
                                        new_user : req.body
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
    }
};
