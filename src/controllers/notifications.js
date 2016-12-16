var Notification = require('../models/notifications/notification.js').Notification;
var DbConnection = require("../kb/db.js").DbConnection;
var _ = require('underscore');

var async = require('async');
var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notification = function () { return GLOBAL.db.notification;}();

var app = require('../app');

//Get user notifications for a specific user, ordered by date
exports.get_unread_user_notifications = function (req ,res) {

    /*
    WITH <http://127.0.0.1:3001/notification_dendro>
    SELECT ?uri
        WHERE {
        ?uri rdf:type ddr:Notification.
            ?uri ddr:resourceAuthorUri <http://127.0.0.1:3001/user/demouser1>.
        ?uri dcterms:modified ?date.
            ?uri foaf:status "unread"
    }
    ORDER BY DESC(?date)*/

    var userUri = req.session.user.uri;

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
                    value: db_notification.graphUri
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
    var userUri = req.session.user.uri;
    var notificationUri = req.query.notificationUri;
    //var notificationUri = req.body["notificationUri"];

    if(userUri && notificationUri)
    {
        /*
        WITH <http://127.0.0.1:3001/notification_dendro>
        SELECT ?p ?v
            WHERE {
        <http://127.0.0.1:3001/notifications/ca772147-9b4f-48af-bfbe-6b4800825ecb> ?p ?v.
    <http://127.0.0.1:3001/notifications/ca772147-9b4f-48af-bfbe-6b4800825ecb> ddr:resourceAuthorUri <http://127.0.0.1:3001/user/demouser1>.
        }*/

        /*
         WITH <http://127.0.0.1:3001/notification_dendro>
         SELECT ?actionType ?userWhoActed ?resourceTargetUri
         WHERE {
         <http://127.0.0.1:3001/notifications/26e4342e-7e45-467a-acde-5b71c816b179> ddr:actionType ?actionType.
         <http://127.0.0.1:3001/notifications/26e4342e-7e45-467a-acde-5b71c816b179> ddr:userWhoActed ?userWhoActed.
         <http://127.0.0.1:3001/notifications/26e4342e-7e45-467a-acde-5b71c816b179> ddr:resourceTargetUri ?resourceTargetUri.
         <http://127.0.0.1:3001/notifications/26e4342e-7e45-467a-acde-5b71c816b179> ddr:resourceAuthorUri <http://127.0.0.1:3001/user/demouser1>.
         }
         */


        var query =
            "WITH [0] \n" +
            "SELECT ?actionType ?userWhoActed ?resourceTargetUri \n" +
            "WHERE { \n" +
            "[1] ddr:actionType ?actionType. \n" +
            "[1] ddr:userWhoActed ?userWhoActed. \n" +
            "[1] ddr:resourceTargetUri ?resourceTargetUri. \n" +
            "[1] ddr:resourceAuthorUri [2]. \n"+
            "} \n";

        query = DbConnection.addLimitsClauses(query, null, null);

        db.connection.execute(query,
            DbConnection.pushLimitsArguments([
                {
                    type : DbConnection.resourceNoEscape,
                    value: db_notification.graphUri
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
    var userUri = req.session.user.uri;
    var notificationUri = req.query.notificationUri;

    /*
    WITH <http://127.0.0.1:3001/notification_dendro>
    DELETE {<http://127.0.0.1:3001/notifications/aed49895-cc2f-40f6-80c3-5e56983d514c> ?p ?v}
        WHERE {
    <http://127.0.0.1:3001/notifications/aed49895-cc2f-40f6-80c3-5e56983d514c> ?p ?v.
            <http://127.0.0.1:3001/notifications/aed49895-cc2f-40f6-80c3-5e56983d514c> ddr:resourceAuthorUri <http://127.0.0.1:3001/user/demouser1>.
            }*/
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
                    value: db_notification.graphUri
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


