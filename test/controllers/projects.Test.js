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

var publicproject = require("../mockdata/projects/public_project");
var publicprojectHTMLTests = require("../mockdata/projects/public_project_for_html");

var metadaOnlyProject = require("../mockdata/projects/metadata_only_project");
var metadataOnlyHTMLTests = require("../mockdata/projects/metadata_only_project_for_html");

var privateProject = require("../mockdata/projects/private_project");
var privateProjectHTMLTests = require("../mockdata/projects/private_project_for_html");

var projectBackupData = require("../mockdata/projects/projectBackups/publicProject");

var folder = require("../mockdata/folders/folder");
var folderForDemouser2 = require("../mockdata/folders/folderDemoUser2");

//CREATE A PROJECT
/*
describe("[GET] /projects/new", function () {
    it("[HTML] Should show the new project Html page when logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getNewProjectPage(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<h1 class=\"page-header\">\n    Create a new project\n</h1>");
                res.text.should.not.contain("<p>Please log into the system.</p>");
                done();
            });
        });
    });

    it("[HTML] Should not show the new project Html page when unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        projectUtils.getNewProjectPage(false, agent, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("[JSON] Should give an error if the request for this route is of type JSON", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getNewProjectPage(true, agent, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("API Request not valid for this route.");
                done();
            });
        });
    });
});
*/

//CREATE PROJECTS TESTS
describe("[POST] with project handle: "+ publicproject.handle + " [/projects/new]", function () {
    it("[JSON] Should show an error when trying to create a project unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(true, agent, publicproject, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });

    it("[JSON] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createNewProject(true, agent, publicproject, function (err, res) {
                res.statusCode.should.equal(200);
                //res.body.projects.length.should.equal(1);//TODO UNCOMMENT THIS AFTER ALL TESTS ARE DONE
                userUtils.addUserAscontributorToProject(true, agent, demouser2.username, publicproject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });

    it("[HTML] Should show an error when trying to create a project unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(false, agent, publicprojectHTMLTests, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("[HTML] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createNewProject(false, agent, publicprojectHTMLTests, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>New project This is a public test project with handle publicprojecthtmlcreatedbydemouser1 and created by demouser1 with handle publicprojecthtmlcreatedbydemouser1 created successfully</p>");
                done();
            });
        });
    });
});

describe("[POST] with project handle: "+ metadaOnlyProject.handle + " [/projects/new]", function () {
    it("[JSON] Should show an error when trying to create a project unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(true, agent, metadaOnlyProject, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });

    it("[JSON] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createNewProject(true, agent, metadaOnlyProject, function (err, res) {
                res.statusCode.should.equal(200);
                //res.body.projects.length.should.equal(3);//TODO UNCOMMENT THIS AFTER ALL TESTS ARE DONE
                //ADDING DEMOUSER2 AS A CONTRIBUTOR OF THE PROJECT
                userUtils.addUserAscontributorToProject(true, agent, demouser2.username, metadaOnlyProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });

    it("[HTML] Should show an error when trying to create a project unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(false, agent, metadataOnlyHTMLTests, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("[HTML] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createNewProject(false, agent, metadataOnlyHTMLTests, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>New project This is a metadata only test project with handle metadataonlyhtmlprojectcreatedbydemouser1 and created by demouser1 with handle metadataonlyhtmlprojectcreatedbydemouser1 created successfully</p>");
                done();
            });
        });
    });
});

describe("[POST] with project handle: "+ privateProject.handle + " [/projects/new]", function () {
    //TODO HTML AND API
    it("[JSON] Should show an error when trying to create a project unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(true, agent, privateProject, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });

    it("[JSON] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createNewProject(true, agent, privateProject, function (err, res) {
                res.statusCode.should.equal(200);
                //res.body.projects.length.should.equal(5);//TODO UNCOMMENT THIS AFTER ALL TESTS ARE DONE
                userUtils.addUserAscontributorToProject(true, agent, demouser2.username, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });

    it("[HTML] Should show an error when trying to create a project unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(false, agent, privateProjectHTMLTests, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("[HTML] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createNewProject(false, agent, privateProjectHTMLTests, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("New project This is a private test project with handle privateprojecthtmlcreatedbydemouser1 and created by demouser1 with handle privateprojecthtmlcreatedbydemouser1 created successfully");
                done();
            });
        });
    });
});



