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
let demouser1ShareURI;

describe("Social Dendro, get user notifications tests", function () {
    before(function (done) {
        this.timeout(60000);
        createNotificationsUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

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
                    res.body.length.should.equal(3);
                    done();
                });
            });
        });

        it("Should give zero notifications for demouser2(as we had no likes/comments/shares to his work)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                notificationUtils.getUserNotifications(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);//TODO Check if the notifications are for this user(check the target)
                    res.body.length.should.equal(0);
                    done();
                });
            });
        });

        it("Should give zero notifications for demouser3(as we had no likes/comments/shares to his work)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                notificationUtils.getUserNotifications(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);//TODO Check if the notifications are for this user(check the target)
                    res.body.length.should.equal(0);
                    done();
                });
            });
        });
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