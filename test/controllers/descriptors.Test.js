process.env.NODE_ENV = 'test';

var chai = require('chai');
chai.use(require('chai-http'));

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var async = require('async');
var projectUtils = require('./../utils/project/projectUtils.js');
var userUtils = require('./../utils/user/userUtils.js');
var folderUtils = require('./../utils/folder/folderUtils.js');
var httpUtils = require('./../utils/http/httpUtils.js');

var should = chai.should();

var demouser1 = require("../mockdata/users/demouser1");
var demouser2 = require("../mockdata/users/demouser2");
var demouser3 = require("../mockdata/users/demouser3");

describe("/descriptors/from_ontology/:ontology_prefix", function () {

    //TODO Exemplo of a request to this route
    /*
     var requestUri = "/descriptors/from_ontology/"+ontologyPrefix;
     var projectHandle = Utils.getCurrentProjectHandle();

     return $http({
     method: 'GET',
     params : {
     project_handle : projectHandle
     },
     url: requestUri,´
     responseType: 'json'
     }).then(function(response) {
     return response.data.descriptors;
     }
     ).catch(function(error){
     throw "Error fetching ontologies from ontology " + ontologyPrefix + " : " + JSON.stringify(error);
     });
     */

    //TODO A use case -> http://127.0.0.1:3001/descriptors/from_ontology/dcterms?project_handle=proj1
    it("Get descriptors from dcterms ontology logged in as demouser1(The creator of the project in question)", function (done) {
        //TODO should return all the descriptors from this ontology -> currently 52 elements
        done(1);
    });

    it("Get descriptors from dcterms ontology logged in as demouser2(Not creator or collaborator of the project in question)", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("Get descriptors from dcterms ontology logged in as demouser3(Collaborator of the project in question)", function (done) {
        //TODO Should return the descriptors
        done(1);
    });

    it("Get descriptors from dcterms ontology (unauthenticated)", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("Get descriptors from xy ontology(This ontology does not exist) logged in as demouser1(The creator of the project in question)", function (done) {
        //TODO Should return error
        done(1);
    });

    it("Get descriptors from xy ontology(This ontology does not exist) logged in as demouser3(Collaborator of the project in question)", function (done) {
        //TODO Should return error
        done(1);
    });

    it("Get descriptors from xy ontology(This ontology does not exist) (unauthenticated)", function (done) {
        //TODO Should return error
        done();
    });
});
