const path = require("path");
const fs = require("fs");
const Pathfinder = global.Pathfinder;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const appendLocalsToUseInViews = function (app, callback)
{
    const appendLocalsToUseInViews = function (req, res, next)
    {
        const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

        // append request and session to use directly in views and avoid passing around needless stuff
        res.locals.request = req;
        res.locals.baseURI = Config.baseUri;

        if (isNull(res.locals.Config) && !isNull(Config))
        {
            res.locals.Config = Config;
        }

        const flashMessagesInfo = req.flash("info");

        if (!isNull(flashMessagesInfo) &&
            flashMessagesInfo instanceof Array &&
            flashMessagesInfo.length > 0)
        {
            if (typeof res.locals.info_messages === "undefined")
            {
                res.locals.info_messages = flashMessagesInfo;
            }
            else
            {
                res.locals.info_messages = req.info_messages.concat(flashMessagesInfo);
            }
        }

        const flashMessagesError = req.flash("error");

        if (!isNull(flashMessagesError) &&
            flashMessagesError instanceof Array &&
            flashMessagesError.length > 0)
        {
            if (isNull(res.locals.error_messages))
            {
                res.locals.error_messages = flashMessagesError;
            }
            else
            {
                res.locals.error_messages = res.locals.error_messages.concat(flashMessagesError);
            }
        }

        const flashMessagesSuccess = req.flash("success");

        if (!isNull(flashMessagesSuccess) &&
            flashMessagesSuccess instanceof Array &&
            flashMessagesSuccess.length > 0)
        {
            if (typeof res.locals.success_messages === "undefined")
            {
                res.locals.success_messages = flashMessagesSuccess;
            }
            else
            {
                res.locals.success_messages = res.locals.success_messages.concat(flashMessagesSuccess);
            }
        }

        if (Config.debug.session.auto_login)
        {
            if (!isNull(req.session) && !isNull(req.user) && req.user instanceof Object)
            {
                // append request and session to use directly in views and avoid passing around needless stuff
                res.locals.session = req.session;

                if (isNull(req.session.isAdmin))
                {
                    req.user.isAdmin(function (err, isAdmin)
                    {
                        req.session.isAdmin = isAdmin;
                        next(null, req, res);

                        if (err)
                        {
                            console.error("Error checking for admin status of user " + req.user.uri + " !!");
                        }
                    });
                }
                else
                {
                    next(null, req, res);
                }
            }
            else
            {
                next(null, req, res);
            }
        }
        else
        {
            res.locals.session = req.session;
            res.locals.user = req.user;

            // req.passport = req.passport;

            /* if(req.session != null && req.user != null)
             {
             //append request and session to use directly in views and avoid passing around needless stuff
             res.locals.user = req.user;
             res.locals.isAdmin = req.session.isAdmin;
             } */

            next(null, req, res);
        }
    };

    app.use(appendLocalsToUseInViews);

    callback(null);
};

module.exports.appendLocalsToUseInViews = appendLocalsToUseInViews;
