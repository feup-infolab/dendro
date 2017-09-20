const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const md5 = require("md5");
const fs = require("fs");
const path = require("path");
const async = require("async");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const versionUtils = require(Pathfinder.absPathInTestsFolder("utils/versions/versionUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const invalidProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const notFoundFolder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));
const folderForDemouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));
const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Create a new manual post tests", function () {
    before(function (done) {
        this.timeout(60000);
        //creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[POST] [Public Project] create a new Manual Post /posts/new", function () {

        it("[For an unauthenticated user] Should give an unauthorized error", function (done) {
            done();
        });

        it("[For demouser1, as the creator of all projects] Should create the manual post and it should be saved in the database", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should create the manual post and it should be saved in the database", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error", function (done) {
            done();
        });

        //The case when the post title is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post title is missing", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post title is missing", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error  if the title is missing", function (done) {
            done();
        });

        //The case when the post content is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post content is missing", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post content is missing", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post content is missing", function (done) {
            done();
        });

        //The case when the post project is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post project is missing", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post project is missing", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project is missing", function (done) {
            done();
        });

        //The case when the post project does not exist
        it("[For demouser1, as the creator of all projects] Should give a 404 error if the post project does not exist", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a 404 error if the post project does not exist", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project does not exist", function (done) {
            done();
        });

    });

    describe("[POST] [Metadata only Project] create a new Manual Post /posts/new", function () {

        it("[For an unauthenticated user] Should give an unauthorized error", function (done) {
            done();
        });

        it("[For demouser1, as the creator of all projects] Should create the manual post and it should be saved in the database", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should create the manual post and it should be saved in the database", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error", function (done) {
            done();
        });

        //The case when the post title is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post title is missing", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post title is missing", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error  if the title is missing", function (done) {
            done();
        });

        //The case when the post content is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post content is missing", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post content is missing", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post content is missing", function (done) {
            done();
        });

        //The case when the post project is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post project is missing", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post project is missing", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project is missing", function (done) {
            done();
        });

        //The case when the post project does not exist
        it("[For demouser1, as the creator of all projects] Should give a 404 error if the post project does not exist", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a 404 error if the post project does not exist", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project does not exist", function (done) {
            done();
        });

    });

    describe("[POST] [Private Project] create a new Manual Post /posts/new", function () {

        it("[For an unauthenticated user] Should give an unauthorized error", function (done) {
            done();
        });

        it("[For demouser1, as the creator of all projects] Should create the manual post and it should be saved in the database", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should create the manual post and it should be saved in the database", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error", function (done) {
            done();
        });

        //The case when the post title is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post title is missing", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post title is missing", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error  if the title is missing", function (done) {
            done();
        });

        //The case when the post content is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post content is missing", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post content is missing", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post content is missing", function (done) {
            done();
        });

        //The case when the post project is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post project is missing", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post project is missing", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project is missing", function (done) {
            done();
        });

        //The case when the post project does not exist
        it("[For demouser1, as the creator of all projects] Should give a 404 error if the post project does not exist", function (done) {
            done();
        });

        it("[For demouser2, a collaborator in all projects] Should give a 404 error if the post project does not exist", function (done) {
            done();
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project does not exist", function (done) {
            done();
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

});

