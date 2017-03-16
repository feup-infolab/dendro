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

describe("[GET] /posts/all", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not authenticated", function (done) {
        done(1);
    });

    it("Should not return any post URIs if the user has no projects", function (done) {
        done(1);
    });

    it("Should not return any post URIs if the user did not add any metadata to files & or folders in his projects", function (done) {
        done(1);
    });

    it("Should return all the post URIs generated from the info from projects where the demouser1(the authenticated user) is a creator or a collaborator", function (done) {
        done(1);
    });

    it("Should not return any post URIs generated from info from projects where demouser1 is not a collaborator or a creator", function (done) {
        done(1);
    });
});

describe("[POST] /posts/post", function () {
    //TODO API ONLY
    //TODO this route makes no sense & needs to be changed in the future
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not authenticated", function (done) {
        done(1);
    });

    it("Should not return any post info if the user has no projects", function (done) {
        done(1);
    });

    it("Should not return any post info if the user did not add any metadata to files & or folders in his projects", function (done) {
        done(1);
    });

    it("Should return info about a post if the user is logged in as demouser1 and the post is originated from metadata work from projects created by demouser1 or where he collaborates", function (done) {
        done(1);
    });
});

describe("[POST] /posts/new", function () {
    //TODO This is not implemented yet
    //TODO Users cannot yet create posts manually
    //TODO Currently posts are only created by projects metadata alterations or file alterations

    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the project where the demouser1 wants to create a post in does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the project where the demouser1 wants to create a post is not a project created by him or where he collaborates", function (done) {
        done(1);
    });

    it("Should create a post if the user is logged in as demouser1 and the project is one created by demouser1 or one where he collaborates in", function (done) {
        done(1);
    });
});

describe("[POST] /posts/like", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the post that the demouser1 wants to like/unlike does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the post that the demouser1 wants to like/unlike belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return a success message if the post that the demouser1 wants to like/unlike belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /posts/like/liked" , function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the post that is being checked to see if the demouser1 liked it does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the post that is being checked to see if the demouser1 liked it belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return a success message if the post that is being checked to see if the demouser1 liked it belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /posts/post/likesInfo", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the post that is being queried to see which users like it does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the post that is being queried to see which users like it belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return a success message if the post that is being queried to see which users like it belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /posts/comment", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the post that the demouser wants to comment does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the post that the demouser1 wants to comment belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return a success message if the post that the demouser1 wants to comment belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /posts/comments", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the post that is being queried for comments does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the post that is being queried for comments belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return the comments if the post that is being queried for comments belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /posts/share", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the post that the demouser1 wants to share does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the post that the demouser1 wants to share belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return a success message if the post that the demouser1 wants to share belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[POST] /posts/shares", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return an error if the post that is being queried for shares does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the post that is being queried for shares belongs to a project were the demouser1 is not a collaborator or creator", function (done) {
        done(1);
    });

    it("Should return the shares if the post that is being queried for shares belongs to a project were the demouser1 is a collaborator or creator", function (done) {
        done(1);
    });
});

describe("[GET] /posts/countNum", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO maybe this route needs to be changed
    it("Should return an error if the user is not logged in", function (done) {
        done(1);
    });

    it("Should return the number of posts in the database if the user is logged in", function (done) {
        done(1);
    });
});

describe("[GET] /posts/:uri", function () {
    //TODO HTML ONLY
    //TODO make a request to JSON API, should return invalid request
    it("Should return an error if the user is not authenticated", function (done) {
        done(1);
    });

    it("Should not return any post info page if the user has no projects", function (done) {
        done(1);
    });

    it("Should not return any post info page if the user did not add any metadata to files & or folders in his projects", function (done) {
        done(1);
    });

    it("Should return a page with info about a post if the user is logged in as demouser1 and the post is originated from metadata work from projects created by demouser1 or where he collaborates", function (done) {
        done(1);
    });
});

describe("[GET] /shares/:uri", function () {
    //TODO HTML ONLY
    //TODO make a request to JSON API, should return invalid request
    it("Should return an error if the user is not authenticated", function (done) {
        done(1);
    });

    it("Should not return any info page about a share if the user has no projects", function (done) {
        done(1);
    });

    it("Should not return any info page about a share if the share does not exist in the projects where the demouser1 is a creator or collaborator", function (done) {
        done(1);
    });

    it("Should return a page with info about a share if the user is logged in as demouser1 and the share originates from projects created by demouser1 or where he collaborates", function (done) {
        done(1);
    });
});



