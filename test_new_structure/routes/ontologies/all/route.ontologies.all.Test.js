var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const ontologiesUtils = require(Config.absPathInTestsFolder("utils/ontologies/ontologiesUtils.js"));


const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
var addBootUpUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/bootup.Unit.js"));


describe('/ontologies/all', function () {

    const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
    const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
    const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

    before(function (done) {
        this.timeout(60000);
        addBootUpUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    it('[JSON] should return all ontologies logged in as demouser1.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            ontologiesUtils.allDisplay(true, agent, function(err, res){
                res.body[0].prefix.should.contain('dcterms');
                res.body[3].prefix.should.contain('rdf');
                res.should.have.status(200);
                done();
            });
        });
    });
    it('[HTML] should return all ontologies logged in as demouser1.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            ontologiesUtils.allDisplay(false, agent, function(err, res){
                res.text.should.contain('All Descriptor Sets'); //Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });
    it('[JSON] should return all ontologies logged in as demouser2.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            ontologiesUtils.allDisplay(true, agent, function(err, res){
                res.body[0].prefix.should.contain('dcterms');
                res.body[3].prefix.should.contain('rdf');
                res.should.have.status(200);
                done();
            });
        });
    });
    it('[HTML] should return all ontologies logged in as demouser2.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            ontologiesUtils.allDisplay(false, agent, function(err, res){
                res.text.should.contain('All Descriptor Sets'); //Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });
    it('[JSON] should return all ontologies logged in as demouser3.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            ontologiesUtils.allDisplay(true, agent, function(err, res){
                res.body[0].prefix.should.contain('dcterms');
                res.body[3].prefix.should.contain('rdf');
                res.should.have.status(200);
                done();
            });
        });
    });
    it('[HTML] should return all ontologies logged in as demouser3.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            ontologiesUtils.allDisplay(false, agent, function(err, res){
                res.text.should.contain('All Descriptor Sets'); //Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });

    it('[JSON] should return all ontologies not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        ontologiesUtils.allDisplay(true, agent, function(err, res){
            res.body[0].prefix.should.contain('dcterms');
            res.body[3].prefix.should.contain('rdf');
            res.should.have.status(200);
            done();
        });
    });
    it('[HTML] should return all ontologies not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        ontologiesUtils.allDisplay(false, agent, function(err, res){
            res.text.should.contain('All Descriptor Sets'); //Temporary test since page is not functional yet
            res.should.have.status(200);
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


