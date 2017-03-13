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

    it('[JSON] search while not logged in', function () {

    });


    it('[JSON] did not send query', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            var path = '/ontologies/autocomplete';
            ontologiesUtils.autocomplete(agent, {}, function(err, res){
                res.should.have.status(400);
                res.body.message.should.equal('You did not send the autocomplete query. The request should be something like /ontologies/autocomplete?query=dummy_query_string.');
                done();
            });
        });
    });

    it('[JSON] got \'Abstract\' from \'Abstr\'', function (done) {

    });
});

describe('/ontologies/show/:prefix', function () {

    it('[JSON] opeating without being logged in«', function () {

    });

    it('[HTML] unable to retrieve ontology', function () {

    });

    it('[HTML] get ontology', function () {

    });
});