process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const should = chai.should();

const publicProject = require("../../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../../mockdata/projects/metadata_only_project.js");
const privateProject= require("../../mockdata/projects/private_project.js");

var projectUtils = require('./../../utils/project/projectUtils.js');
var userUtils = require('./../../utils/project/userUtils.js');

var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");


describe('project/' + publicProject.handle + '?download', function () {

    it("[HTML] should download without logging in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.download(agent, publicProject.handle, function(err, res){
            res.should.have.status(200);
            res.type.should.equal('application/zip');
            //confirm through files.js exports.restore function and/or folder.js loadContentsOfFolderIntoThis function
            done();
        });
    });

    it("[HTML] should download without being creator", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.download(agent, publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                done();
            });
        });
    });

    it("[HTML] getting already deleted project", function (done) {
        done();

    });

    it("[HTML] unable to produce zip to download", function (done) {
        done();

    });

    it("[HTML] download project with filepath", function (done) {
        done();

    });

    it("[HTML] getting non-existent folder with filepath", function (done) {
        done();

    });

});


describe('project/' + privateProject.handle + '?download', function () {

    it("[HTML] downloading without logging in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.download(agent, privateProject.handle, function(err, res){
            res.should.have.status(200);
            res.text.should.contain('Permission denied : cannot download this project.');
            //confirm through files.js exports.restore function and/or folder.js loadContentsOfFolderIntoThis function
            done();
        });
    });

    it("[HTML] downloading without being creator", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.download(agent, privateProject.handle, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                done();
            });
        });
    });

    it("[HTML] downloading without being contributor", function (done) {
        done();
    });

    it("[HTML] getting non-existing project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.download(agent, "nonexistinghandle", function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                done();
            });
        });
    });

    it("[HTML] getting already deleted project", function (done) {
        done();

    });

    it("[HTML] unable to produce zip to download", function (done) {
        done();

    });

    it("[HTML] download project without filepath", function (done) {
        done();

    });

    it("[HTML] download project with filepath", function (done) {
        done();

    });

    it("[HTML] getting non-existent folder with filepath", function (done) {
        done();

    });

});