var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const falseUser = 'demouser404';

const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
var addBootUpUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/bootup.Unit.js"));

describe("/user/demouser2", function (done) {

    before(function (done) {
        this.timeout(60000);
        addBootUpUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    it('[JSON] should NOT access demouser2.username profile when given demouser2.username and NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getUserInfo(demouser2.username, true, agent, function(err, res){
            res.should.have.status(401);
            res.text.should.contain('You are not logged into the system.');
            done();
        })
    });

    it('[HTML] should NOT access demouser2.username profile when given demouser2.username and  NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getUserInfo(demouser2.username, false, agent, function(err, res){
            res.should.have.status(200);
            res.redirects[0].should.contain('/login');
            res.text.should.contain('Please log into the system');
            done();
        })
    });
    //review agent immediatly
    it('[JSON] should access demouser2.username profile when given demouser2.username and logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getUserInfo(demouser2.username, true, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('\"username\":\"demouser2\"');
                done();
            })
        })
    });

    it('[HTML] should access demouser2.username profile when given demouser2.username and logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getUserInfo(demouser2.username, false, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Viewing user demouser2');
                done();
            })
        })
    });


    it('[JSON] should NOT access demouser2.username profile when given non-existent username and logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getUserInfo(falseUser, true, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser404 does not exist');
                done();
            })
        })
    });

    it('[HTML] should NOT access demouser2.username profile when given non-existent username and logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getUserInfo(falseUser, false, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser404 does not exist');
                done();
            })
        })
    });

    it('[JSON] should NOT access demouser2.username profile when given non-existent username and NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getUserInfo(falseUser, true, agent, function(err, res){
            res.should.have.status(401);
            res.text.should.contain('You are not logged into the system');
            done();
        })
    });

    it('[HTML] should NOT access demouser2.username profile when given non-existent username and NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getUserInfo(falseUser, false, agent, function(err, res){
            res.should.have.status(200);
            res.text.should.contain('Please log into the system');
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