var chai = require('chai');
var chaiHttp = require('chai-http');
var _ = require('underscore');
chai.use(chaiHttp);

var getUserNotifications = function (jsonOnly, agent, cb) {
    var path = "/notifications/all";
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getNotificationContent = function (jsonOnly, agent, notificationUri, cb) {
    var path = "/notifications/notification";
    if(jsonOnly)
    {
        agent
            .get(path)
            .query({notificationUri : notificationUri})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .query({notificationUri : notificationUri})
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


module.exports = {
    getUserNotifications: getUserNotifications,
    getNotificationContent: getNotificationContent
};
