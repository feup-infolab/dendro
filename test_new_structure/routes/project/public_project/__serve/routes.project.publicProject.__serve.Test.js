process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const fs = require('fs');
const path = require('path');
const async = require('async');
const Config = GLOBAL.Config;

const should = chai.should();
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject= require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));

const md5File = require('md5-file');


const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3"));
const demouser4 = require(Config.absPathInTestsFolder("mockdata/users/demouser4"));
const demouser5 = require(Config.absPathInTestsFolder("mockdata/users/demouser5"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
const db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
const createFoldersUnit = requireUncached(Config.absPathInTestsFolder("units/folders/createFolders.Unit.js"));

let Project;
let User;

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

describe("Serve public projects", function (done) {
    before(function (done) {
        this.timeout(60000);
        createFoldersUnit.setup(function (err, res) {
            should.equal(err, null);
            Project = require(Config.absPathInSrcFolder("models/project.js")).Project;
            User = require(Config.absPathInSrcFolder("/models/user.js")).User;
            done();
        });
    });
    describe('project/' + publicProject.handle + '?serve', function () {

        it("[HTML] should not serve project root", function (done) {
            let app = GLOBAL.tests.app;
            let agent = chai.request.agent(app);
            projectUtils.serve(agent, publicProject.handle, '', function(err, res){
                res.should.have.status(404);
                should.exist(err);
                err.message.should.equal('Not Found');
                done();
            });
        });

        it("[HTML] should not serve project root while creator", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.serve(agent, publicProject.handle, '', function(err, res){
                    res.should.have.status(404);
                    should.exist(err);
                    err.message.should.equal('Not Found');
                    done();
                });
            });
        });

        it("[HTML] should serve folder from project", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.serve(agent, publicProject.handle, '/data/pastinhaLinda', function(err, res){
                    res.should.have.status(200);
                    res.header['content-disposition'].should.equal('attachment; filename="pastinhaLinda.zip"');
                    done();
                });
            });
        });

        it("[HTML] should not serve non-existing folder from project", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.serve(agent, publicProject.handle, '/data/nonexistent', function(err, res){
                    res.should.have.status(200);
                    res.text.should.contain('500 Error : Unable to determine the type of the requested resource, error 2');
                    done();
                });
            });
        });

        it("[HTML] should not serve non-existing file in project", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.serve(agent, publicProject.handle, '/data/nonexistent.txt', function(err, res){
                    res.should.have.status(200);
                    res.text.should.contain('500 Error : Unable to determine the type of the requested resource, error 2');
                    done();
                });
            });
        });

        //TODO missing file inside project folder
        it("[HTML] should serve single file within project", function (done) {
            done();

        });

        it("[HTML] should serve file inside folder in project", function (done) {
            done();

        });
    });

    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        db.deleteGraphs(function (err, data) {
            should.equal(err, null);
            GLOBAL.tests.server.close();
            done();
        });
    });
});
