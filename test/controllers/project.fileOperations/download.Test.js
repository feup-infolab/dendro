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


describe('project/' + publicProject.handle + '?download', function () {

    it("[HTML] should download without logging in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.download(agent, publicProject.handle, '', function(err, res){
            res.should.have.status(200);
            res.header['content-disposition'].should.equal('attachment; filename="publicprojectcreatedbydemouser1.zip"');
            //confirm through files.js exports.restore function and/or folder.js loadContentsOfFolderIntoThis function
            done();
        });
    });

    it("[HTML] should download without being creator", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.download(agent, publicProject.handle, '', function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('attachment; filename="publicprojectcreatedbydemouser1.zip"');
                done();
            });
        });
    });

    it("[HTML] should download folder from project", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.download(agent, publicProject.handle, '/data/pastinhaLinda', function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('attachment; filename="pastinhaLinda.zip"');
                done();
            });
        });
    });

    it("[HTML] should not download non-existing folder from project", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.download(agent, publicProject.handle, '/data/nonexistent', function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.contain('500 Error : Unable to determine the type of the requested resource, error 2');
                done();
            });
        });
    });

    it("[HTML] should not download single file within project", function (done) {
        done();

    });

    it("[HTML] should download file inside folder in project", function (done) {
        done();

    });

});
