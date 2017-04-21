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

describe('project/' + publicProject.handle + '?backup', function () {

    it("[HTML] should not backup project root", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.backup(agent, publicProject.handle, '', function(err, res){
            res.should.have.status(404);
            should.exist(err);
            err.message.should.equal('Not Found');
            done();
        });
    });

    it("[HTML] should not backup project root while creator", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.backup(agent, publicProject.handle, '', function(err, res){
                res.should.have.status(404);
                should.exist(err);
                err.message.should.equal('Not Found');
                done();
            });
        });
    });


    it("[HTML] should create backup of folder from project", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.backup(agent, publicProject.handle, '/data/pastinhaLinda', function(err, res){
                res.should.have.status(200);
                res.header['content-disposition'].should.equal('attachment; filename="pastinhaLinda.zip"');
                done();
            });
        });
    });

    it("[HTML] should not create backup of non-existing folder from project", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.backup(agent, publicProject.handle, '/data/nonexistent', function(err, res){
                res.should.have.status(200);
                res.text.should.contain('500 Error : Unable to determine the type of the requested resource, error 2');
                done();
            });
        });
    });

    it("[HTML] should not create backup of single file within project", function (done) {
        done();

    });

    it("[HTML] should create backup of file inside folder in project", function (done) {
        done();

    });
});