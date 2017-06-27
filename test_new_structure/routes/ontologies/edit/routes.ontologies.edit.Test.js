var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const ontologiesUtils = require(Config.absPathInTestsFolder("utils/ontologies/ontologiesUtils.js"));


const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
var userCreateUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/users/createUsers.Unit.js"));

describe('/ontologies/edit', function () {

    const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));

    const description = "Social and Behavioural Studies... Methodology, Sample procedure, Kind of data...";
    const domain = "Social and Behavioural Science";
    const prefix = "social";

    before(function (done) {
        this.timeout(60000);
        userCreateUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });


    it('[POST] should allow for the editing of the ontology by admin', function (done) {
        this.timeout(200000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser('admin', 'adminteste123', function (err, agent) {
            ontologiesUtils.editOntologies(agent, description, domain, prefix, function(err, res){
                res.should.have.status(200);
                res.body.result.should.contain("ok");
                done();
            });
        });
    });

    it('[POST] should NOT allow for the editing of ontologies by a NOT logged in user', function (done) {
        this.timeout(200000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        ontologiesUtils.editOntologies(agent, description, domain, prefix, function(err, res){
            //TODO Status code is incorrect, responds with html
            res.should.have.status(401);
            res.redirects[0].should.contain("login");
            done();
        });
    });

    it('[POST] should NOT allow for the editing of ontologies by user who is NOT admin', function (done) {
        this.timeout(200000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            ontologiesUtils.editOntologies(agent, description, domain, prefix, function(err, res){
                //TODO Status code is incorrect, responds with html
                res.should.have.status(401);
                done();
            });
        });
    });
    //NOT functional yet
    /*
     it('[POST] should fail at editing ontologies because of wrong parameters', function (done) {
     this.timeout(200000);
     var app = GLOBAL.tests.app;
     var agent = chai.request.agent(app);
     userUtils.loginUser('admin', 'adminteste123', function (err, agent) {
     ontologiesUtils.editOntologies(agent, description, domain, prefix, function(err, res){
     //TODO Status code is incorrect, responds with html
     res.should.have.status(400);
     done();
     });
     });
     });*/

    after(function (done) {
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });

});