//LIST ALL PROJECTS
/*
describe("[GET] /projects", function () {
    it("[HTML] Should only get public and metadata_only projects when unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        projectUtils.listAllProjects(false, agent, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">metadataonlyprojectcreatedbydemouser1</a>");
            res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">metadataonlyhtmlprojectcreatedbydemouser1</a>");

            res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1</a>");
            res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1</a>");

            res.text.should.not.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1</a>");
            res.text.should.not.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1</a>");
            done();
        });
    });

    it("[HTML] Should get all public and metadata_only projects as well as private_projects created by demouser1 when logged in as demouser1(CREATOR)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.listAllProjects(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">metadataonlyprojectcreatedbydemouser1</a>");
                res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">metadataonlyhtmlprojectcreatedbydemouser1</a>");

                res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1</a>");
                res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1</a>");

                res.text.should.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1</a>");
                res.text.should.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1</a>");
                done();
            });
        });
    });

    it("[HTML] Should get all public and metadata_only projects as well as private_projects created by demouser1 where demouser3 collaborates when logged in as demouser3(COLLABORATOR WITH DEMOUSER1 ON PRIVATEPROJECTA)", function (done) {
        //TODO must merge with william code first so that collaborators can be added
        done(1);
    });

    it("[HTML] Should only get public and metadata_only projects and not private projects created by demouser1 when logged in as demouser2(NOR CREATOR NOR COLLABORATOR)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, res) {
            projectUtils.listAllProjects(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">metadataonlyprojectcreatedbydemouser1</a>");
                res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">metadataonlyhtmlprojectcreatedbydemouser1</a>");

                res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1</a>");
                res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1</a>");

                res.text.should.not.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1</a>");
                res.text.should.not.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1</a>");
                done();
            });
        });
    });

    it("[HTML] Should not show any projects if none exist", function (done) {
        //TODO must think of a way to test this
        done(1);
    });

    it("[JSON] Should give an error if the request for this route is of type JSON", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.listAllProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("API Request not valid for this route.");
                done();
            });
        });
    });
});

describe("[GET] /projects/my", function () {
    it("[HTML] Should show all the projects created and where demouser1 collaborates when demouser1 is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.listAllMyProjects(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">");
                res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">");

                res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">");
                res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">");

                res.text.should.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">");
                res.text.should.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">");
                done();
            });
        });
    });

    it("[HTML] Should not show projects created by demouser1 and where demouser2 does not collaborate when logged in as demouser2", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.listAllMyProjects(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.not.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">");
                res.text.should.not.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">");

                res.text.should.not.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">");
                res.text.should.not.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">");

                res.text.should.not.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">");
                res.text.should.not.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">");
                done();
            });
        });
    });

    it("[HTML] Should give error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.listAllMyProjects(false, agent, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("[JSON] Should show all the projects created and where demouser1 collaborates when demouser1 is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.listAllMyProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("metadataonlyprojectcreatedbydemouser1");
                res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                res.text.should.contain("publicprojectcreatedbydemouser1");
                res.text.should.contain("publicprojecthtmlcreatedbydemouser1");

                res.text.should.contain("privateprojectcreatedbydemouser1");
                res.text.should.contain("privateprojecthtmlcreatedbydemouser1");
                done();
            });
        });
    });

    it("[JSON] Should not show projects created by demouser1 and where demouser2 does not collaborate when logged in as demouser2", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.listAllMyProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.not.contain("metadataonlyprojectcreatedbydemouser1");
                res.text.should.not.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                res.text.should.not.contain("publicprojectcreatedbydemouser1");
                res.text.should.not.contain("publicprojecthtmlcreatedbydemouser1");

                res.text.should.not.contain("privateprojectcreatedbydemouser1");
                res.text.should.not.contain("privateprojecthtmlcreatedbydemouser1");
                done();
            });
        });
    });

    it("[JSON] Should give error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.listAllMyProjects(true, agent, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });
});

describe("[GET] /projects/import", function () {
    it("Should get an error when trying to access the html page to import a project when unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.importProjectHTMLPage(false, agent, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("Should get the html import a project page when logged in as any user", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.importProjectHTMLPage(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<h1 class=\"page-header\">\n    Import a project\n</h1>");
                done();
            });
        });
    });

    it("[JSON] Should give an error if the request for this route is of type JSON", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.importProjectHTMLPage(true, agent, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("API Request not valid for this route.");
                done();
            });
        });
    });
});

describe("[POST] /projects/import", function () {
    //TODO API ONLY
    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.importProject(true, agent, projectBackupData.path, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give a status code of 200 when the user is logged in and the zip file used to import the project is not corrupted", function (done) {
        done(1);
    });

    it("Should give an error with a status code of 500 when the zip file used to import the project is corrupted even thought the user is logged in", function (done) {
        done(1);
    });

    it("[HTML] Should give an error if the request type for this route is the HTML type", function (done) {
        done(1);
    });
});

describe("[GET] /project/:handle/request_access " + "[" + publicproject.handle + "]", function () {
    it("Should get an error when trying to access the request access to a project HTML page when not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.getRequestProjectAccessPage(false, agent, publicproject.handle, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<h1 class=\"page-header\">\n        Please sign in\n    </h1>");
            done();
        });
    });

    it("Should get an error when trying to access the request access to a project that does not exist event when authenticated", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getRequestProjectAccessPage(false, agent, "ARandomProjectHandle", function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("error");
                done();
            });
        });
    });

    it("Should get the request access to a project HTML page when authenticated as any user", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.getRequestProjectAccessPage(false, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<button type=\"submit\" class=\"btn btn-sm btn-success\">Request access for project " + "\'" + publicproject.handle + "\'</button>");
                done();
            });
        });
    });

    it("Should give an error when the request type for this route is of type JSON", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.getRequestProjectAccessPage(true, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("API Request not valid for this route.");
                done();
            });
        });
    })
});

describe("[GET] /project/:handle/request_access " + "[" + metadaOnlyProject.handle + "]", function () {
    it("Should get an error when trying to access the request access to a project HTML page when not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.getRequestProjectAccessPage(false, agent, metadaOnlyProject.handle, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<h1 class=\"page-header\">\n        Please sign in\n    </h1>");
            done();
        });
    });

    it("Should get an error when trying to access the request access to a project that does not exist event when authenticated", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getRequestProjectAccessPage(false, agent, "ARandomProjectHandle", function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("error");
                done();
            });
        });
    });

    it("Should get the request access to a project HTML page when authenticated as any user", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.getRequestProjectAccessPage(false, agent, metadaOnlyProject.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<button type=\"submit\" class=\"btn btn-sm btn-success\">Request access for project " + "\'" + metadaOnlyProject.handle + "\'</button>");
                done();
            });
        });
    });

    it("Should give an error when the request type for this route is of type JSON", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.getRequestProjectAccessPage(true, agent, metadaOnlyProject.handle, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("API Request not valid for this route.");
                done();
            });
        });
    })
});

describe("[GET] /project/:handle/request_access " + "[" + privateProject.handle + "]", function () {
    it("Should get an error when trying to access the request access to a project HTML page when not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.getRequestProjectAccessPage(false, agent, privateProject.handle, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<h1 class=\"page-header\">\n        Please sign in\n    </h1>");
            done();
        });
    });

    it("Should get an error when trying to access the request access to a project that does not exist event when authenticated", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getRequestProjectAccessPage(false, agent, "ARandomProjectHandle", function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("error");
                done();
            });
        });
    });

    it("Should get the request access to a project HTML page when authenticated as any user", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.getRequestProjectAccessPage(false, agent, privateProject.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<button type=\"submit\" class=\"btn btn-sm btn-success\">Request access for project " + "\'" + privateProject.handle + "\'</button>");
                done();
            });
        });
    });

    it("Should give an error when the request type for this route is of type JSON", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.getRequestProjectAccessPage(true, agent, privateProject.handle, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("API Request not valid for this route.");
                done();
            });
        });
    })
});

describe("[POST] /project/:handle/request_access", function () {
    //TODO HTML ONLY -> also sends flash messages with success or error responses
    //TODO make a request to JSON API, should return invalid request
    //TODO TEST for all project types
    
    it("Should get an error when user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        projectUtils.requestAccessToProject(false, agent, publicproject, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("Should successfully request access to an existing project authenticated as demouser2 to a project created by demouser1", function (done) {
        done(1);
        //TODO mailer is not working
    });

    it("Should give an error trying to request access to a project that does not exist", function (done) {
        done(1);
    });

    it("Should give an error trying to request access, logged in as demouser1, to a project where demouser1 already is a creator", function (done) {
        done(1);
    });

    it("Should give an error trying to request access, logged in as demouser1, to a project where demouser1 already is a collaborator", function (done) {
        done(1);
    });
});

describe("[JSON] [POST] /project/:handle/delete", function () {
    //TODO HTML AND API
    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.deleteProject(true, agent, "aRandomProjectHandle", function (err, res) {
                res.statusCode.should.equal(404);
                res.body.message.should.equal("Unable to find project with handle : aRandomProjectHandle");
                done();
            });
        });
    });
    
    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.deleteProject(true, agent, publicproject.handle, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a project created by demouser1", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.deleteProject(true, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the project", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.deleteProject(true, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });
    
    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.deleteProject(true, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message[0].should.equal("Project "+ publicproject.handle + " successfully marked as deleted");
                done();
            });
        });
    })
});

describe("[HTML] [POST] /project/:handle/delete", function () {
    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.deleteProject(false, agent, "aRandomProjectHandle", function (err, res) {
                res.statusCode.should.equal(404);
                res.body.message.should.equal("Unable to find project with handle : aRandomProjectHandle");
                done();
            });
        });
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.deleteProject(false, agent, publicprojectHTMLTests.handle, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a project created by demouser1", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.deleteProject(false, agent, publicprojectHTMLTests.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        });
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the project", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.deleteProject(false, agent, publicprojectHTMLTests.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        });
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.deleteProject(false, agent, publicprojectHTMLTests.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.not.contain("<p>Please log into the system.</p>");
                done();
            });
        });
    })
});

describe("[JSON] [POST] /project/:handle/undelete", function () {
    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.undeleteProject(true, agent, "ARandomProject", function (err, res) {
                res.statusCode.should.equal(404);
                res.body.message.should.equal("Unable to find project with handle : " + "ARandomProject");
                done();
            });
        })
    });

    it("Should give an error message when a project is not deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.undeleteProject(true, agent, privateProject.handle, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message[0].should.not.contain("Project " + privateProject.handle + " successfully recovered");
                done();
            });
        })
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.undeleteProject(true, agent, publicproject.handle, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a project created by demouser1 that is currently deleted", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.undeleteProject(true, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                done();
            });
        })
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete the project that is currently deleted", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.undeleteProject(true, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                done();
            });
        })
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete the project that is currently deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.undeleteProject(true, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.message[0].should.equal("Project " + publicproject.handle + " successfully recovered");
                done();
            });
        })
    })
});

describe("[HTML] [POST] /project/:handle/undelete", function () {

    it("Should give an error message when a project does not exist", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.undeleteProject(false, agent, "ARandomProject", function (err, res) {
                res.statusCode.should.equal(404);
                res.body.message.should.equal("Unable to find project with handle : " + "ARandomProject");
                done();
            });
        })
    });

    it("Should give an error message when a project is not deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.undeleteProject(false, agent, privateProject.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">");
                done();
            });
        })
    });

    it("Should give an error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.undeleteProject(false, agent, publicproject.handle, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a project created by demouser1 that is currently deleted", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.undeleteProject(false, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        })
    });

    it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete the project that is currently deleted", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.undeleteProject(false, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        })
    });

    it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete the project that is currently deleted", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.undeleteProject(false, agent, publicproject.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">");
                res.text.should.not.contain("<p>Please log into the system.</p>");
                done();
            });
        })
    })
});
*/

