const Config = function() { return GLOBAL.Config; }();

const User = require(Config.absPathInSrcFolder("/models/user.js")).User;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;

const db = function() { return GLOBAL.db.default; }();
const gfs = function() { return GLOBAL.gfs.default; }();

const async = require('async');
const _ = require('underscore');
const fs = require("fs");
const path = require('path');

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
    req.params.user = req.session.user;

    if(req.originalMethod == "GET")
    {
        res.render('users/edit',
            {
                user : req.session.user
            }
        );
    }
    else if (req.originalMethod == "POST")
    {
        //perform modifications

        res.render('users/edit',
            {
                user : req.session.user
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

    if(req.session.user != null)
    {
        req.params.username = req.session.user.ddr.username;
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

exports.get_avatar = function (req, res) {
    var username = req.params['username'];

    User.findByUsername(username, function (err, user) {
        if(!err)
        {
            if(!user)
            {
                res.status(404).json({
                    result : "Error",
                    message :"Error trying to find user with username " + username + " User does not exist"
                });
            }
            else
            {
                if(!user.ddr.hasAvatar)
                {
                    console.log("User does not have an avatar");
                    res.writeHead(200,
                        {
                            'Content-disposition': 'filename="' + "avatar"+"\"",
                            'Content-type': "image/png"
                        });

                    var absPathOfFileToServe = Config.absPathInPublicFolder("images/default_avatar/defaultAvatar.png");
                    var fileStream = fs.createReadStream(absPathOfFileToServe);
                    fileStream.pipe(res);
                }
                else
                {
                    console.log("User has an avatar");
                    console.log(user.ddr.hasAvatar);

                    getAvatarFromGfs(user, function (err, avatarFilePath) {
                        if(!err)
                        {
                            //var fs = require('fs');
                            var fileStream = fs.createReadStream(avatarFilePath);
                            var filename = path.basename(avatarFilePath);

                            res.writeHead(200,
                                {
                                    'Content-disposition': 'filename="' + filename+"\"",
                                    'Content-type': path.extname(filename)
                                });

                            fileStream.pipe(res);
                        }
                        else
                        {
                            res.status(500).json({
                                result : "Error",
                                message :"Error trying to get from gridFs user Avatar from user " + username + " Error reported: " + JSON.stringify(avatarFilePath)
                            });
                        }
                    });

                    /*res.json(
                        {
                            userUri : user.uri
                        }
                    );*/
                }
            }
        }
        else
        {
            res.status(500).json({
                result : "Error",
                message :"Error trying to find user with username " + username + " Error reported: " + JSON.stringify(err)
            });
        }
    });
};

exports.upload_avatar = function (req, res) {
    var avatar = req.body["new_avatar"];
    console.log("At upload_avatar");
    console.log(req.body["new_avatar"]);

    var currentUser = req.session.user;

    User.findByUri(currentUser.uri, function (err, user) {
        if(!err)
        {
            var avatarExt = avatar.split(';')[0].split('/')[1];
            //var avatarUri = user.getAvatarUri();
            var avatarUri = "/avatar/" + currentUser.ddr.username + "/avatar." + avatarExt;
            console.log('avatarExt: ', avatarExt);
            console.log('avatarUri: ', avatarUri);


            saveAvatarInGfs(avatar, avatarUri, user, avatarExt, function (err, data) {
                if(!err)
                {
                    console.log("saved avatar with success with Uri: " + avatarUri);
                    //TODO update the user.ddr.hasAvatar property
                    user.ddr.hasAvatar = avatarUri;
                    user.save(function (err, newUser) {
                        if(!err)
                        {
                            var msg = "Updated hasAvatar for user " + user.uri;
                            console.log(msg);
                            res.status(200).json({
                                result : "Success",
                                message :"Avatar saved successfully."
                            });
                        }
                        else
                        {
                            var msg = "Error updating hasAvatar for user " + user.uri + ". Error reported :" + data;
                            console.log(msg);
                            res.status(500).json({
                                result: "Error",
                                message: msg
                            });
                        }
                    });
                    /*res.json(
                        {
                            hasAvatar : avatarUri
                        }
                    );*/
                }
                else
                {
                    res.status(500).json({
                        result : "Error",
                        message :"Error user " + currentUser.uri + " avatar. Error reported: " + JSON.stringify(data)
                    });
                }
            });
            //user.ddr.hasAvatar = avatarUri;
        }
        else
        {
            res.status(500).json({
                result : "Error",
                message :"Error trying to find user with uri " + currentUser.uri + " Error reported: " + JSON.stringify(err)
            });
        }
    });
};

var getAvatarFromGfs = function (user, callback)
{
    var tmp = require('tmp');
    var fs = require('fs');
    //var avatarUri = user.getAvatarUri();
    var avatarUri = "/avatar/" + user.ddr.username + "/avatar." + "png";

    tmp.dir(
        {
            mode: Config.tempFilesCreationMode,
            dir : Config.tempFilesDir
        },
        function(err, tempFolderPath){
            //var avatarFilePath = tempFolderPath + '\\' +  'avatar.png';
            //var avatarName = path.join(user.ddr.username, "avatar.png");
            /*var avatarFilePath = path.join(tempFolderPath, 'avatarOutput.png');*/
            var avatarFilePath = path.join(tempFolderPath, user.ddr.username + "avatarOutput.png");
            console.log('avatarFilePath is: ', avatarFilePath);
            var writeStream = fs.createWriteStream(avatarFilePath);

            gfs.connection.get(avatarUri, writeStream, function(err, result){
                //gfs.connection.get(avatarUri, dataStream, function(err, result){
                if(!err)
                {
                    console.log('got avatar successfully from GFS:');
                    console.log('writeStream is: ');
                    console.log(writeStream);
                    //writeStream.end();
                    //var dataBuffer = dataStream._writableState.getBuffer();
                    //console.log('databuffer is:');
                    //console.log(dataBuffer);
                    //callback(null, dataBuffer);
                    callback(null, avatarFilePath);
                }
                else
                {
                    var msg = "Error getting the avatar file from GridFS for user " + user.uri;
                    console.log('Error is: ');
                    console.log(err);
                    console.error(msg);
                    callback(err, msg);
                }
            });
        }
    );
};


var saveAvatarInGfs = function (avatar, avatarUri, user, extension, callback) {
    var fs = require('fs');
    var tmp = require('tmp');
    //var avatarUri = user.getAvatarUri();
    var base64Data = avatar.replace(/^data:image\/png;base64,/, "");


    gfs.connection.delete(avatarUri, function(err, result)
    {
        /*if(!err)
        {*/
            tmp.dir(
                {
                    mode: Config.tempFilesCreationMode,
                    dir : Config.tempFilesDir
                },
                function(err, tempFolderPath){
                    var path = require('path');
                    var avatarFilePath = path.join(tempFolderPath, 'avatar.png');
                    console.log('avatarFilePath is: ', avatarFilePath);
                    fs.writeFile(avatarFilePath, base64Data, 'base64', function(error) {
                        console.log('Error at WriteFile: ', error);
                        var readStream = fs.createReadStream(avatarFilePath);
                        gfs.connection.put(
                            avatarUri,
                            readStream,
                            function (err, result)
                            {
                                if(err != null)
                                {
                                    var msg = "Error saving avatar file in GridFS :" + result + " for user " + user.uri;
                                    console.error(msg);
                                    callback(err, msg);
                                }
                                else
                                {
                                    console.log('Saved avatar successfully in the GFS');
                                    console.log('result from saving avatar:');
                                    console.log(result);
                                    console.log('readStream is:');
                                    console.log(readStream);
                                    callback(null, result);
                                }
                            },
                            {
                                user : user.uri,
                                fileExtension : extension,
                                type : "nie:File"
                            }
                        );
                    });
                }
            );
        /*}
        else
        {
            var msg = "Error deleting previous avatar file in GridFS :" + result + " for user " + user.uri;
            console.error(msg);
            callback(err, msg);
        }*/
    });
};
