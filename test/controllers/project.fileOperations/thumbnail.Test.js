process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

var Config = function() { return GLOBAL.Config; }();
var Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;

const should = chai.should();
const expect = chai.expect();

const publicProject = require("../../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../../mockdata/projects/metadata_only_project.js");
const privateProject= require("../../mockdata/projects/private_project.js");

var projectUtils = require('./../../utils/project/projectUtils.js');
var userUtils = require('./../../utils/user/userUtils.js');

var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");


describe('project/' + publicProject.handle + '?thumbnail', function () {

    it("[HTML] should access thumbnail without logging in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.thumbnail(agent, '', publicProject.handle, function(err, res){
            res.should.have.status(200);
            res.header['content-disposition'].should.equal('filename="package.png"');
            done();
        });
    });

    it("[HTML] should access thumbnail without being contributor", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.thumbnail(agent, '', publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="package.png"');
                done();
            });
        });
    });

    it("[HTML] should return txt icon", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a.txt', publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="file_extension_txt.png"');
                done();
            });
        });
    });

    //TODO needs to add file to project first
    it("[HTML] should return png icon in project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a.png', publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="file_extension_txt.png"');
                done();
            });
        });
    });

    it("[HTML] should return document empty icon", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a.invalid', publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="document_empty.png"');
                done();
            });
        });
    });

    it("[HTML] should return folder icon", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a/', publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="folder.png"');
                done();
            });
        });
    });

    it("[HTML] should return icon if creator", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '', publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="package.png"');
                done();
            });
        });
    });
});




describe('project/' + privateProject.handle + '?thumbnail', function () {

    it("[HTML] should not access thumbnail without logging in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.thumbnail(agent, '', privateProject.handle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Permission denied : cannot get thumbnail for this project because you do not have permissions to access this project.');
            done();
        });
    });

    it("[HTML] should not access project without being contributor", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.thumbnail(agent, '', privateProject.handle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Permission denied : cannot get thumbnail for this project because you do not have permissions to access this project.');
                done();
            });
        });
    });

    it("[HTML] should return txt icon", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a.txt', privateProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="file_extension_txt.png"');
                done();
            });
        });
    });

    //TODO needs to add file to project first
    it("[HTML] should return png icon in project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a.png', privateProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="file_extension_txt.png"');
                done();
            });
        });
    });

    it("[HTML] should return document empty icon", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a.invalid', privateProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="document_empty.png"');
                done();
            });
        });
    });

    it("[HTML] should return folder icon", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a/', privateProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="folder.png"');
                done();
            });
        });
    });

    it("[HTML] should return icon if creator", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '', privateProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="package.png"');
                done();
            });
        });
    });

});


describe('project/' + metadataOnlyProject.handle + '?thumbnail', function () {

    it("[HTML] should access thumbnail without logging in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.thumbnail(agent, '', metadataOnlyProject.handle, function(err, res){
            res.should.have.status(200);
            res.header['content-disposition'].should.equal('filename="package.png"');
            done();
        });
    });

    it("[HTML] should access thumbnail without being contributor", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.thumbnail(agent, '', metadataOnlyProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="package.png"');
                done();
            });
        });
    });

    it("[HTML] should return txt icon", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a.txt', metadataOnlyProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="file_extension_txt.png"');
                done();
            });
        });
    });

    //TODO needs to add file to project first
    it("[HTML] should return png icon in project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a.png', metadataOnlyProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="file_extension_txt.png"');
                done();
            });
        });
    });

    it("[HTML] should return document empty icon", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a.invalid', metadataOnlyProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="document_empty.png"');
                done();
            });
        });
    });

    it("[HTML] should return folder icon", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '/data/a/', metadataOnlyProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="folder.png"');
                done();
            });
        });
    });

    it("[HTML] should return icon if creator", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.thumbnail(agent, '', metadataOnlyProject.handle, function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('filename="package.png"');
                done();
            });
        });
    });
});