//PROJECT LEVEL MKDIR TESTS
describe("[POST] /project/:handle?mkdir " + publicproject.handle, function () {

    it("Should give an error if an invalid project is specified, even if the user is logged in as a creator or collaborator on the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, "invalidProjectHandle", folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error if the request for this route is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(false, agent, publicproject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("HTML Request not valid for this route.");
                done();
            });
        });
    });


    it("Should give an error when the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser3(not a collaborator nor creator in a project by demouser1)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should create the folder with success if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.result.should.equal("ok");
                done();
            });
        });
    });

    it("Should create the folder with success if the user is logged in as demouser2(a collaborator of the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.result.should.equal("ok");
                done();
            });
        });
    });

    it("Should give an error if an invalid name is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, "thisIsAn*InvalidFolderName", function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.equal("invalid file name specified");
                done();
            });
        });
    });
});

describe("[POST] /project/:handle?mkdir " + metadaOnlyProject.handle, function () {

    it("Should give an error if an invalid project is specified, even if the user is logged in as a creator or collaborator on the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, "invalidProjectHandle", folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error if the request for this route is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(false, agent, metadaOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("HTML Request not valid for this route.");
                done();
            });
        });
    });


    it("Should give an error when the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createFolderInProjectRoot(true, agent, metadaOnlyProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser3(not a collaborator nor creator in a project by demouser1)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, metadaOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should create the folder with success if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, metadaOnlyProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.result.should.equal("ok");
                done();
            });
        });
    });

    it("Should create the folder with success if the user is logged in as demouser2(a collaborator of the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, metadaOnlyProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.result.should.equal("ok");
                done();
            });
        });
    });

    it("Should give an error if an invalid name is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, metadaOnlyProject.handle, "this*IsAnInvalidFolderName", function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.equal("invalid file name specified");
                done();
            });
        });
    });
});

