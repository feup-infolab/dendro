var chai = require("chai");
var chaiHttp = require("chai-http");
const should = chai.should();
var _ = require("underscore");
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
var createAvatarsForUsersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/users/createAvatarsForUsers.Unit.js"));
const md5 = require("md5");

describe("[GET] /user/demouser2/avatar", function (done) {

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

    it("[HTML] should give an unauthorized error if the current user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.getAvatar(false, demouser2.username, agent, function (err, res) {
            res.should.have.status(200);
            //because the body in the utils(for test purposes in turned into a array)
            res.body.toString().should.contain("Please log into the system.");
            done();
        });
    });

    it("[HTML] should give a not found error if the avatar is from a user that does not exist and if the current user is authenticated", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getAvatar(false, "notFoundUser", agent, function (err, res) {
                res.should.have.status(404);
                done();
            });
        });
    });

    it("[HTML] Should give the avatar of demouser1 even if the user is authenticated as demouser2", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
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

    it("[HTML] Should give the avatar of demouser3 even if the user is authenticated as demouser2", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
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


    it("[HTML] Should give the avatar of demouser2 if the user is authenticated as demouser2", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
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

    after(function (done) {
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });

});
