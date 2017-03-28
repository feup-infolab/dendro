process.env.NODE_ENV = 'test';

var chai = require('chai');
chai.use(require('chai-http'));

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var async = require('async');
var projectUtils = require('./../utils/project/projectUtils.js');
var userUtils = require('./../utils/user/userUtils.js');
var folderUtils = require('./../utils/folder/folderUtils.js');
var httpUtils = require('./../utils/http/httpUtils.js');

var should = chai.should();

var demouser1 = require("../mockdata/users/demouser1");
var demouser2 = require("../mockdata/users/demouser2");
var demouser3 = require("../mockdata/users/demouser3");

describe("[POST] /project/:handle?export_to_repository", function () {
    //TODO API ONLY
    it("Should give an error when the target repository is invalid[not b2share zenodo etc]", function (done) {
        done(0); //TODO
    });

    it("Should give an error when the user is unauthenticated", function (done) {
        done(0); //TODO
    });

    it("Should give an error when the user is logged in as demouser2(nor creator nor collaborator of the project)", function (done) {
        done(0); //TODO
    });

    it("Should give an error when there is an invalid access token for deposit although a creator or collaborator is logged in", function (done) {
        done(0); //TODO
    });

    it("Should give an error when there is an invalid external url for deposit although a creator or collaborator is logged in", function (done) {
        done(0); //TODO
    });

    it("Should give an error when the project to export does not exist although a creator or collaborator is logged in", function (done) {
        done(0); //TODO
    });

    it("Should give a success message when the project to export exists and a creator or collaborator is logged in", function (done) {
        done(0); //TODO
    });
});


describe("[POST] /project/:handle/data/:foldername?export_to_repository", function () {
    //TODO http://127.0.0.1:3001/project/privateproj/data/folder1?export_to_repository
    it("Should give an error when the target repository is invalid[not b2share zenodo etc]", function (done) {
        done(0); //TODO
    });

    it("Should give an error when the user is unauthenticated", function (done) {
        done(0); //TODO
    });

    it("Should give an error when the user is logged in as demouser2(nor creator nor collaborator of the project)", function (done) {
        done(0); //TODO
    });

    it("Should give an error when there is an invalid access token for deposit although a creator or collaborator is logged in", function (done) {
        done(0); //TODO
    });

    it("Should give an error when there is an invalid external url for deposit although a creator or collaborator is logged in", function (done) {
        done(0); //TODO
    });

    it("Should give an error when the project does not exist although a creator or collaborator is logged in", function (done) {
        done(0); //TODO
    });

    it("Should give an error when the folder to export does not exist although a creator or collaborator is logged in", function (done) {
        done(0); //TODO
    });

    it("Should give a success message when the folder to export exists and a creator or collaborator is logged in", function (done) {
        done(0); //TODO
    });
});
