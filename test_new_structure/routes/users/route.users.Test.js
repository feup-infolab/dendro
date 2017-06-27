var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));


const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
var createUserUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/users/createUsers.Unit.js"));

//to review naming before mergin to master


describe("/users", function () {

    before(function (done) {
        this.timeout(60000);
        createUserUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });

    });

        it("[HTML] should list all users when logged in as demouser1.username", function (done){
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                userUtils.listAllUsers(false, agent, function (err, res){
                    res.should.have.status(200);
                    res.text.should.contain("Demo User 1");
                    done();
                })
            })
        });

        it("[JSON]  should list all users when logged in as demouser1.username", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                userUtils.listAllUsers(true, agent, function (err, res){
                    res.should.have.status(200);
                    res.text.should.contain("demouser1");
                    done();
                })
            })
        });


        it("[HTML] should list all users when logged in as demouser2.username", function (done){
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                userUtils.listAllUsers(false, agent, function (err, res){
                    res.should.have.status(200);
                    res.text.should.contain("Demo User 1");
                    res.text.should.contain("Demo User 2");
                    res.text.should.not.contain("idontexist123");
                    done();
                })
            })
        });

        it("[JSON]  should list all users when logged in as demouser2.username", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                userUtils.listAllUsers(true, agent, function (err, res){
                    res.should.have.status(200);
                    res.text.should.contain("demouser1");
                    res.text.should.contain("demouser2");
                    res.text.should.not.contain("idontexist123");
                    done();
                })
            })
        });


        it("[HTML] should list all users when NOT logged in", function (done){
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            userUtils.listAllUsers(false, agent, function (err, res){
                res.should.have.status(200);
                res.text.should.contain("Demo User 1");
                res.text.should.contain("Demo User 2");
                res.text.should.not.contain("idontexist123");
                done();
            })
        });

        it("[JSON] should list all users when NOT logged in", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            userUtils.listAllUsers(true, agent, function (err, res){
                res.should.have.status(200);
                res.text.should.contain("demouser1");
                res.text.should.contain("demouser2");
                res.text.should.not.contain("idontexist123");
                done();
            })
        });

    after(function (done) {
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});


