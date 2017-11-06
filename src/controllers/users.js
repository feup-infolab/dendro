const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const async = require("async");
const _ = require("underscore");
const fs = require("fs");
const db = Config.getDBByID();
const gfs = Config.getGFSByID();
const tmp = require("tmp");

const DendroMongoClient = require(Pathfinder.absPathInSrcFolder("/kb/mongo.js")).DendroMongoClient;

/*
 * GET users listing.
 */
exports.users_autocomplete = function(req, res){

    if(!isNull(req.params.requestedResourceUri))
    {

        User.autocomplete_search(
            req.query.user_autocomplete,
            Config.recommendation.max_autocomplete_results,
            function(err, users)
            {
                if(isNull(err))
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
};

exports.all = function(req, res){

    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    let viewVars = {
        title: 'User list'
    };

    viewVars = DbConnection.paginate(req,
        viewVars
    );

    const getUserCount = function (cb) {
        User.getCount(function (err, count) {
            cb(err, count);
        });
    };

    const getAllUsers = function (cb) {
        User.all(function (err, users) {
            cb(err, users);
        }, req, null, [Elements.access_types.private, Elements.access_types.locked], [Elements.access_types.api_readable]);
    };

    async.parallel(
        [
            getUserCount, getAllUsers
        ], function(err, results)
        {
            if(isNull(err))
            {
                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                {
                    const users = results[1];
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
        if(isNull(err))
        {
            if(!isNull(user))
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
    const username = req.params["username"];

    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    const sendResponse = function(err, user)
    {
        if(isNull(err))
        {
            if(!isNull(user))
            {
                if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
                {
                    const filteredUser = Descriptor.removeUnauthorizedFromObject(user, [Elements.access_types.private, Elements.access_types.locked], [Elements.access_types.api_readable]);
                    res.json(
                        filteredUser
                    );
                }
                else
                {
                    res.render('users/show',
                        {
                            title : "Viewing user " + user.foaf.firstName + " " + user.foaf.surname,
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

    };

    if(!isNull(req.params.username))
    {
        User.findByUsername(req.params.username, function(err, user)
        {
            sendResponse(err, user);
        });
    }
    else if(!isNull(req.params.requestedResourceUri))
    {
        User.findByUri(req.params.requestedResourceUri, function(err, user)
        {
            sendResponse(err, user);
        });
    }
};

exports.me = function(req, res){
    req.params.user = req.user;

    if(req.originalMethod === "GET")
    {
        res.render('users/edit',
            {
                user : req.user
            }
        );
    }
    else if (req.originalMethod === "POST")
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
    let email = req.query["email"];
    let token = req.query["token"];
    
    if (req.originalMethod === "GET") {

        if(isNull(email) || isNull(token))
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
                if(isNull(err))
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
                            if(isNull(err))
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
    else if (req.originalMethod === "POST")
    {
        if (isNull(token) || isNull(email)) {
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
            const new_password = req.body["new_password"];
            const new_password_confirm = req.body["new_password_confirm"];

            if(new_password !== new_password_confirm)
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
                    if(isNull(err))
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

exports.reset_password = function (req, res) {

    if (req.originalMethod === "GET") {
        res.render('users/reset_password',
            {}
        );
    }
    else if (req.originalMethod === "POST") {
        const email = req.body["email"];
        if(!isNull(email))
        {
            User.findByEmail(email, function(err, user){
                if(isNull(err))
                {
                    if(!user)
                    {
                        res.render('users/reset_password',
                            {
                                "error_messages": [
                                    "Unknown account with email " + email + "."
                                ]
                            }
                        );
                    }
                    else {
                        user.startPasswordReset(function (err, result) {
                            if (err) {
                                res.render('index',
                                    {
                                        "error_messages": [
                                            "Error resetting password for email : " + email + ". Error description: " + JSON.stringify(result)
                                        ]
                                    }
                                );
                            }
                            else {
                                res.render('index',
                                    {
                                        "info_messages": [
                                            "Password reset instructions have been sent to : " + email + "."
                                        ]
                                    }
                                );
                            }
                        });
                    }
                }
            });
        }
        else {
            res.render('users/reset_password',
                {
                    "error_messages": [
                        "Please specify a valid email address"
                    ]
                }
            );
        }
    }
};

exports.getLoggedUser = function (req, res) {

    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if(!isNull(req.user))
    {
        req.params.requestedResourceUri = req.user.uri;
        exports.show(req, res);
    }
    else
    {
        if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
        {
            res.status(403);
            res.json(
                {
                    result : "error",
                    message : "There is no user authenticated in the system."
                }
            );
        }
        else
        {
            req.flash("error", "There is no user authenticated in the system.");
            res.status(403).render('index');
        }
    }
};


exports.get_avatar = function (req, res) {
    let username = req.params['username'];
    let requestedResourceUri = req.params.uri;
    let fetcherFunction;
    let identifier;

    const getUser = function(callback)
    {
        if(!isNull(username))
        {
            User.findByUsername(username, callback);
        }
        else if (!isNull(req.params.requestedResourceUri))
        {
            User.findByUri(req.params.requestedResourceUri, callback);
        }
    }

    const serveDefaultAvatar = function()
    {
        //User does not have an avatar
        let absPathOfFileToServe = Pathfinder.absPathInPublicFolder("images/default_avatar/defaultAvatar.png");
        let fileStream = fs.createReadStream(absPathOfFileToServe);

        let filename = path.basename(absPathOfFileToServe);

        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": "attachment; filename=" + filename
        });

        fileStream.pipe(res);
    };

    getUser(function (err, user) {
        if (!err) {
            if (!user) {
                res.status(404).json({
                    result: "Error",
                    message: "Error trying to find user with identifier " + identifier + " User does not exist"
                });
            }
            else {
                if (!user.ddr.hasAvatar) {
                    serveDefaultAvatar();
                }
                else
                {
                    //User has an avatar
                    user.getAvatarFromGridFS(function (err, avatarFilePath) {
                        if (!err) {
                            let fileStream = fs.createReadStream(avatarFilePath);
                            let filename = path.basename(avatarFilePath);

                            res.writeHead(200, {
                                "Content-Type": "application/octet-stream",
                                "Connection": "keep-alive",
                                "Content-Disposition": "attachment; filename=" + filename
                            });

                            fileStream.pipe(res);
                        }
                        else {
                            if(err === 404)
                            {
                                serveDefaultAvatar();
                            }
                            else
                            {
                                res.status(500).json({
                                    result: "Error",
                                    message: "Error trying to get from gridFs user Avatar from user identifier " + identifier + " Error reported: " + JSON.stringify(avatarFilePath)
                                });
                            }
                        }
                    });
                }
            }
        }
        else {
            res.status(500).json({
                result: "Error",
                message: "Error trying to find user with username " + username + " Error reported: " + JSON.stringify(err)
            });
        }
    });
};

exports.upload_avatar = function (req, res) {
    let avatar = req.body["newAvatar"];
    let currentUser = req.user;
    User.findByUri(currentUser.uri, function (err, user) {
        if (!err) {
            let avatarExt;
            let avatarUri;

            try
            {
                avatarExt = avatar.split(';')[0].split('/')[1];
                avatarUri = "/avatar/" + currentUser.ddr.username + "/avatar." + avatarExt;
            }
            catch(e)
            {
                return res.status(400).json({
                    result: "error",
                    message: e.message
                });
            }

            user.saveAvatarInGridFS(avatar, avatarExt, function (err, data) {
                if (!err) {
                    user.ddr.hasAvatar = avatarUri;
                    user.save(function (err, newUser) {
                        if (!err) {
                            return res.status(200).json({
                                result: "Success",
                                message: "Avatar saved successfully."
                            });
                        }
                        else
                        {
                            let msg = "Error updating hasAvatar for user " + user.uri + ". Error reported :" + newUser;
                            console.error(msg);
                            return res.status(500).json({
                                result: "Error",
                                message: msg
                            });
                        }
                    });
                }
                else
                {
                    return res.status(500).json({
                        result: "Error",
                        message: "Error user " + currentUser.uri + " avatar. Error reported: " + JSON.stringify(data)
                    });
                }
            });
        }
        else {
            return res.status(500).json({
                result: "Error",
                message: "Error trying to find user with uri " + currentUser.uri + " Error reported: " + JSON.stringify(err)
            });
        }
    });
};

var checkIfIsEmail = function (email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

exports.edit = function (req, res, next) {
    let changedPassword = false;
    if (!isNull(req.user)) {
        User.findByUri(req.user.uri, function (err, user) {
            if (!err && !isNull(user)) {
                async.series([
                    function (callback) {
                        if (!isNull(req.body.email) && checkIfIsEmail(req.body.email)) {
                            user.foaf.mbox = req.body.email;
                            return callback(null, null);
                        }
                        else {
                            let msg = "Invalid email format!";
                            return callback(true, msg);
                        }
                    },
                    function (callback) {
                        if (!isNull(req.body.firstname)) {
                            user.foaf.firstName = req.body.firstname;
                        }
                        callback(null, null);
                    },
                    function (callback) {
                        if (!isNull(req.body.surname)) {
                            user.foaf.surname = req.body.surname;
                        }
                        callback(null, null);
                    },
                    function (callback) {
                        if (!isNull(req.body.password) && !isNull(req.body.repeat_password) && req.body.password.length > 0 && req.body.repeat_password.length > 0) {
                            if (req.body.password === req.body.repeat_password && req.body.password.length >= 8) {
                                const bcrypt = require('bcryptjs');
                                bcrypt.hash(req.body.password, user.ddr.salt, function (err, hashedPassword) {
                                    if (!err) {
                                        user.ddr.password = hashedPassword;
                                        changedPassword = true;
                                        return callback(null, null);
                                    }
                                    else {
                                        let msg = "Error encrypting password";
                                        console.error(msg);
                                        /*req.flash('error', msg);
                                         res.redirect('/me');*/
                                        return callback(true, msg);
                                    }
                                });
                            }
                            else {
                                let msg = "Passwords fields must be the same and at least 8 characters in length!";
                                console.error(msg);
                                //req.flash('error', msg);
                                //res.redirect('/me');
                                return callback(true, msg);
                            }
                        }
                        else {
                            return callback(null, null);
                        }
                    }
                ], function (err, results) {
                    if (!err) {
                        user.save(function (err, editedUser) {
                            if (!err) {
                                let auth = require(Pathfinder.absPathInSrcFolder("/controllers/auth.js"));
                                req.flash('success', "User " + editedUser.ddr.username + " edited.");
                                //console.log("User " + editedUser.ddr.username + " edited.");
                                //res.redirect('/me');
                                if (changedPassword) {
                                    req.flash('info', "Since you changed your password, you need to login again!");
                                    auth.logout(req, res);
                                }
                                else {
                                    req.body.username = editedUser.ddr.username;
                                    if (req.user instanceof User) {
                                        req.logIn(user, function (err) {
                                            if (!err) {
                                                res.redirect('back');
                                            }
                                            else {
                                                let msg = "Error updating user session. Error reported:  " + JSON.stringify(err);
                                                console.error(msg);
                                                req.flash('error', msg);
                                                auth.logout(req, res);
                                            }
                                        });
                                    }
                                    else {
                                        req.flash('info', "Session was lost! Please login again.");
                                        auth.logout(req, res);
                                    }
                                }
                            }
                            else {
                                let msg = "Error editing user " + user.uri + ". Error reported :" + editedUser;
                                console.error(msg);
                                req.flash('error', msg);
                                res.redirect('/me');
                            }
                        });
                    }
                    else {
                        let msg = "Error editing user " + user.uri + ". Error reported :" + JSON.stringify(results);
                        console.error(msg);
                        req.flash('error', msg);
                        res.redirect('/me');
                    }
                });
            }
            else {
                let msg = "User to edit was not found";
                console.error(msg);
                req.flash('error', msg);
                res.redirect('/me');
            }
        });
    }
    else {
        let msg = "User to edit was not specified";
        console.error(msg);
        req.flash('error', msg);
        res.redirect('/me');
    }
};
