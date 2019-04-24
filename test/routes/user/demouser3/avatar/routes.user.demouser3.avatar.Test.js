var chai = require("chai");
var chaiHttp = require("chai-http");
const should = chai.should();
var _ = require("underscore");
chai.use(chaiHttp);

let path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");

const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
var createAvatarsForUsersUnit = rlequire("dendro", "test/units/users/createAvatarsForUsers.Unit.js");
const md5 = require("md5");

describe("[GET] /user/demouser3?avatar", function (done)
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createAvatarsForUsersUnit.init(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
    const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
    const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

    it("[HTML] should provide the avatar even if the current user is not authenticated", function (done)
    {
        var app = global.tests.app;
        var agent = chai.request.agent(app);

        userUtils.getAvatar(false, demouser3.username, agent, function (err, res)
        {
            res.should.have.status(200);
            let imageFromServerDemouser3 = res.body.toString("base64");
            let imageFromServerDemouser3MD5 = md5(imageFromServerDemouser3);
            let defaultAvatarForDemouser3MD5 = md5(demouser3.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
            imageFromServerDemouser3MD5.should.equal(defaultAvatarForDemouser3MD5);
            done();
        });
    });

    it("[HTML] should give a not found error if the avatar is from a user that does not exist and if the current user is authenticated", function (done)
    {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
        {
            userUtils.getAvatar(false, "notFoundUser", agent, function (err, res)
            {
                res.should.have.status(404);
                done();
            });
        });
    });

    it("[HTML] Should give the avatar of demouser2 even if the user is authenticated as demouser3", function (done)
    {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
        {
            userUtils.getAvatar(false, demouser2.username, agent, function (err, res)
            {
                res.should.have.status(200);
                let imageFromServerDemouser2 = res.body.toString("base64");
                let imageFromServerDemouser2MD5 = md5(imageFromServerDemouser2);
                let defaultAvatarForDemouser2MD5 = md5(demouser2.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser1MD5 = md5(demouser1.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser3MD5 = md5(demouser3.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
                imageFromServerDemouser2MD5.should.equal(defaultAvatarForDemouser2MD5);
                imageFromServerDemouser2MD5.should.not.equal(defaultAvatarForDemouser1MD5);
                imageFromServerDemouser2MD5.should.not.equal(defaultAvatarForDemouser3MD5);
                done();
            });
        });
    });

    it("[HTML] Should give the avatar of demouser3 if the user is authenticated as demouser3", function (done)
    {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
        {
            userUtils.getAvatar(false, demouser3.username, agent, function (err, res)
            {
                res.should.have.status(200);
                let imageFromServerDemouser3 = res.body.toString("base64");
                let imageFromServerDemouser3MD5 = md5(imageFromServerDemouser3);
                let defaultAvatarForDemouser2MD5 = md5(demouser2.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser1MD5 = md5(demouser1.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser3MD5 = md5(demouser3.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
                imageFromServerDemouser3MD5.should.equal(defaultAvatarForDemouser3MD5);
                imageFromServerDemouser3MD5.should.not.equal(defaultAvatarForDemouser1MD5);
                imageFromServerDemouser3MD5.should.not.equal(defaultAvatarForDemouser2MD5);
                done();
            });
        });
    });

    it("[HTML] Should give the avatar of demouser1 even if the user is authenticated as demouser3", function (done)
    {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
        {
            userUtils.getAvatar(false, demouser1.username, agent, function (err, res)
            {
                res.should.have.status(200);
                let imageFromServerDemouser1 = res.body.toString("base64");
                let imageFromServerDemouser1MD5 = md5(imageFromServerDemouser1);
                let defaultAvatarForDemouser2MD5 = md5(demouser2.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser1MD5 = md5(demouser1.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
                let defaultAvatarForDemouser3MD5 = md5(demouser3.avatar.newAvatar.replace(/^data:image\/png;base64,/, ""));
                imageFromServerDemouser1MD5.should.equal(defaultAvatarForDemouser1MD5);
                imageFromServerDemouser1MD5.should.not.equal(defaultAvatarForDemouser2MD5);
                imageFromServerDemouser1MD5.should.not.equal(defaultAvatarForDemouser3MD5);
                done();
            });
        });
    });

    after(function (done)
    {
        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done();
        });
    });
});
