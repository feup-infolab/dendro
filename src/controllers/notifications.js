var Notification = require('../models/notifications/notification.js').Notification;
var DbConnection = require("../kb/db.js").DbConnection;
var _ = require('underscore');

var async = require('async');
var db = function() { return GLOBAL.db.default; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();

var app = require('../app');

//Get user notifications for a specific user, ordered by date
exports.get_unread_user_notifications = function (req ,res) {

    var userUri = req.user.uri;

    if(userUri)
    {
        var query =
            "WITH [0] \n" +
            "SELECT ?uri \n" +
            "WHERE {\n" +
            "?uri rdf:type ddr:Notification. \n" +
            "?uri ddr:resourceAuthorUri [1]. \n" +
            "?uri dcterms:modified ?date. \n" +
            "?uri foaf:status \"unread\". \n" +
            "} \n" +
            "ORDER BY DESC(?date)";

        query = DbConnection.addLimitsClauses(query, null, null);

        db.connection.execute(query,
            DbConnection.pushLimitsArguments([
                {
                    type : DbConnection.resourceNoEscape,
                    value: db_notifications.graphUri
                },
                {
                    type : DbConnection.resourceNoEscape,
                    value: userUri
                }
            ]),
            function(err, notifications) {
                if(!err)
                {
                    res.json(notifications);
                }
                else
                {
                    var errorMsg = "Error fetching User's unread notifications ";
                    res.status(500).json({
                        result: "Error",
                        message: errorMsg + JSON.stringify(notifications)
                    });
                }
            });
    }
    else
    {
        var errorMsg = "Invalid user when searching for notifications";
        res.status(500).json({
            result: "Error",
            message: errorMsg
        });
    }
};

exports.get_notification_info = function (req, res) {
    var userUri = req.user.uri;
    var notificationUri = req.query.notificationUri;

    if(userUri && notificationUri)
    {
        var query =
            "WITH [0] \n" +
            "SELECT ?actionType ?userWhoActed ?resourceTargetUri ?modified ?shareURI\n" +
            "WHERE { \n" +
            "[1] ddr:actionType ?actionType. \n" +
            "[1] ddr:userWhoActed ?userWhoActed. \n" +
            "[1] ddr:resourceTargetUri ?resourceTargetUri. \n" +
            "[1] ddr:resourceAuthorUri [2]. \n"+
            "[1] dcterms:modified ?modified. \n"+
            "OPTIONAL { [1] ddr:shareURI ?shareURI. } \n"+
            "} \n";

        query = DbConnection.addLimitsClauses(query, null, null);

        db.connection.execute(query,
            DbConnection.pushLimitsArguments([
                {
                    type : DbConnection.resourceNoEscape,
                    value: db_notifications.graphUri
                },
                {
                    type : DbConnection.resourceNoEscape,
                    value: notificationUri
                },
                {
                    type: DbConnection.resourceNoEscape,
                    value: userUri
                }
            ]),
            function(err, notification) {
                if(!err)
                {
                    res.json(notification);
                }
                else
                {
                    var errorMsg = "Error getting info from a User's notification";
                    res.status(500).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
            });
    }
    else
    {
        var errorMsg = "Invalid user and notification Uri";
        res.status(500).json({
            result: "Error",
            message: errorMsg
        });
    }
};

//Deletes a user's notification
exports.delete = function (req, res) {
    var userUri = req.user.uri;
    var notificationUri = req.query.notificationUri;
    
    if(userUri && notificationUri)
    {
        var query =
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
                    type : DbConnection.resourceNoEscape,
                    value: db_notifications.graphUri
                },
                {
                    type : DbConnection.resourceNoEscape,
                    value: notificationUri
                },
                {
                    type: DbConnection.resourceNoEscape,
                    value: userUri
                }
            ]),
            function(err, result) {
                if(!err)
                {
                    res.json({
                        result : "OK",
                        message : "Notification successfully deleted"
                    });
                }
                else
                {
                    var errorMsg = "Error deleting a User's notification";
                    res.status(500).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
            });
    }
    else
    {
        var errorMsg = "Invalid user and notification Uri";
        res.status(500).json({
            result: "Error",
            message: errorMsg
        });
    }
};