describe("[POST] /project/:handle?mkdir " + privateProject.handle, function () {

    it("Should give an error if an invalid project is specified, even if the user is logged in as a creator or collaborator on the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, "invalidProjectHandle", folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error if the request for this route is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(false, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                res.body.message.should.equal("HTML Request not valid for this route.");
                done();
            });
        });
    });


    it("Should give an error when the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createFolderInProjectRoot(true, agent, privateProject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser3(not a collaborator nor creator in a project by demouser1)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should create the folder with success if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, privateProject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.result.should.equal("ok");
                done();
            });
        });
    });

    it("Should create the folder with success if the user is logged in as demouser2(a collaborator of the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, privateProject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.result.should.equal("ok");
                done();
            });
        });
    });

    it("Should give an error if an invalid name is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, privateProject.handle, "this*IsAnInvalidFolderName", function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.equal("invalid file name specified");
                done();
            });
        });
    });
});


/*
describe("[GET] /project/:handle?recent_changes", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)
    //TODO WITH LIMIT AND OFFSET

    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should give the project changes if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            //jsonOnly, agent, projectHandle, cb
            projectUtils.getProjectRecentChanges(true, agent, publicproject.handle, function (err, res) {
                res.should.have.status(200);
                done();
            });
        });
    });

    it("Should give the project changes if the user is logged in as demouser3(a collaborator on the project)", function (done) {
        done(1);
    });
});

describe("[GET] /project/:handle?version", function () {
    //TODO API ONLY
    //TODO make a request to HTML, should return invalid request
    //TODO test all three types of project accesses (public, private, metadata only)
    
    it("Should give an error if the user is unauthenticated", function (done) {
        done(1);
    });

    it("Should give an error if the project does not exist", function (done) {
        done(1);
    });

    it("Should give an error if the user is logged in as demouser2(not a collaborator nor creator of the project)", function (done) {
        done(1);
    });

    it("Should give the resource versions if the resource exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
        //jsonOnly, agent, projectHandle, cb
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getProjectVersion(true, agent, publicproject.handle, 0, function (err, res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    it("Should give the resource versions if the resource exists and if the user is logged in as demouser3(a collaborator on the project)", function (done) {
        done(1);
    });

    it("Should give an error if the descriptors in the resource version are locked for alterations", function (done) {
        done(1);
    })
});
*/

