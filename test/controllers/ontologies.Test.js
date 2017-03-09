process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

var userUtils = require('./../utils/user/userUtils.js');
var ontologiesUtils = require('./../utils/ontologies/ontologiesUtils.js');

const should = chai.should();

var demouser1 = require("../mockdata/users/demouser1");

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
    it('[HTML] unable to retrieve ontology', function () {

    });

    it('[HTML] get ontology', function () {

    });
})