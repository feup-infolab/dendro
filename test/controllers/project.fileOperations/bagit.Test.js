process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const should = chai.should();

const publicProject = require("../../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../../mockdata/projects/metadata_only_project.js");
const privateProject= require("../../mockdata/projects/private_project.js");

var projectUtils = require('./../../utils/project/projectUtils.js');
var userUtils = require('./../../utils/user/userUtils.js');

var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");


describe('project/' + publicProject.handle + '?bagit', function () {

    it("[HTML] should perform bagit in project root not logged in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.bagit(agent, publicProject.handle, '', function(err, res){
            res.should.have.status(200);
            res.header['content-disposition'].should.equal('attachment; filename="publicprojectcreatedbydemouser1.zip"');
            done();
        });
    });

    it("[HTML] should do bag it without being contributor", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, publicProject.handle, '', function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('attachment; filename="publicprojectcreatedbydemouser1.zip"');
                done();
            });
        });
    });

    it("[JSON] should not do bagit of non-existing project", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, 'nonexistinghandle', '', function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('attachment; filename="publicprojectcreatedbydemouser1.zip"');
                done();
            });
        });
    });

    //TODO not implemented for filepath yet
    it("[JSON] should do bagit of folder", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, publicProject.handle, '/data/pastinhaLinda', function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('attachment; filename="pastinhaLinda.zip"');
                done();
            });
        });
    });

    it("[JSON] error creating backup", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.bagit(agent, publicProject.handle, '/data/nonexistentfolder', function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('attachment; filename="pastinhaLinda.zip"');
                done();
            });
        });
    });
});