//OLD ITERATION OF TESTS GOES HERE
/*
describe('/projects', function () {
    it('lists all projects when not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.listAllProjects(agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('All projects');
            done();
        });
    });

    it('lists all projects when logged in', function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.listAllProjects(agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('All projects');
                done();
            });
        })
    });

});

describe('/projects/my', function () {

    it('HTML does not list my projects when not logged in', function (done) {
         var app = GLOBAL.tests.app;
         var agent = chai.request.agent(app);

        projectUtils.listAllMyProjects(false, agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please log into the system.');
            done();
        });
    });

    it('API does not list my projects when not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.listAllMyProjects(true, agent, function (err, res) {
            res.should.have.status(401);
            JSON.parse(res.text).message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });

    before(function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            GLOBAL.tests.agent = agent;
            done();
        })
    });

    it('API lists all my projects logged in', function (done) {
        var agent = GLOBAL.tests.agent;
        projectUtils.listAllMyProjects(true, agent, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).projects.should.be.instanceOf(Array);
            done();
        });
    });

    it('HTML-only lists all my projects logged in', function (done) {
        var agent = GLOBAL.tests.agent;
        projectUtils.listAllMyProjects(false, agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Your projects');
            done();
        });
    });
});

describe('/projects/new GET', function () {

    it('not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.getNewProjectPage(agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please log into the system.');
            done();
        });
    });


    it('logged in', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getNewProjectPage(agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Create a new project');
                done();
            });
        });
    });

});
*/

/*describe('/project/'+require("../mockdata/projects/public_project.js").handle, function () {
    var folderData = require("../mockdata/folders/folder.js");
    var folderName = folderData.name;
    var targetFolderInProject = folderData.pathInProject;

    var projectData = require("../mockdata/projects/public_project.js");
    var publicProjectHandle = projectData.handle;

    it('API create public project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(true, agent, projectData, function (err, res) {
            res.should.have.status(401);
            res.body.message.should.equal('Action not permitted. You are not logged into the system.');
            done();
        });
    });

    it('HTML create public project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(false, agent, projectData, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please log into the system.');
            done();
        });
    });


    it('API create public project '+projectData.handle+' while authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
            projectUtils.createNewProject(true, agent, projectData, function (err, res) {

                //ignore redirection, make new request
                if (err) return done(err);
                res.should.have.status(200);

                projectUtils.listAllMyProjects(true, agent, function (err, res) {
                    res.should.have.status(200);
                    res.body.projects.should.be.instanceOf(Array);
                    done();
                });
            });
        });
    });

    it('HTML create public project authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        var projectData2 = JSON.parse(JSON.stringify(projectData));
        projectData2.handle = projectData2.handle + "viahtml"

        userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
            projectUtils.createNewProject(false, agent, projectData2, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(projectData2.handle);
                done();
            });
        });
    });


    it('API view public project of demouser1 not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).title.should.equal(projectData.title);
            done();
        });
    });

    it('HTML view public project of demouser1 not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain(publicProjectHandle);
            res.text.should.not.contain('Edit mode');
            done();
        });
    });


    it('API view public project authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML view public project authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(publicProjectHandle);
                res.text.should.contain('Edit mode');
                done();
            });
        });
    });

     it('API view public project created by demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
         var app = GLOBAL.tests.app;
         userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
             projectUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
                 //ignore redirection, make new request
                 if (err) return done(err);
                 res.should.have.status(200);

                 JSON.parse(res.text).title.should.equal(projectData.title);
                 done();
             });
         });
     });

    it('HTML-only view public project created by demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            projectUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(publicProjectHandle);
                res.text.should.not.contain('Edit mode');
                done();
            });
        });
    });


    it('API, create folder not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });


    it('HTML, create folder not logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('HTML, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('folderName');
                done();
            });
        });
    });


    it('API, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '1', publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, create folder logged in again', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName+'2', publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, logged in creator see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getProjectRootContent(true, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.body.length.should.equal(3);
                done();
            });
        });
    });


    it('API, not logged see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.getProjectRootContent(true, agent, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.body.length.should.equal(3);
            done();
        });
    });

    it('API, logged in demouser2 see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            projectUtils.getProjectRootContent(true, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.body.length.should.equal(3);
                done();
            });
        });
    });

    it('API, creator should see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, creator should see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);

                var jsdom = require('jsdom').jsdom;
                var document = jsdom(res.text, {});
                if(document.querySelector('ol.breadcrumb li:last-of-type') == null)
                {
                    done(1);
                }
                else
                {
                    document.querySelector('ol.breadcrumb li:last-of-type').textContent.should.equal(folderName);
                    done();
                }
            });
        });
    });

    it('API, not logged in see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).title.should.equal(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(200);

            var jsdom = require('jsdom').jsdom;
            var document = jsdom(res.text, {});
            document.querySelector('ol.breadcrumb li:last-of-type').textContent.should.equal(folderName);
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);

                var jsdom = require('jsdom').jsdom;
                var document = jsdom(res.text, {});
                document.querySelector('ol.breadcrumb li:last-of-type').textContent.should.equal(folderName);
                done();
            });
        });
    });


});*/

