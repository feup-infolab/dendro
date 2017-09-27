const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const expect = chai.expect;
const _ = require("underscore");
const md5 = require("md5");
const fs = require("fs");
const path = require("path");
const async = require("async");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const versionUtils = require(Pathfinder.absPathInTestsFolder("utils/versions/versionUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));
const txtMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/txtMockFile.js"));
let manualPostMockData = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("mockdata/social/manualPostMock.js"));
const shareMock = require(Pathfinder.absPathInTestsFolder("mockdata/social/shareMock"));

const createSocialDendroTimelineWithPostsAndSharesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

const pageNumber = 1;
let demouser1PostURIsArray;

let folderName = "TestFolderFor_post_uri";
let folderPathInProject = "";
let folderMetadata = [{
    prefix: "dcterms",
    shortName: "abstract",
    value: "This is a test folder and its search tag is pastinha linda. It is a fantastic test of search for specific metadata."
}];
let fileMetadata = [{
    prefix: "dcterms",
    shortName: "abstract",
    value: "This is a test file and its search tag is test file lindo. It is a fantastic test of search for specific metadata."
}];
let publicProjectUri;
let shareUriOfAManualPost;

let notificationsDemouser1;
let notificationsDemouser2;
let notificationsDemouser3;

describe("Get all notifications URIs for a user tests", function () {
    before(function (done) {
        this.timeout(60000);
        //creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] Get all notifications URIs for a user /notifications/all", function () {

        it("[For an unauthenticated user] Should give an unauthorized error", function (done) {
            //Force logout
            const app = global.tests.app;
            agent = chai.request.agent(app);
            socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res) {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                done();
            });
        });

        it("[For demouser1, as the creator of all projects] Should give x number of notifications URIs for demouser1", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    notificationsDemouser1 = res.body;
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give y number of notifications URIs for demouser2(because demouser1 and demouser2 created different posts)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    notificationsDemouser2 = res.body;
                    notificationsDemouser2.length.should.equal(0);
                    expect(_.intersection(notificationsDemouser2, notificationsDemouser1)).to.be.empty;
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give zero number of notifications URIs for demouser3(because demouser3 is not a collaborator or creator of any projects, therefore also has no posts)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    notificationsDemouser3 = res.body;
                    notificationsDemouser3.length.should.equal(0);
                    expect(_.intersection(notificationsDemouser3, notificationsDemouser1)).to.be.empty;
                    done();
                });
            });
        });
    });

    after(function (done) {
        //destroy graphs
        this.timeout(Config.testsTimeout);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });

});