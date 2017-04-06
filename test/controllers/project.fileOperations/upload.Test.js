process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
var fs = require('fs');
var path = require('path');
var async = require('async');

var File = require(Config.absPathInSrcFolder('models/directory_structure/file.js'));

const should = chai.should();


const publicProject = require("../../mockdata/projects/public_project.js");
const metadataOnlyProject = require("../../mockdata/projects/metadata_only_project.js");
const privateProject= require("../../mockdata/projects/private_project.js");

var projectUtils = require('./../../utils/project/projectUtils.js');
var userUtils = require('./../../utils/user/userUtils.js');
const pdfMockFile= require("../mockdata/folders/folder.js");
const pngMockFile= require("../mockdata/files/test_uploads/infolab.png");


var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");

describe('project/' + publicProject.handle + '?upload', function () {

    it("[HTML] should not upload file in root without logging in POST", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.upload(agent, true, '', publicProject.handle, function (err, res) {
            res.should.have.status(404);
            should.exist(err);
            err.message.should.equal('Not Found');
            done();
        });
    });

    it("[HTML] should not upload file in root without being creator nor contributor POST", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.upload(agent, true, '', publicProject.handle, function (err, res) {
                res.should.have.status(404);
                should.exist(err);
                err.message.should.equal('Not Found');
                done();
            });
        });
    });

    it("[HTML] should not upload file in root as creator POST", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.upload(agent, true, '', publicProject.handle, function (err, res) {
                res.should.have.status(404);
                should.exist(err);
                err.message.should.equal('Not Found');
                done();
            });
        });
    });

    it("[HTML] should not upload file in folder without logging in POST", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.upload(agent, true, '/data/pastinhaLinda', publicProject.handle, function (err, res) {
            res.should.have.status(200);
            should.not.exist(err);
            res.text.should.contain('Permission denied : cannot upload resource because you do not have permissions to edit this project.');
            done();
        });
    });

    it("[HTML] should upload file in folder as creator POST", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            var query = '&upload_id=ola';
            projectUtils.upload(agent, true, '/data/pastinhaLinda', publicProject.handle, query,  function (err, res) {
                res.should.have.status(500);
                should.exist(err);
                res.text.should.equal('{"result":"error","message":"Upload ID not recognized. Please restart uploading undefinedfrom the beginning."}');
                done();
            });
        });
    });
});