/*
describe('/project/'+require("../mockdata/projects/metadata_only_project.js").handle, function () {
    var folderData = require("../mockdata/folders/folder.js");
    var folderName = folderData.name;
    var targetFolderInProject = folderData.pathInProject;

    var projectData = require("../mockdata/projects/metadata_only_project.js");
    var metadataProjectHandle = projectData.handle;


    it('API create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(true, agent, projectData, function (err, res) {
            res.should.have.status(401);
            res.body.message.should.equal('Action not permitted. You are not logged into the system.');
            done();
        });
    });

    it('HTML create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(false, agent, projectData, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please log into the system.');
            done();
        });
    });


    it('API create project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
            projectUtils.createNewProject(true, agent, projectData, function (err, res) {
                res.should.have.status(200);
                res.body.projects.should.be.instanceOf(Array);
                done();
            });
        });
    });

    it('HTML create project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        projectData.handle = metadataProjectHandle + '2';
        userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
            projectUtils.createNewProject(false, agent, projectData, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(projectData.handle);
                done();
            });
        });
    });


    it('API view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).title.should.equal(projectData.title);
            done();
        });
    });

    it('HTML view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain(metadataProjectHandle);
            res.text.should.not.contain('Edit mode');
            done();
        });
    });

    it('API view project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML view project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(metadataProjectHandle);
                res.text.should.contain('Edit mode');
                done();
            });
        });
    });

    it('API view metadata only project of demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            projectUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML-only view metadata only project of demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            projectUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(metadataProjectHandle);
                res.text.should.not.contain('Edit mode');
                done();
            });
        });
    });

    //FOLDERS HERE

    it('API, create folder not logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });


    it('HTML, create folder not logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('HTML, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('folderName');
                done();
            });
        });
    });


    it('API, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '1', metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in again', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '2', metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, logged in creator see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getProjectRootContent(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.body.length.should.equal(3);
                done();
            });
        });
    });


    it('API, not logged see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.getProjectRootContent(true, agent, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.body.length.should.equal(3);
            done();
        });
    });

    it('API, logged in demouser2 see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            projectUtils.getProjectRootContent(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.body.length.should.equal(3);
                done();
            });
        });
    });

    it('API, creator see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, creator see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);

                var jsdom = require('jsdom').jsdom;
                var document = jsdom(res.text, {});
                document.querySelector('ol.breadcrumb li:last-of-type').textContent.should.equal(folderName);
                done();
            });
        });
    });

    it('API, not logged in see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(401);
            JSON.parse(res.text).message.should.equal("Permission denied : cannot show the resource because you do not have permissions to access this project.");
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(401);
                JSON.parse(res.text).message.should.equal("Permission denied : cannot show the resource because you do not have permissions to access this project.");
                done();
            });
        });
    });

    it('HTML, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('Please sign in');
                done();
            });
        });
    });

});

describe('/project/'+require("../mockdata/projects/private_project.js").handle, function () {

    var folderData = require("../mockdata/folders/folder.js");
    var folderName = folderData.name;
    var targetFolderInProject = folderData.pathInProject;

    var projectData = require("../mockdata/projects/private_project.js");
    var privateProjectHandle = projectData.handle;


    it('API create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(true, agent, projectData, function (err, res) {
            res.should.have.status(401);
            res.body.message.should.equal('Action not permitted. You are not logged into the system.');
            done();
        });
    });

    it('HTML create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createNewProject(false, agent, projectData, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please log into the system.');
            done();
        });
    });


    it('API create project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
            projectUtils.createNewProject(true, agent, projectData, function (err, res) {
                res.should.have.status(200);
                res.body.projects.should.be.instanceOf(Array);
                done();
            });
        });
    });

    it('HTML create project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        projectData.handle = privateProjectHandle + '2';
        userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
            projectUtils.createNewProject(false, agent, projectData, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(projectData.handle);
                done();
            });
        });
    });


    it('API view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.viewProject(true, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            JSON.parse(res.text).result.should.equal('error');
            done();
        });
    });

    it('HTML view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.viewProject(false, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain(privateProjectHandle);
            done();
        });
    });


    it('API view project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.viewProject(true, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML view project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.viewProject(false, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(privateProjectHandle);
                done();
            });
        });
    });

    it('API view project authenticated other user', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            projectUtils.viewProject(true, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                JSON.parse(res.text).result.should.equal('error');
                done();
            });
        });
    });

    it('HTML view project authenticated other user', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            projectUtils.viewProject(false, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain(privateProjectHandle);
                done();
            });
        });
    });

    it('API, create folder not logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });


    it('HTML, create folder not logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('HTML, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('folderName');
                done();
            });
        });
    });


    it('API, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '1', privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in again', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '2', privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, logged in creator see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.getProjectRootContent(true, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.body.length.should.equal(3);
                done();
            });
        });
    });


    it('API, not logged see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.getProjectRootContent(true, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });

    it('API, logged in demouser2 see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            projectUtils.getProjectRootContent(true, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('API, creator see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, creator see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            folderUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);

                var jsdom = require('jsdom').jsdom;
                var document = jsdom(res.text, {});
                document.querySelector('ol.breadcrumb li:last-of-type').textContent.should.equal(folderName);
                done();
            });
        });
    });

    it('API, not logged in see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            res.text.should.not.contain(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        folderUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain(folderName);
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                res.text.should.not.contain(folderName);
                done();
            });
        });
    });

    it('HTML, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser2', demouser2.password, function (err, agent) {
            folderUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain(folderName);
                done();
            });
        });
    });



    it('API not authenticated get metatada recommendations for project', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.getMetadataRecomendationsForProject(true, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });

    it('HTML not authenticated get metatada recommendations for project', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.getMetadataRecomendationsForProject(false, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });

    it('API demouser2 get metatada recommendations for project', function (done) {
        this.timeout(5000);
        userUtils.loginUser('demouser2', demouser2.password, function (err, newAgent) {
            projectUtils.getMetadataRecomendationsForProject(true, newAgent, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('HTML demouser2 get metatada recommendations for project', function (done) {
        this.timeout(5000);
        userUtils.loginUser('demouser2', demouser2.password, function (err, newAgent) {
            projectUtils.getMetadataRecomendationsForProject(false, newAgent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain(privateProjectHandle);
                done();
            });
        });
    });
    
    it('API, wrong route for update metadata', function (done) {
        this.timeout(5000);
        var metadata = {
                creator : "http://" + Config.host + "/user/demouser1",
                title : 'This is a test project privado e alterado',
                description : 'This is a test privado e alterado project description',
                publisher: 'UP',
                language: 'En',
                coverage: 'Porto',
                handle : privateProjectHandle,
                privacy: 'private'
        };
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, newAgent) {
            projectUtils.updateMetadataWrongRoute(true, newAgent, privateProjectHandle, metadata, function (err, res) {
                res.should.have.status(404);
                res.text.should.not.contain(privateProjectHandle);
                done();
            });
        });
    });


    it('API, correct route for update metadata', function (done) {
        var folderData = require("../mockdata/folders/folder.js");
        var folderName = folderData.name;
        var targetFolderInProject = folderData.pathInProject;

        var folderPath = targetFolderInProject + folderName;
        var path = '/project/' + privateProjectHandle + '/data/'  + folderPath;
        var metadata = [{"uri":"http://purl.org/dc/terms/creator","prefix":"dcterms","ontology":"http://purl.org/dc/terms/","shortName":"creator","prefixedForm":"dcterms:creator","type":1,"control":"url_box","label":"Creator","comment":"An entity primarily responsible for making the resource.","just_added":true,"value":"This is the creator","recommendedFor":"http://" + Config.host + path}, {"uri":"http://xmlns.com/foaf/0.1/surname","prefix":"foaf","ontology":"http://xmlns.com/foaf/0.1/","shortName":"surname","prefixedForm":"foaf:surname","type":3,"control":"input_box","label":"Surname","comment":"The surname of some person.","recommendation_types":{},"$$hashKey":"object:145","just_added":true,"added_from_manual_list":true,"rankingPosition":7,"interactionType":"accept_descriptor_from_manual_list","recommendedFor":"http://" + Config.host + path,"value":"surname lindo"}, {"uri":"http://xmlns.com/foaf/0.1/givenname","prefix":"foaf","ontology":"http://xmlns.com/foaf/0.1/","shortName":"givenname","prefixedForm":"foaf:givenname","type":3,"control":"input_box","label":"Given name","comment":"The given name of some person.","value":"lindo nome","recommendedFor":"http://" + Config.host + path,"value":"surname lindo"}];

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, newAgent) {
            //jsonOnly, agent, projectHandle, metadata, cb
            projectUtils.updateMetadataCorrectRoute(true, newAgent, privateProjectHandle, folderPath, metadata, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain(privateProjectHandle);
                done();
            });
        });
    });


    it('API, get metadata for a folder', function (done) {
        this.timeout(5000);
        var folderPath = targetFolderInProject + folderName;

        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, newAgent) {
            //jsonOnly, agent, projectHandle, folderPath
            projectUtils.getResourceMetadata(true, newAgent, privateProjectHandle, folderPath, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).descriptors.length.should.be.equal(3);
                done();
            });
        });
    });


    it('API, remove title descriptor', function (done) {
        this.timeout(5000);
        var folderPath = targetFolderInProject + folderName;
        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, newAgent) {
            //jsonOnly, agent, projectHandle, folderPath
            projectUtils.removeDescriptorFromFolder(true, newAgent, privateProjectHandle, folderPath, 'dcterms:creator', function (error, res) {
                res.should.have.status(200);
                res.body.message.should.equal('Updated successfully.');
                projectUtils.getResourceMetadata(true,  newAgent, privateProjectHandle, folderPath, function (newError, response) {
                    response.should.have.status(200);
                    JSON.parse(response.text).descriptors.length.should.be.equal(2);
                    done();
                });
            });
        });
    });


    it('API, add descriptor to a children folder, after that "ls" the parent folder and check that the children is still shown.', function (done) {
        this.timeout(5000);
        var folder2Name = 'outraPastinhaLinda';
        var folderPath = folder2Name;
        var path = '/project/' + privateProjectHandle + '/data/'  + folderPath;
        var metadata = [{"uri":"http://purl.org/dc/terms/creator","prefix":"dcterms","ontology":"http://purl.org/dc/terms/","shortName":"creator","prefixedForm":"dcterms:creator","type":1,"control":"url_box","label":"Creator","comment":"An entity primarily responsible for making the resource.","just_added":true,"value":"This is the creator","recommendedFor":"http://" + Config.host + path}, {"uri":"http://xmlns.com/foaf/0.1/surname","prefix":"foaf","ontology":"http://xmlns.com/foaf/0.1/","shortName":"surname","prefixedForm":"foaf:surname","type":3,"control":"input_box","label":"Surname","comment":"The surname of some person.","recommendation_types":{},"$$hashKey":"object:145","just_added":true,"added_from_manual_list":true,"rankingPosition":7,"interactionType":"accept_descriptor_from_manual_list","recommendedFor":"http://" + Config.host + path,"value":"surname lindo"}, {"uri":"http://xmlns.com/foaf/0.1/givenname","prefix":"foaf","ontology":"http://xmlns.com/foaf/0.1/","shortName":"givenname","prefixedForm":"foaf:givenname","type":3,"control":"input_box","label":"Given name","comment":"The given name of some person.","value":"lindo nome","recommendedFor":"http://" + Config.host + path,"value":"surname lindo"}];

        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, newAgent) {
            //http://127.0.0.1:3001/project/testproject/data/folder1?mkdir=folder3
            folderUtils.createFolderInProject(true, newAgent, targetFolderInProject, folder2Name, privateProjectHandle, function (err, res) {
                projectUtils.updateMetadataCorrectRoute(true, newAgent, privateProjectHandle, folderPath, metadata, function (err, res) {
                    res.should.have.status(200);
                    projectUtils.getResourceMetadata(true,  newAgent, privateProjectHandle, folderPath, function (newError, response) {
                        response.should.have.status(200);
                        JSON.parse(response.text).descriptors.length.should.be.equal(3);
                        projectUtils.getProjectRootContent(true, newAgent, privateProjectHandle, function (err, res) {
                            res.should.have.status(200);
                            res.text.should.contain(folderPath);
                            done();
                        });
                    });
                });
            });
        });
    });

    it('API, try to change locked descriptors', function (done) {
        //TODO what is the route for this???
        //TODO @silvae86 says: try to edit the ddr:password on a user, try to edit dcterms:modified on a folder or file (see more "locked" descriptors on elements.js)
        done();
    });

});
*/