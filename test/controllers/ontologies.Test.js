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

    it('[JSON] it should return public ontologies logged in as demouser1.username', function (done) {
        done(1);
    });
    it('[HTML] it should return public ontologies logged in as demouser1.username', function (done) {
        done(1);
    });
    it('[JSON] it should return public ontologies logged in as demouser2.username', function (done) {
        done(1);
    });
    it('[HTML] it should return public ontologies logged in as demouser2.username', function (done) {
        done(1);
    });
    it('[JSON] it should return public ontologies logged in as demouser3.username', function (done) {
        done(1);
    });
    it('[HTML] it should return public ontologies logged in as demouser3.username', function (done) {
        done(1);
    });

    it('[JSON] it should return public ontologies not logged in', function (done) {
        done(1);
    });
    it('[HTML] it should return public ontologies not logged in', function (done) {
        done(1);
    });

});


describe('/ontologies/all', function () {

    it('[JSON] it should return all ontologies logged in as demouser1.username', function (done) {
        done(1);
    });
    it('[HTML] it should return all ontologies logged in as demouser1.username', function (done) {
        done(1);
    });
    it('[JSON] it should return all ontologies logged in as demouser2.username', function (done) {
        done(1);
    });
    it('[HTML] it should return all ontologies logged in as demouser2.username', function (done) {
        done(1);
    });
    it('[JSON] it should return all ontologies logged in as demouser3.username', function (done) {
        done(1);
    });
    it('[HTML] it should return all ontologies logged in as demouser3.username', function (done) {
        done(1);
    });

    it('[JSON] it should return all ontologies not logged in', function (done) {
        done(1);
    });
    it('[HTML] it should return all ontologies not logged in', function (done) {
        done(1);
    });
});

describe('/ontologies/edit', function () {
    //Not sure who is allowed to edit or not in this section I must review the users
    it('[JSON] should allow for the editing of the ontology by demouser1.username', function (done) {
        done(1);
    });

    it('[JSON] should NOT allow for the editing of the ontology by demouser1.username', function (done) {
        done(1);
    });
});


describe('/ontologies/autocomplete', function(){

    it('[JSON] search while not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        var query = '?ontology_autocomplete=title';
        ontologiesUtils.autocomplete(agent, query, function(err, res){
            res.should.have.status(200);
            res.text.should.contain("error_messages");
            done();
        });
    });


    it('[JSON] did not send query', function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            ontologiesUtils.autocomplete(agent, "", function(err, res){
                res.should.have.status(400);
                res.body.error_messages[0].should.contain('You did not send the autocomplete query. The request should be something like /ontologies/autocomplete?query=dummy_query_string.');
                done();
            });
        });
    });

    it('[JSON] got \'Abstract\' from \'Abstr\'', function (done) {
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

    it('[JSON] operating without being logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        ontologiesUtils.showPrefix(agent, 'dcterms', function(err, res){
            res.should.have.status(200);
            res.text.should.contain("error_messages");
            done();
        });
    });

    it('[HTML] unable to retrieve ontology', function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            var prefix = 'daaaaaaaaadr';
            ontologiesUtils.showPrefix(agent, prefix, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Unable to retrieve ontology with prefix ' + prefix);
                done();
            });
        });
    });

    it('[HTML] get ontology', function (done) {
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