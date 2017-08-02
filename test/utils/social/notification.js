const chai = require("chai");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);

const getUserNotifications = function (jsonOnly, agent, cb) {
    const path = "/notifications/all";
    if (jsonOnly) {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getNotificationContent = function (jsonOnly, agent, notificationUri, cb) {
    const path = "/notifications/notification";
    if (jsonOnly) {
        agent
            .get(path)
            .query({notificationUri: notificationUri})
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({notificationUri: notificationUri})
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
