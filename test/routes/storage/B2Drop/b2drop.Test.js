const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Pathfinder.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const addContributorsToProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));


describe("[B2Drop] Basic Operations" , function (done) {
        before(function (done) {
            this.timeout(Config.testsTimeout);
            done();
        });

        describe("[PUT] " , function () {
            it("Should upload successfully test file", function (done) {

            });

            it("Should reject test file upload" , function (done) {

            });

            it("Should give  unauthorized access ", function(done) {

            });
        });

        describe("[GET]" , function() {
            it("Should get succesfully test file", function (done) {
                
            });

            it("Should not found test file", function(done) {

            });

            it("Should give  unauthorized access ", function(done) {

            });

        });

        describe("[DELETE]" , function() {
            it("Should delete succesfully test file", function (done) {

            });

            it("Should not found test file", function(done) {

            });

            it("Should give  unauthorized access ", function(done) {

            });
        });

        describe("[Create Folder]" , function() {
            it("Should  succesfully create folder", function (done) {

            });

            it("Should give  unauthorized access ", function (done) {

            });
        });

        describe("[List Folder]" , function() {
            it("Should  succesfully list folder", function (done) {

             });

            it("Should  not found folder", function (done) {

            });

             it("Should give  unauthorized access ", function (done) {

             });
        });

        describe("[Delete Folder]" , function() {
            it("Should  succesfully delete folder", function (done) {

            });

            it("Should give  unauthorized access ", function (done) {

            });

            it("Should not found folder ", function (done) {

            });
         });



    });
    after(function (done) {
            //destroy graphs
            this.timeout(Config.testsTimeout);
            appUtils.clearAppState(function (err, data) {
                should.equal(err, null);
                done();
            });
    });

