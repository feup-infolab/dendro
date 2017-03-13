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
var descriptorUtils = require("../utils/descriptor/descriptorUtils");

var should = chai.should();

var demouser1 = require("../mockdata/users/demouser1");
var demouser2 = require("../mockdata/users/demouser2");
var demouser3 = require("../mockdata/users/demouser3");

var publicProject = require("../mockdata/projects/public_project");
var metadataOnlyProject = require("../mockdata/projects/metadata_only_project");
var privateProject = require("../mockdata/projects/private_project");

describe("[GET] /descriptors/from_ontology/:ontology_prefix", function () {

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
    //PUBLIC PROJECT
    it("[Public Project] It should get descriptors from dcterms ontology when logged in as demouser1(The creator of the project in question)", function (done) {
        //TODO should return all the descriptors from this ontology -> currently 52 elements
        let ontologyPrefix = "dcterms";
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, publicProject.handle, function (err, res) {
                res.should.have.status(200);
                res.body.descriptors.length.should.equal(52);
                done();
            });
        });
    });

    it("[Public Project] It should not get descriptors from dcterms ontology when logged in as demouser2(Not creator nor collaborator of the project in question)", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[Public Project] It should get descriptors from dcterms ontology when logged in as demouser3(Collaborator of the project in question)", function (done) {
        //TODO Should return the descriptors
        done(1);
    });

    it("[Public Project] It should not get descriptors from dcterms ontology (when unauthenticated)", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[Public Project] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser1(The creator of the project in question)", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[Public Project] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser3(Collaborator of the project in question)", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[Public Project] It should not get descriptors from xy ontology(This ontology does not exist) (when unauthenticated)", function (done) {
        //TODO Should return error
        done(1);
    });

    //METADATA_ONLY PROJECT
    it("[Metadata_Only Project] It should get descriptors from dcterms ontology when logged in as demouser1(The creator of the project in question)", function (done) {
        //TODO should return all the descriptors from this ontology -> currently 52 elements
        done(1);
    });

    it("[Metadata_Only Project] It should not get descriptors from dcterms ontology when logged in as demouser2(Not creator nor collaborator of the project in question)", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[Metadata_Only Project] It should get descriptors from dcterms ontology when logged in as demouser3(Collaborator of the project in question)", function (done) {
        //TODO Should return the descriptors
        done(1);
    });

    it("[Metadata_Only Project] It should not get descriptors from dcterms ontology (when unauthenticated)", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[Metadata_Only Project] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser1(The creator of the project in question)", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[Metadata_Only Project] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser3(Collaborator of the project in question)", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[Metadata_Only Project] It should not get descriptors from xy ontology(This ontology does not exist) (when unauthenticated)", function (done) {
        //TODO Should return error
        done(1);
    });

    //PRIVATE PROJECT
    it("[Private Project] It should get descriptors from dcterms ontology when logged in as demouser1(The creator of the project in question)", function (done) {
        //TODO should return all the descriptors from this ontology -> currently 52 elements
        done(1);
    });

    it("[Private Project] It should not get descriptors from dcterms ontology when logged in as demouser2(Not creator nor collaborator of the project in question)", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[Private Project] It should get descriptors from dcterms ontology when logged in as demouser3(Collaborator of the project in question)", function (done) {
        //TODO Should return the descriptors
        done(1);
    });

    it("[Private Project] It should not get descriptors from dcterms ontology (when unauthenticated)", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[Private Project] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser1(The creator of the project in question)", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[Private Project] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser3(Collaborator of the project in question)", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[Private Project] It should not get descriptors from xy ontology(This ontology does not exist) (when unauthenticated)", function (done) {
        //TODO Should return error
        done(1);
    });
    
    
    it("Should Give an error when the project identified by the project_handle does not exist", function (done) {
        done(1);
    });


});
