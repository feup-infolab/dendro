process.env.NODE_ENV = 'test';

var chai = require('chai');
chai.use(require('chai-http'));

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var async = require('async');
var projectUtils = require('./../../utils/project/projectUtils.js');
var userUtils = require('./../../utils/user/userUtils.js');
var folderUtils = require('./../../utils/folder/folderUtils.js');
var httpUtils = require('./../../utils/http/httpUtils.js');

var should = chai.should();

var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");

describe("[GET] /fileVersions/all", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not authenticated", function (done) {
        done(1);
    });

    it("Should not return any fileVersion URIs if the user has no projects", function (done) {
        done(1);
    });

    it("Should not return any fileVersion URIs if the user did not add any metadata to files & or folders in his projects", function (done) {
        done(1);
    });

    it("Should return all the fileVersion URIs generated from the info from projects where the demouser1(the authenticated user) is a creator or a collaborator", function (done) {
        done(1);
    });

    it("Should not return any fileVersion URIs generated from info from projects where demouser1 is not a collaborator or a creator", function (done) {
        done(1);
    });
});

describe("[GET] /fileVersions/countNum", function () {
    //TODO API ONLY
    //TODO maybe this route needs to be changed
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return the number of fileVersions in the database if the user is logged in", function (done) {
        done(1);
    });
});

describe("[POST] /fileVersions/fileVersion", function () {
    //TODO API ONLY
    //TODO this route makes no sense & needs to be changed in the future
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not authenticated", function (done) {
        done(1);
    });

    it("Should not return any fileVersion info if the user has no projects", function (done) {
        done(1);
    });

    it("Should not return any fileVersion info if the user did not add any metadata to files & or folders in his projects", function (done) {
        done(1);
    });

    it("Should return info about a fileVersion if the user is logged in as demouser1 and the post is originated from metadata work from projects created by demouser1 or where he collaborates", function (done) {
        done(1);
    });
});

describe("[GET] /fileVersions/:uri", function () {
    //TODO HTML ONLY
    //TODO make a request to JSON API, should return invalid request
    it("Should return an error if the user is not authenticated", function (done) {
        done(1);
    });

    it("Should not return any fileVersion info page if the user has no projects", function (done) {
        done(1);
    });

    it("Should not return any fileVersion info page if the user did not add any metadata to files & or folders in his projects", function (done) {
        done(1);
    });

    it("Should return a page with info about a fileVersion if the user is logged in as demouser1 and the post is originated from metadata work from projects created by demouser1 or where he collaborates", function (done) {
        done(1);
    });
});

describe("[POST] /fileVersions/like", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that the demouser1 wants to like/unlike does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that the demouser1 wants to like/unlike belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return a success message if the fileVersion that the demouser1 wants to like/unlike belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /fileVersions/comment", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that the demouser wants to comment does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that the demouser1 wants to comment belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return a success message if the fileVersion that the demouser1 wants to comment belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /fileVersions/share", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that the demouser1 wants to share does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that the demouser1 wants to share belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return a success message if the fileVersion that the demouser1 wants to share belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /fileVersions/fileVersion/likesInfo", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that is being queried to see which users like it does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that is being queried to see which users like it belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return a success message if the fileVersion that is being queried to see which users like it belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /fileVersions/shares", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that is being queried for shares does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the fileVersion that is being queried for shares belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return the shares if the fileVersion that is being queried for shares belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});
