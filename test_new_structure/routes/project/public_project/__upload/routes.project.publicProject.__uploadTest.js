process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const fs = require('fs');
const path = require('path');
const async = require('async');
const Browser = require('zombie');
const Config = GLOBAL.Config;

//let File = require(Config.absPathInSrcFolder('models/directory_structure/file.js')).File;


const should = chai.should();


const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));

const md5File = require('md5-file');



const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));


var demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1"));
var demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2"));
var demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
var createFoldersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/folders/createFolders.Unit.js"));

describe("Upload data projects", function (done) {
    before(function (done) {
        this.timeout(60000);
        createFoldersUnit.setup(function (err, res) {
            should.equal(err, null);

            const phantom = require('phantom');
            var sitepage = null;
            var phInstance = null;
            phantom.create()
                .then(instance => {
                    phInstance = instance;
                    return instance.createPage();
                })
                .then(page => {

                    page.on("onResourceRequested", function(requestData) {
                        page.open('https://stackoverflow.com/', function(err){
                            console.log(err);

                            page.property('content', function(err, content){
                                console.log(content);
                                console.log(err);
                                done();
                            });
                        });
                    });





                })
                .catch(error => {
                    console.log(error);
                    phInstance.exit();
                });



        });
    });


    describe('project/' + publicProject.handle + '?upload', function () {

        it("[HTML] should not upload file in root without logging in POST", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            projectUtils.upload(agent, true, '', publicProject.handle, "", function (err, res) {
                res.should.have.status(404);
                should.exist(err);
                err.message.should.equal('Not Found');
                done();
            });
        });

        it("[HTML] should not upload file in root without being creator nor contributor POST", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.upload(agent, true, '', publicProject.handle, "", function (err, res) {
                    res.should.have.status(404);
                    should.exist(err);
                    err.message.should.equal('Not Found');
                    done();
                });
            });
        });

        it("[HTML] should not upload file in root as creator POST", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.upload(agent, true, '', publicProject.handle, "", function (err, res) {
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
            projectUtils.upload(agent, true, '/data/pastinhaLinda', publicProject.handle, "", function (err, res) {
                res.should.have.status(200);
                should.not.exist(err);
                res.text.should.contain('Permission denied : cannot upload resource because you do not have permissions to edit this project.');
                done();
            });
        });

        it("[HTML] should upload file in folder as creator POST", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {

                //browser.visit("/projects/my", function(err){
                    var query = '&filename=all.ejs&size=3549&username=' + demouser1.username;
                    projectUtils.upload(agent, false, '/data/pastinhaLinda', publicProject.handle, query, function (err, res) {
                        res.should.have.status(500);
                        should.exist(err);
                        res.text.should.equal('{"result":"error","message":"Upload ID not recognized. Please restart uploading undefinedfrom the beginning."}');
                        done();
                    });
                //});
            });
        });
    });

    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            GLOBAL.tests.server.close();
            done();
        });
    });
});
