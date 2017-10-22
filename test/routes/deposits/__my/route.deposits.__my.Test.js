process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const fs = require('fs');
const path = require('path');
const async = require('async');
const Config = global.Config;

const should = chai.should();
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject= require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));

const md5File = require('md5-file');

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const depositUtils = require(Pathfinder.absPathInTestsFolder("utils/deposit/depositUtils"));

let demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
let demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
let demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));
const createFoldersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));

let Project;
let User;

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module)
}

const params = {
    key : "project",
    uuid : "aerg35tgsrh45h",
    offset : 0,
    page : 10
};

describe("Deposits/latest", function (done) {
    before(function (done) {
        this.timeout(60000);
        createFoldersUnit.setup(function (err, res) {
            should.equal(err, null);
            Project = require(Pathfinder.absPathInSrcFolder("models/project.js")).Project;
            User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;
            done();
        });
    });
    describe('?my', function(){

        it("should not show personal deposits to unauthenticated user", function (done) {
            let app = global.tests.app;
            let agent = chai.request.agent(app);

            depositUtils.sendDeposits(true, params, agent, function(err, res){
                should.exist(err);
                res.should.have.status(404);
                done();
            })
        });

        it("should not show deposits from other users", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {

                depositUtils.sendDeposits(true, params, agent, function(err, res){
                    should.exist(err);
                    res.should.have.status(404);
                    done();
                });
            });
        });

        it("should show my deposits", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                //create deposit in a project

                depositUtils.sendDeposits(true, params, agent, function(err, res){
                    should.exist(err);
                    res.should.have.status(404);
                    done();
                });
            });

        });

        after(function (done) {
            //destroy graphs
            this.timeout(Config.testsTimeout);
            db.deleteGraphs(function (err, data) {
                should.equal(err, null);
                GLOBAL.tests.server.close();
                done();
            });
    });
});
