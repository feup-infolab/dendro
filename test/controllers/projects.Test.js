process.env.NODE_ENV = 'test';

var chai = require('chai');
chai.use(require('chai-http'));

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var async = require('async');
var projectUtils = require('./../utils/project/projectUtils.js');
var httpUtils = require('./../utils/http/httpUtils.js');

var should = chai.should();

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
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
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
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
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
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.getNewProjectPage(agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Create a new project');
                done();
            });
        });
    });

});


describe('public project', function () {
    var folderName = 'pastinhaLinda';
    var targetFolderInProject = '';
    var publicProjectHandle = 'publicprojectcreatedbydemouser1';
    var projectData = {
        creator : "http://" + Config.host + "/user/demouser1",
        title : 'This is a public test project with handle ' + publicProjectHandle + " and created by demouser1",
        description : 'This is a test project description',
        publisher: 'UP',
        language: 'En',
        coverage: 'Porto',
        handle : publicProjectHandle,
        privacy: 'public'
    };

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
        projectUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
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

        projectUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
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
            done();
        });
    });


    it('API view public project authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML view public project authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(publicProjectHandle);
                done();
            });
        });
    });

     it('API view public project created by demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
         var app = GLOBAL.tests.app;
         projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
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
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(publicProjectHandle);
                done();
            });
        });
    });

    it('API, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, creator should see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, creator should see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
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
        projectUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).title.should.equal(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(200);

            var jsdom = require('jsdom').jsdom;
            var document = jsdom(res.text, {});
            document.querySelector('ol.breadcrumb li:last-of-type').textContent.should.equal(folderName);
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);

                var jsdom = require('jsdom').jsdom;
                var document = jsdom(res.text, {});
                document.querySelector('ol.breadcrumb li:last-of-type').textContent.should.equal(folderName);
                done();
            });
        });
    });


});


describe('metadata_only project', function () {
    var folderName = 'pastinhaLinda';
    var targetFolderInProject = '';
    var metadataProjectHandle = 'metadataonlyprojectcreatedbydemouser1';
    var projectData = {
        creator : "http://" + Config.host + "/user/demouser1",
        title : 'This is a metadata only test project with handle ' + metadataProjectHandle + " and created by demouser1",
        description : 'This is a test project description',
        publisher: 'UP',
        language: 'En',
        coverage: 'Porto',
        handle : metadataProjectHandle,
        privacy: 'metadata_only'
    };


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
        projectUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
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
        projectUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
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
            done();
        });
    });


    it('API view project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML view project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(metadataProjectHandle);
                done();
            });
        });
    });

    it('API view metadata only project of demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML-only view metadata only project of demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(metadataProjectHandle);
                done();
            });
        });
    });

    //FOLDERS HERE

    it('API, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, creator see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, creator see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
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
        projectUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(401);
            JSON.parse(res.text).message.should.equal("Permission denied : cannot show the resource because you do not have permissions to access this project.");
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.equal(folderName);
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(401);
                JSON.parse(res.text).message.should.equal("Permission denied : cannot show the resource because you do not have permissions to access this project.");
                done();
            });
        });
    });

    it('HTML, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.equal(folderName);
                done();
            });
        });
    });

});

describe('private project', function () {
    var folderName = 'pastinhaLinda';
    var targetFolderInProject = '';
    var privateProjectHandle = 'privateprojectcreatedbydemouser1';
    var projectData = {
        creator : "http://" + Config.host + "/user/demouser1",
        title : 'This is a private test project with handle ' + privateProjectHandle + " and created by demouser1",
        description : 'This is a test project description',
        publisher: 'UP',
        language: 'En',
        coverage: 'Porto',
        handle : privateProjectHandle,
        privacy: 'private'
    };

    after(function(done) {
        async.series([
            function (callback) {
                db.connection.deleteGraph(db.graphUri, callback);
            },
            function (callback) {
                db.connection.deleteGraph(db_social.graphUri, callback);
            },
            function (callback) {
                db.connection.deleteGraph(db_notifications.graphUri, callback);
            }
        ], function (err, results) {
            console.log('deleted info from all graphs');
            done();
        });
    });


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
        projectUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
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
        projectUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
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
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(true, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML view project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(false, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(privateProjectHandle);
                done();
            });
        });
    });

    it('API view project authenticated other user', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(true, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                JSON.parse(res.text).result.should.equal('error');
                done();
            });
        });
    });

    it('HTML view project authenticated other user', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewProject(false, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain(privateProjectHandle);
                done();
            });
        });
    });

    it('API, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, creator see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, creator see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
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
        projectUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            res.text.should.not.equal(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.equal(folderName);
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                res.text.should.not.equal(folderName);
                done();
            });
        });
    });

    it('HTML, logged in other user see the created folder', function (done) {
        var app = GLOBAL.tests.app;
        projectUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            projectUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.equal(folderName);
                done();
            });
        });
    });

});
