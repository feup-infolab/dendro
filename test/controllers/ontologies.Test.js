process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

var userUtils = require('./../utils/user/userUtils.js');
var ontologiesUtils = require('./../utils/ontologies/ontologiesUtils.js');

const should = chai.should();

var demouser1 = require("../mockdata/users/demouser1");
var demouser2 = require("../mockdata/users/demouser2");
var demouser3 = require("../mockdata/users/demouser3");

require("../mockdata/ontologies/ontologies");

describe('/ontologies/public', function () {

    it('[JSON] should return public ontologies logged in as demouser1.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            ontologiesUtils.publicDisplay(true, agent, function(err, res){
                res.body[0].prefix.should.contain('dcterms');
                res.body[0].prefix.should.not.contain('nie');
                res.should.have.status(200);
                done();
            });
        });
    });

    it('[HTML] should return public ontologies logged in as demouser1.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            ontologiesUtils.publicDisplay(false, agent, function(err, res){
                res.text.should.contain('Descriptor Sets PUBLIC'); //Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });
    it('[JSON] should return public ontologies logged in as demouser2.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            ontologiesUtils.publicDisplay(true, agent, function(err, res){
                res.body[0].prefix.should.contain('dcterms');
                res.body[0].prefix.should.not.contain('nie');
                res.should.have.status(200);
                done();
            });
        });
    });
    it('[HTML] should return public ontologies logged in as demouser2.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            ontologiesUtils.publicDisplay(false, agent, function(err, res){
                res.text.should.contain('Descriptor Sets PUBLIC'); //Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });

    it('[JSON] should return public ontologies logged in as demouser3.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            ontologiesUtils.publicDisplay(true, agent, function(err, res){
                res.body[0].prefix.should.contain('dcterms');
                res.body[0].prefix.should.not.contain('nie');
                res.should.have.status(200);
                done();
            });
        });
    });
    it('[HTML] should return public ontologies logged in as demouser3.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            ontologiesUtils.publicDisplay(false, agent, function(err, res){
                res.text.should.contain('Descriptor Sets PUBLIC'); //Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });


    it('[JSON] should return public ontologies not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        ontologiesUtils.publicDisplay(true, agent, function(err, res){
            res.body[0].prefix.should.contain('dcterms');
            res.body[0].prefix.should.not.contain('nie');
            res.should.have.status(200);
            done();
        });
    });

    it('[HTML] should return public ontologies not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        ontologiesUtils.publicDisplay(false, agent, function(err, res){
            res.text.should.contain('Descriptor Sets PUBLIC'); //Temporary test since page is not functional yet
            res.should.have.status(200);
            done();
        });
    });
});


describe('/ontologies/all', function () {

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
                res.text.should.contain('Descriptor Sets ALL'); //Temporary test since page is not functional yet
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
                res.text.should.contain('Descriptor Sets ALL'); //Temporary test since page is not functional yet
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
                res.text.should.contain('Descriptor Sets ALL'); //Temporary test since page is not functional yet
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
            res.text.should.contain('Descriptor Sets ALL'); //Temporary test since page is not functional yet
            res.should.have.status(200);
            done();
        });
    });
});

describe('/ontologies/edit', function () {
    //Not sure who is allowed to edit or not in this section I must review the users
    it('[JSON] should allow for the editing of the ontology by demouser1.username', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser('admin', 'adminteste123', function (err, agent) {
            ontologiesUtils.editOntologies(agent, function(err, res){
                res.should.have.status(200);
                done();
            });
        });
    });

    it('[JSON] should NOT allow for the editing of the ontology by demouser1.username', function (done) {
        done(1);
    });
});


describe('/ontologies/autocomplete', function(){

    it('[JSON] should not search while not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        var query = '?ontology_autocomplete=title';
        ontologiesUtils.autocomplete(agent, query, function(err, res){
            res.should.have.status(200);
            res.text.should.contain("error_messages");
            done();
        });
    });


    it('[JSON] should give error when not sending query', function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            ontologiesUtils.autocomplete(agent, "", function(err, res){
                res.should.have.status(400);
                res.body.error_messages[0].should.contain('You did not send the autocomplete query. The request should be something like /ontologies/autocomplete?query=dummy_query_string.');
                done();
            });
        });
    });

    it('[JSON] should return demo ontology from \'title\'', function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            var query = '?ontology_autocomplete=title';
            ontologiesUtils.autocomplete(agent, query, function(err, res){
                res.should.have.status(200);
                res.body[0].description.should.equal('Generic description. Creator, title, subject...');
                done();
            });
        });
    });
});

describe('/ontologies/show/:prefix', function () {

    it('[JSON] should fail when operating without logging in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        var prefix = 'dcterms';
        ontologiesUtils.showPrefix(agent, prefix, function(err, res){
            res.should.have.status(200);
            res.text.should.contain("error_messages");
            done();
        });
    });

    it('[HTML] should fail to retrieve ontology', function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            var prefix = 'daaaaaaaaadr';
            ontologiesUtils.showPrefix(agent, prefix, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Unable to retrieve ontology with prefix ' + prefix);
                done();
            });
        });
    });

    it('[HTML] shuold get ontology', function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            var prefix = 'ddr';
            ontologiesUtils.showPrefix(agent, prefix, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Viewing ontology ' + prefix);
                done();
            });
        });
    });
});