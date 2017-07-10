var chai = require("chai");
var chaiHttp = require("chai-http");
const should = chai.should();
var _ = require("underscore");
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
//var createUserUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/users/createUsers.Unit.js"));
var createAvatarsForUsersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/users/createAvatarsForUsers.Unit.js"));
const md5 = require("md5");

describe("[GET] /user/demouser1/avatar", function (done) {

    before(function (done) {
        this.timeout(60000);
        createAvatarsForUsersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
    const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
    const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

    let defaultAvatarForNewUsers = "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";

    it("[HTML] should give an unauthorized error if the current user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.getAvatar(false, demouser1.username, agent, function (err, res) {
            res.should.have.status(200);
            //because the body in the utils(for test purposes in turned into a array)
            res.body.toString().should.contain("Please log into the system.");
            done();
        });
    });

    it("[HTML] should give a not found error if the avatar is from a user that does not exist and if the current user is authenticated", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getAvatar(false, "notFoundUser", agent, function (err, res) {
                res.should.have.status(404);
                done();
            });
        });
    });

    it("[HTML] Should give the avatar of demouser2 even if the user is authenticated as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getAvatar(false, demouser2.username, agent, function (err, res) {
                res.should.have.status(200);
                let imageFromServerDemouser2 = res.body.toString('base64');
                let imageFromServerDemouser2MD5 = md5(imageFromServerDemouser2);
                let defaultAvatarForDemouser2MD5 = md5(demouser2.avatar.new_avatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser1MD5 = md5(demouser1.avatar.new_avatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser3MD5 = md5(demouser3.avatar.new_avatar.replace(/^data:image\/png;base64,/, ""));
                imageFromServerDemouser2MD5.should.equal(defaultAvatarForDemouser2MD5);
                imageFromServerDemouser2MD5.should.not.equal(defaultAvatarForDemouser1MD5);
                imageFromServerDemouser2MD5.should.not.equal(defaultAvatarForDemouser3MD5);
                done();
            });
        });
    });

    it("[HTML] Should give the avatar of demouser3 even if the user is authenticated as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getAvatar(false, demouser3.username, agent, function (err, res) {
                res.should.have.status(200);
                let imageFromServerDemouser3 = res.body.toString('base64');
                let imageFromServerDemouser3MD5 = md5(imageFromServerDemouser3);
                let defaultAvatarForDemouser2MD5 = md5(demouser2.avatar.new_avatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser1MD5 = md5(demouser1.avatar.new_avatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser3MD5 = md5(demouser3.avatar.new_avatar.replace(/^data:image\/png;base64,/, ""));
                imageFromServerDemouser3MD5.should.equal(defaultAvatarForDemouser3MD5);
                imageFromServerDemouser3MD5.should.not.equal(defaultAvatarForDemouser1MD5);
                imageFromServerDemouser3MD5.should.not.equal(defaultAvatarForDemouser2MD5);
                done();
            });
        });
    });


    it("[HTML] Should give the avatar of demouser1 if the user is authenticated as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getAvatar(false, demouser1.username, agent, function (err, res) {
                res.should.have.status(200);
                let imageFromServerDemouser1 = res.body.toString('base64');
                let imageFromServerDemouser1MD5 = md5(imageFromServerDemouser1);
                let defaultAvatarForDemouser2MD5 = md5(demouser2.avatar.new_avatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser1MD5 = md5(demouser1.avatar.new_avatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser3MD5 = md5(demouser3.avatar.new_avatar.replace(/^data:image\/png;base64,/, ""));
                imageFromServerDemouser1MD5.should.equal(defaultAvatarForDemouser1MD5);
                imageFromServerDemouser1MD5.should.not.equal(defaultAvatarForDemouser2MD5);
                imageFromServerDemouser1MD5.should.not.equal(defaultAvatarForDemouser3MD5);
                done();
            });
        });
    });

    after(function (done) {
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });

});
