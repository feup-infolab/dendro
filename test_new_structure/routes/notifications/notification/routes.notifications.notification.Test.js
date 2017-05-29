var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Config.absPathInTestsFolder("utils/item/itemUtils.js"));
const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const repositoryUtils = require(Config.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
const notificationUtils = require(Config.absPathInTestsFolder("utils/social/notification.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const invalidProject = require(Config.absPathInTestsFolder("mockdata/projects/invalidProject.js"));
const shareMockup = require(Config.absPathInTestsFolder("mockdata/social/share.js"));

var createNotificationsUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/social/createNotifications.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
let notificationUri;

describe("Social Dendro, notification info and delete tests", function () {
    before(function (done) {
        this.timeout(60000);
        createNotificationsUnit.setup(function (err, results) {
            should.equal(err, null);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                notificationUtils.getUserNotifications(true, agent, function (err, res) {
                    res.body.length.should.equal(3);
                    notificationUri = res.body[0].uri;
                    done();
                });
            });
        });
    });

    describe("[GET] /notifications/notification", function () {

        //API ONLY
        it("Should give an error if the request type for this route is of type HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                notificationUtils.getNotificationContent(false, agent, notificationUri, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should give an error if the user is not authenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            notificationUtils.getNotificationContent(true, agent, notificationUri, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error if the current authenticated user is the demouser2 and tries to access a notification for demouser1", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                notificationUtils.getNotificationContent(true, agent, notificationUri, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give an error if the current authenticated user is the demouser3 and tries to access a notification for demouser1", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                notificationUtils.getNotificationContent(true, agent, notificationUri, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give an error if the notification does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                notificationUtils.getNotificationContent(true, agent, notificationUri + "invalid", function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should return the notification if the authenticated user is the demouser1 and the notification is intended for the demouser1", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                notificationUtils.getNotificationContent(true, agent, notificationUri, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(1);
                    res.body[0].should.have.property('actionType');
                    res.body[0].should.have.property('modified');
                    res.body[0].should.have.property('resourceTargetUri');
                    res.body[0].should.have.property('userWhoActed');
                    done();
                });
            });
        })
    });

    describe("[DELETE] /notifications/notification", function () {

        it("Should give an error if the request type for this route is of type HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                notificationUtils.deleteNotification(false, agent, notificationUri, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should give an error if the user is not authenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            notificationUtils.deleteNotification(true, agent, notificationUri, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error if the current authenticated user is the demouser2 and tries to delete a notification for demouser1", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                notificationUtils.deleteNotification(true, agent, notificationUri, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give an error if the current authenticated user is the demouser3 and tries to delete a notification for demouser1", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                notificationUtils.deleteNotification(true, agent, notificationUri, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give an error if the notification does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                notificationUtils.deleteNotification(true, agent, notificationUri + "invalid", function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should delete the notification if the authenticated user is the demouser1 and the notification is intended for the demouser1", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                notificationUtils.deleteNotification(true, agent, notificationUri, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        })
    });

    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});
