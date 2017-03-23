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

describe('/project/' + publicProject.handle + '?administer', function () {

    it("[HTML] should access project without logging in GET", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.administer(agent, false, {}, publicProject.handle, function(err, res){
            res.should.have.status(200);
            res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
            done();
        });
    });

    it("[HTML] should access project without admin rights GET", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.administer(agent, false, {}, publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                done();
            });
        });
    });

    it("[HTML] access project's info GET", function (done) {

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //
            // SELECT *
            // FROM
            // <http://127.0.0.1:3001/dendro_graph>
            // WHERE
            // {
            // <http://127.0.0.1:3001/project/publicprojectcreatedbydemouser1> ?p ?o
            //     }
            projectUtils.administer(agent, false, {}, publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Editing project "This is a public test project with handle ' + publicProject.handle + ' and created by demouser1"');
                done();
            });
        });
    });


    it("[HTML] modify project without logging in POST", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.administer(agent, true, {}, publicProject.handle, function(err, res){
            res.should.have.status(200);
            res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
            done();
        });
    });

    it("[HTML] modify project without admin rights POST", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.administer(agent, true, {}, publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                done();
            });
        });
    });


    it("[HTML] access non-existent project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.administer(agent, true, {}, "nonexistinghandleseriousiswear", function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                done();
            });
        });
    });


    it("[HTML] change project's privacy status", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.administer(agent, true, {}, publicProject.handle, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                done();
            });
        });
    });

    it("[HTML] remove contributors", function (done) {
        done();

    });

    it("[HTML] add non-existent contributors", function (done) {
        done();

    });

    it("[HTML] add contributors", function (done) {
        done();
    });
});