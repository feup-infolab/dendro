var chai = require("chai");
var chaiHttp = require("chai-http");
const should = chai.should();
var _ = require("underscore");
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
var createUserUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/users/createUsers.Unit.js"));
//TODO var createAvatarsForUsersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/users/createAvatarsForUsers.Unit.js"));

describe("[GET] /user/demouser1/avatar", function (done) {

    before(function (done) {
        this.timeout(60000);
        createUserUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    it("[HTML] should give an unauthorized error if the current user is not authenticated", function (done) {

    });

    it("[HTML] should give a not found error if the avatar is from a user that does not exist and if the current user is authenticated", function (done) {

    });

    it("[HTML] Should give the avatar of demouser2 if the user is authenticated", function (done) {

    });

    after(function (done) {
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });

});
