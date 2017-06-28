process.env.NODE_ENV = 'test';

var chai = require('chai');
chai.use(require('chai-http'));

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var async = require('async');
var projectUtils = require('./../../utils/project/projectUtils.js');
var userUtils = require('./../../utils/user/userUtils.js');
var folderUtils = require('./../../utils/folder/folderUtils.js');
var httpUtils = require('./../../utils/http/httpUtils.js');
var notificationUtils = require("./../../utils/social/notification.js");

var should = chai.should();

var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");

describe("[GET] /notifications/all", function () {
    //API ONLY
    it("Should give an error if the request type for this route is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            notificationUtils.getUserNotifications(false, agent, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should give an error if the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        notificationUtils.getUserNotifications(true, agent, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should only give notifications related to interactions with posts created by demouser1(The current authenticated user)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            notificationUtils.getUserNotifications(true, agent, function (err, res) {
                res.statusCode.should.equal(200);//TODO Check if the notifications are for this user(check the target)
                done();
            });
        });
    });
});

describe("[GET] /notifications/notification", function () {

    //TODO test both cases (HTML and JSON - I assume it is valid to make requests on both cases)
    it("Should give an error if the user is not authenticated", function (done) {
        done(1);
    });

    it("Should give an error if the current authenticated user is not the demouser1 and tries to access a notification for the demouser1", function (done) {
        done(1);
    });

    it("Should give an error if the notification does not exist", function (done) {
        done(1);
    });

    it("Should return the notification if the authenticated user is the demouser1 and the notification is intended for the demouser1", function (done) {
        done(1);
    })
});

describe("[DELETE] /notifications/notification", function () {
    
    //TODO test both cases (HTML and JSON - I assume it is valid to make requests on both cases)
    it("Should give an error if the user is not authenticated", function (done) {
        done(1);
    });

    it("Should give an error if the current authenticated user is not the demouser1 and tries to delete a notification for the demouser1", function (done) {
        done(1);
    });

    it("Should give an error if the notification does not exist", function (done) {
        done(1);
    });

    it("Should delete the notification and send a status of ok if the authenticated user is the demouser1 and the notification is intended for the demouser1", function (done) {
        done(1);
    })
});
