const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Config = global.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
const createUserUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/users/createUsers.Unit.js"));

describe("/user/demouser1", function (done) {

    const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
    const falseUser = "demouser404";

    before(function (done) {
        this.timeout(60000);
        createUserUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    it("[JSON] should NOT access demouser1.username profile when given demouser1.username and NOT logged in",function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getUserInfo(demouser1.username, true, agent, function(err, res){
            res.should.have.status(401);
            res.text.should.contain("You are not logged into the system.");
            done();
        })
    });

    it("[HTML] should NOT access demouser1.username profile when given demouser1.username and  NOT logged in",function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getUserInfo(demouser1.username, false, agent, function(err, res){
            res.should.have.status(200);
            res.redirects[0].should.contain("/login");
            res.text.should.contain("Please log into the system");
            done();
        })
    });
    //review agent immediatly
    it("[JSON] should access demouser1.username profile when given demouser1.username and logged in",function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getUserInfo(demouser1.username, true, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain("\"username\":\"demouser1\"");
                done();
            })
        })
    });

    it("[HTML] should access demouser1.username profile when given demouser1.username and logged in",function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getUserInfo(demouser1.username, false, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain("Viewing user demouser1");
                done();
            })
        })
    });


    it("[JSON] should NOT access demouser1.username profile when given non-existent username and logged in",function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getUserInfo(falseUser, true, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain("demouser404 does not exist");
                done();
            })
        })
    });

    it("[HTML] should NOT access demouser1.username profile when given non-existent username and logged in",function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getUserInfo(falseUser, false, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain("demouser404 does not exist");
                done();
            })
        })
    });

    it("[JSON] should NOT access demouser1.username profile when given non-existent username and NOT logged in",function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getUserInfo(falseUser, true, agent, function(err, res){
            res.should.have.status(401);
            res.text.should.contain("You are not logged into the system");
            done();
        })
    });

    it("[HTML] should NOT access demouser1.username profile when given non-existent username and NOT logged in",function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getUserInfo(falseUser, false, agent, function(err, res){
            res.should.have.status(200);
            res.text.should.contain("Please log into the system");
            done();
        })
    });

    it("Should not provide private information about the user via API", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getUserInfo(demouser1.username, true, agent, function(err, data)
            {
                if(data.body.ddr.password)
                    done(1);
                else
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
