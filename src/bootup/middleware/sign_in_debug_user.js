const async = require("async");
const fs = require("fs");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const User = require(Pathfinder.absPathInSrcFolder("models/user.js")).User;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const UploadManager = require(Pathfinder.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;

const signInDebugUser = function (app, callback)
{
    const signInDebugUser = function (req, res, next)
    {
    // console.log("[INFO] Dendro is in debug mode, user " + Config.debug.session.login_user +" automatically logged in.");

        if (isNull(req.user))
        {
            User.findByUsername(Config.debug.session.login_user,
                function (err, user)
                {
                    if (!err)
                    {
                        if (isNull(req.user))
                        {
                            req.user = user;
                            req.session.upload_manager = new UploadManager(user.ddr.username);
                        }

                        // Pass the request to express
                        next(null, req, res);
                    }
                });
        }
        else
        {
            next(null, req, res);
        }
    };

    if (Config.debug.active && Config.debug.session.auto_login)
    {
        app.use(signInDebugUser);
    }

    callback(null);
};

module.exports.signInDebugUser = signInDebugUser;
