const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Notification = require('../models/notifications/notification.js').Notification;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const DbConnection = require("../kb/db.js").DbConnection;
const _ = require("underscore");

const async = require("async");
const db = Config.getDBByID();

const db_notifications = Config.getDBByID("notifications");

const app = require('../app');

//Get user notifications for a specific user, ordered by date
exports.get_unread_user_notifications = function (req ,res) {
    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const userUri = req.user.uri;

        if (!isNull(userUri))
        {
            let query =
                "WITH [0] \n" +
                "SELECT ?uri \n" +
                "WHERE {\n" +
                "?uri rdf:type ddr:Notification. \n" +
                "?uri ddr:resourceAuthorUri [1]. \n" +
                "?uri ddr:modified ?date. \n" +
                "?uri foaf:status \"unread\". \n" +
                "} \n" +
                "ORDER BY DESC(?date)";

            query = DbConnection.addLimitsClauses(query, null, null);

            db.connection.execute(query,
                DbConnection.pushLimitsArguments([
                    {
                        type: Elements.types.resourceNoEscape,
                        value: db_notifications.graphUri
                    },
                    {
                        type: Elements.types.resourceNoEscape,
                        value: userUri
                    }
                ]),
                function (err, notifications)
                {
                    if (isNull(err))
                    {
                        res.json(notifications);
                    }
                    else
                    {
                        const errorMsg = "Error fetching User's unread notifications ";
                        res.status(500).json({
                            result: "Error",
                            message: errorMsg + JSON.stringify(notifications)
                        });
                    }
                });
        }
        else
        {
            const errorMsg = "Invalid user when searching for notifications";
            res.status(500).json({
                result: "Error",
                message: errorMsg
            });
        }
    }
    else
    {
        const msg = "This method is only accessible via HTML. Accept:\"text/html\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.get_notification_info = function (req, res) {
    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const userUri = req.user.uri;
        const notificationUri = req.query.notificationUri;

        if (!isNull(userUri) && !isNull(notificationUri))
        {
            let query =
                "WITH [0] \n" +
                "SELECT ?actionType ?userWhoActed ?resourceTargetUri ?modified ?shareURI\n" +
                "WHERE { \n" +
                "[1] ddr:actionType ?actionType. \n" +
                "[1] ddr:userWhoActed ?userWhoActed. \n" +
                "[1] ddr:resourceTargetUri ?resourceTargetUri. \n" +
                "[1] ddr:resourceAuthorUri [2]. \n" +
                "[1] ddr:modified ?modified. \n" +
                "OPTIONAL { [1] ddr:shareURI ?shareURI. } \n" +
                "} \n";

            query = DbConnection.addLimitsClauses(query, null, null);

            db.connection.execute(query,
                DbConnection.pushLimitsArguments([
                    {
                        type: Elements.types.resourceNoEscape,
                        value: db_notifications.graphUri
                    },
                    {
                        type: Elements.types.resourceNoEscape,
                        value: notificationUri
                    },
                    {
                        type: Elements.types.resourceNoEscape,
                        value: userUri
                    }
                ]),
                function (err, notification)
                {
                    if (isNull(err))
                    {
                        if (notification.length > 0)
                            res.json(notification);
                        else
                        {
                            const errorMsg = "Invalid notification uri";
                            res.status(404).json({
                                result: "Error",
                                message: errorMsg
                            });
                        }
                    }
                    else
                    {
                        const errorMsg = "Error getting info from a User's notification";
                        res.status(500).json({
                            result: "Error",
                            message: errorMsg
                        });
                    }
                });
        }
        else
        {
            const errorMsg = "Invalid user and notification Uri";
            res.status(500).json({
                result: "Error",
                message: errorMsg
            });
        }
    }
    else
    {
        const msg = "This method is only accessible via HTML. Accept:\"text/html\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

//Deletes a user's notification
exports.delete = function (req, res) {
    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const userUri = req.user.uri;
        const notificationUri = req.query.notificationUri;

        if(!isNull(userUri) && !isNull(notificationUri))
        {
            let query =
                "WITH [0] \n" +
                "DELETE { [1] ?p ?v} \n"+
                "WHERE { \n" +
                "[1] ?p ?v. \n" +
                "[1] ddr:resourceAuthorUri [2]. \n" +
                "} \n";

            query = DbConnection.addLimitsClauses(query, null, null);

            db.connection.execute(query,
                DbConnection.pushLimitsArguments([
                    {
                        type : Elements.types.resourceNoEscape,
                        value: db_notifications.graphUri
                    },
                    {
                        type : Elements.types.resourceNoEscape,
                        value: notificationUri
                    },
                    {
                        type: Elements.types.resourceNoEscape,
                        value: userUri
                    }
                ]),
                function(err, result) {
                    if(isNull(err))
                    {
                        if(result.length > 0)
                        {
                            res.json({
                                result : "OK",
                                message : "Notification successfully deleted"
                            });
                        }
                        else
                        {
                            const errorMsg = "Invalid notification uri";
                            res.status(404).json({
                                result: "Error",
                                message: errorMsg
                            });
                        }
                    }
                    else
                    {
                        const errorMsg = "Error deleting a User's notification";
                        res.status(500).json({
                            result: "Error",
                            message: errorMsg
                        });
                    }
                });
        }
        else
        {
            const errorMsg = "Missing required field notification Uri";
            res.status(500).json({
                result: "Error",
                message: errorMsg
            });
        }
    }
    else
    {
        const msg = "This method is only accessible via HTML. Accept:\"text/html\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};



