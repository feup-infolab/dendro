process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.use(require('chai-http'));

const db = function() { return GLOBAL.db.default; }();
const db_social = function() { return GLOBAL.db.social; }();
const db_notifications = function () { return GLOBAL.db.notifications;}();
const async = require('async');
const projectUtils = require('./../utils/project/projectUtils.js');
const userUtils = require('./../utils/user/userUtils.js');
const folderUtils = require('./../utils/folder/folderUtils.js');
const httpUtils = require('./../utils/http/httpUtils.js');
const descriptorUtils = require("../utils/descriptor/descriptorUtils");

const should = chai.should();

const demouser1 = require("../mockdata/users/demouser1");
const demouser2 = require("../mockdata/users/demouser2");
const demouser3 = require("../mockdata/users/demouser3");

const publicProject = require("../mockdata/projects/public_project");
const metadataOnlyProject = require("../mockdata/projects/metadata_only_project");
const privateProject = require("../mockdata/projects/private_project");

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
    /**
     * PUBLIC PROJECT
     */

    it("[HTML] It should give a 405 error (method not supported) if the Accept: application/json Header was not sent. User logged in as demouser1(The creator of the Public project "+publicProject.handle +")", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[JSON] It should get descriptors from dcterms ontology when logged in as demouser1(The creator of the Public project "+publicProject.handle +")", function (done) {
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

    it("[JSON] It should not get descriptors from dcterms ontology when logged in as demouser2(Not creator nor collaborator of the Public project "+publicProject.handle +")", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[JSON] It should get descriptors from dcterms ontology when logged in as demouser3 (Collaborator of the Public project "+publicProject.handle +")", function (done) {
        //TODO Should return the descriptors
        done(1);
    });

    it("[JSON] It should not get descriptors from dcterms ontology (when unauthenticated and accessing Public project "+publicProject.handle +")", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser1(The creator of the Public project "+publicProject.handle +")", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser3(Collaborator of Public project "+publicProject.handle +")", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) (when unauthenticated and accessing Public project "+publicProject.handle +")", function (done) {
        //TODO Should return error
        done(1);
    });

    /**
     * METADATA_ONLY PROJECT
     */

    it("[HTML] It should give a 405 error (method not supported) if the Accept: application/json Header was not sent. User logged in as demouser1 (The creator of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[JSON] It should get descriptors from dcterms ontology when logged in as demouser1 (The creator of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
        //TODO should return all the descriptors from this ontology -> currently 52 elements
        done(1);
    });

    it("[JSON] It should not get descriptors from dcterms ontology when logged in as demouser2 (Not creator nor collaborator of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[JSON] It should get descriptors from dcterms ontology when logged in as demouser3 (Collaborator of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
        //TODO Should return the descriptors
        done(1);
    });

    it("[JSON] It should not get descriptors from dcterms ontology (when unauthenticated and inside of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[JSON] It should not get descriptors from xy ontology (This ontology does not exist) when logged in as demouser1(The creator of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[JSON] It should not get descriptors from xy ontology (This ontology does not exist) when logged in as demouser3(Collaborator of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[JSON] It should not get descriptors from xy ontology (This ontology does not exist) (when unauthenticated trying to access the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
        //TODO Should return error
        done(1);
    });

    /**
     * PRIVATE PROJECT
     */

    it("[HTML] It should give a 405 error (method not supported) if the Accept: application/json Header was not sent. User logged in as demouser1 (The creator of the Private project "+privateProject.handle +")", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[JSON] It should not get descriptors from dcterms ontology when logged in as demouser2 (Not creator nor collaborator of the Private project "+privateProject.handle +")", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[JSON] It should get descriptors from dcterms ontology when logged in as demouser3 (Collaborator of the Private project "+privateProject.handle +")", function (done) {
        //TODO Should return the descriptors
        done(1);
    });

    it("[JSON] It should not get descriptors from dcterms ontology (when unauthenticated and inside of the Private project "+privateProject.handle +")", function (done) {
        //TODO Should not return the descriptors
        done(1);
    });

    it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser1 (The creator of the Private project "+privateProject.handle +")", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser3 (Collaborator of the Private project "+privateProject.handle +")", function (done) {
        //TODO Should return error
        done(1);
    });

    it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) (when unauthenticated trying to access the Private project "+privateProject.handle +")", function (done) {
        //TODO Should return error
        done(1);
    });

    
    it("Should Give an error when the project identified by the project_handle does not exist", function (done) {
        done(1);
    });


});
