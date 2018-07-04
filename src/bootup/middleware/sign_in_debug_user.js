const async = require("async");
const fs = require("fs");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const User = rlequire("dendro", "src/models/user.js").User;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const UploadManager = rlequire("dendro", "src/models/uploads/upload_manager.js").UploadManager;

const signInDebugUser = function (app, callback)
{
    const signInDebugUser = function (req, res, next)
    {
    // Logger.log( "Dendro is in debug mode, user " + Config.debug.session.login_user +" automatically logged in.");

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
