process.env.NODE_ENV = 'test';

var chai = require('chai');
chai.use(require('chai-http'));

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var async = require('async');
var projectUtils = require("./../../utils/project/projectUtils.js");
var userUtils = require("./../../utils/user/userUtils.js");
var folderUtils = require("./../../utils/folder/folderUtils.js");
var httpUtils = require("./../../utils/http/httpUtils.js");
var postUtils = require("./../../utils/SocialDendro/post.js");
var itemUtils = require("./../../utils/item/itemUtils.js");

var should = chai.should();

var demouser1 = require("../../mockdata/users/demouser1");
var demouser2 = require("../../mockdata/users/demouser2");
var demouser3 = require("../../mockdata/users/demouser3");

var publicProject = require("../../mockdata/projects/public_project.js");
var folder = require("../../mockdata/folders/folder.js");

describe("[GET] [GET ALL USER POSTS] /posts/all", function () {
    //TODO API ONLY

    it("Should return an error if the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should return an error if the request is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should not return any post URIs if the user has no projects", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.length.should.equal(0);
                done();
            });
        });
    });

    it("Should not return any post URIs if the user did not add any metadata to files & or folders in his projects", function (done) {
        //TODO create a project for demouser3
        //TODO Add a folder
        //TODO do not add any metadata
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createNewProject(true, agent, publicProject, function (err, res) {
                projectUtils.createFolderInProjectRoot(true, agent, publicProject.handle, folder.name, function (err, res) {
                    postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                        res.statusCode.should.equal(200);
                        res.body.length.should.equal(0);
                        done();
                    });
                });
            });
        });
    });

    it("Should return all the post URIs generated from the info from projects where the demouser3(the authenticated user) is a creator or a collaborator", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            itemUtils.updateItemMetadata(true, agent, publicProject.handle, folder.name, folder.metadata, function (err, res) {
                postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(folder.metadata.length);
                    done();
                });
            });
        });
    });

    it("Should not return any post URIs generated from info from projects where demouser3 is not a collaborator or a creator", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.length.should.equal(folder.metadata.length);//TODO THINK OF A BETTER WAY TO TEST THIS
                done();
            });
        });
    });
});

describe("[POST] /posts/post", function () {
    //TODO API ONLY
    //TODO this route makes no sense & needs to be changed in the future
    it("Should give an error if the request type for this route is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            postUtils.getAPostInfo(false, agent, "a valid post ID", function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should return an error if the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        postUtils.getAPostInfo(true, agent, "a valid postID", function (err, res) {
            res.statusCode.should.equal(401);
            done(1);
        });
    });

    it("Should return an error if the post uri is pointing to a post that does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            postUtils.getAPostInfo(true, agent, "an ivalid post ID", function (err, res) {
                res.statusCode.should.equal(404);
                res.body.message.should.equal("Invalid post uri");
                done();
            });
        });
    });
    
    it("Should give an error if the logged in user is demouser3 and the post uri is from an project where demouser3 is not a creator or collaborator", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            postUtils.getAPostInfo(true, agent, "a valid post ID from demouser1 project", function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should return info about a post if the user is logged in as demouser1 and the post is originated from metadata work from projects created by demouser1 or where he collaborates", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            postUtils.getAPostInfo(true, agent, "a valid post ID from demouser1 project", function (err, res) {
                res.statusCode.should.equal(200);
                res.body.uri.should.equal("a valid post ID from demouser1 project");
                done();
            });
        });
    });
});

/*
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
*/

describe("[POST] /posts/like", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request

    it("Should give an error if the request type for this route is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            postUtils.likeOrUnlikeAPost(false, agent, "a valid post uri from demouser1", function (err, res) {
                res.statusCode.should.equal(400);
                done();
            });
        });
    });

    it("Should return an error if the user is not logged in", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        postUtils.likeOrUnlikeAPost(true, agent, "a valid post uri for dendrouser1", function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should return an error if the post that the demouser1 wants to like/unlike does not exist", function (done) {
        done(1);
    });

    it("Should return an error if the post that the demouser3 wants to like/unlike belongs to a project were the demouser3 is not a collaborator or creator", function (done) {
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



