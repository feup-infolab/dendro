process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var async = require('async');
var testUtils = require('./testUtils.js');
chai.use(chaiHttp);

var should = chai.should();


describe('/projects', function () {
    it('lists all projects when not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.listAllProjects(agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('All projects');
            done();
        });
    });

    it('lists all projects when logged in', function (done) {
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.listAllProjects(agent, function (err, res) {
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

        testUtils.listAllMyProjects(false, agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });

    it('API does not list my projects when not logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.listAllMyProjects(true, agent, function (err, res) {
            res.should.have.status(401);
            res.body.result.should.equal('error');
            done();
        });
    });

    before(function (done) {
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            GLOBAL.tests.agent = agent;
            done();
        })
    });

    it('API lists all my projects logged in', function (done) {
        var agent = GLOBAL.tests.agent;
        testUtils.listAllMyProjects(true, agent, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).projects.should.be.instanceOf(Array);
            done();
        });
    });

    it('HTML-only lists all my projects logged in', function (done) {
        var agent = GLOBAL.tests.agent;
        testUtils.listAllMyProjects(false, agent, function (err, res) {
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
        testUtils.getNewProjectPage(agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('logged in', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.getNewProjectPage(agent, function (err, res) {
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
    var publicProjectHandle = 'testprojectpublichandlenew';
    var projectData = {
        creator : "http://" + Config.host + "/user/demouser1",
        title : 'This is a test project',
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
        testUtils.createNewProject(true, agent, projectData, function (err, res) {
            res.should.have.status(401);
            res.body.result.should.equal('error');
            done();
        });
    });

    it('HTML create public project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createNewProject(false, agent, projectData, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API create public project '+projectData.handle+' while authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
            testUtils.createNewProject(true, agent, projectData, function (err, res) {

                //ignore redirection, make new request
                if (err) return done(err);
                res.should.have.status(200);

                testUtils.listAllMyProjects(true, agent, function (err, res) {
                    res.should.have.status(200);
                    res.body.projects.should.be.instanceOf(Array);
                    done();
                });
            });
        });
    });

    it('HTML create public project authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        projectData.handle = publicProjectHandle + '3';
        this.timeout('5000');
        testUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
            testUtils.createNewProject(false, agent, projectData, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(projectData.handle);
                done();
            });
        });
    });


    it('API view public project of demouser1 not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).title.should.equal(projectData.title);
            done();
        });
    });

    it('HTML view public project of demouser1 not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain(publicProjectHandle);
            res.text.should.not.contain('Edit mode');
            done();
        });
    });


    it('API view public project authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML view public project authenticated as demouser1', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Edit mode');
                done();
            });
        });
    });

     it('API view public project created by demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
         var app = GLOBAL.tests.app;
         testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {

             //ignore redirection, make new request
             if (err) return done(err);
             //res.should.have.status(200);

             testUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
                 res.should.have.status(200);
                 JSON.parse(res.text).title.should.equal(projectData.title);
                 done();
             });
         });
     });

    it('HTML-only view public project created by demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(publicProjectHandle);
                res.text.should.not.contain('Edit mode');
                done();
            });
        });
    });


    it('API, create folder not logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });


    it('HTML, create folder not logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('HTML, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('folderName');
                done();
            });
        });
    });


    it('API, create folder logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '1', publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, create folder logged in again', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName+'2', publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, logged in creator see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.getProjectRootContent(true, agent, publicProjectHandle, function (err, res) {
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
        testUtils.getProjectRootContent(true, agent, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.body.length.should.equal(3);
            done();
        });
    });

    it('API, logged in demouser2 see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.getProjectRootContent(true, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.body.length.should.equal(3);
                done();
            });
        });
    });

    it('API, creator see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, creator see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('Please sign in');
                done();
            });
        });
    });

    it('API, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).title.should.equal(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.equal('Please sign in');
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, logged in other user see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.equal('Please sign in');
                done();
            });
        });
    });


});


describe('metadata_only project', function () {
    var folderName = 'pastinhaLinda';
    var targetFolderInProject = '';
    var metadataProjectHandle = 'testprojectmetadata';
    var projectData = {
        creator : "http://" + Config.host + "/user/demouser1",
        title : 'This is a test project',
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
        testUtils.createNewProject(true, agent, projectData, function (err, res) {
            res.should.have.status(401);
            res.body.result.should.equal('error');
            done();
        });
    });

    it('HTML create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createNewProject(false, agent, projectData, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API create project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
            testUtils.createNewProject(true, agent, projectData, function (err, res) {
                res.should.have.status(200);
                res.body.projects.should.be.instanceOf(Array);
                done();
            });
        });
    });

    it('HTML create project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        projectData.handle = metadataProjectHandle + '2';
        this.timeout('5000');
        testUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
            testUtils.createNewProject(false, agent, projectData, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(projectData.handle);
                done();
            });
        });
    });


    it('API view project not authenticated', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).title.should.equal(projectData.title);
            done();
        });
    });

    it('HTML view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain(metadataProjectHandle);
            res.text.should.not.contain('Edit mode');
            done();
        });
    });

    it('API view project authenticated', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML view project authenticated', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(metadataProjectHandle);
                res.text.should.contain('Edit mode');
                done();
            });
        });
    });

    it('API view metadata only project of demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML-only view metadata only project of demouser1 authenticated as demouser2 (NOT THE CREATOR)', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
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
        testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });


    it('HTML, create folder not logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('HTML, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('folderName');
                done();
            });
        });
    });


    it('API, create folder logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '1', metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in again', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '2', metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, logged in creator see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.getProjectRootContent(true, agent, metadataProjectHandle, function (err, res) {
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
        testUtils.getProjectRootContent(true, agent, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.body.length.should.equal(3);
            done();
        });
    });

    it('API, logged in demouser2 see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.getProjectRootContent(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.body.length.should.equal(3);
                done();
            });
        });
    });

    it('API, creator see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, creator see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('Please sign in');
                done();
            });
        });
    });

    it('API, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).title.should.equal(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain('Please sign in');
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, logged in other user see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('Please sign in');
                done();
            });
        });
    });

});


describe('private project', function () {
    var folderName = 'pastinhaLinda';
    var targetFolderInProject = '';
    var privateProjectHandle = 'testprojectprivate';
    var projectData = {
        creator : "http://" + Config.host + "/user/demouser1",
        title : 'This is a test project',
        description : 'This is a test project description',
        publisher: 'UP',
        language: 'En',
        coverage: 'Porto',
        handle : privateProjectHandle,
        privacy: 'private'
    };


    it('API create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createNewProject(true, agent, projectData, function (err, res) {
            res.should.have.status(401);
            res.body.result.should.equal('error');
            done();
        });
    });

    it('HTML create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createNewProject(false, agent, projectData, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API create project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
            testUtils.createNewProject(true, agent, projectData, function (err, res) {
                res.should.have.status(200);
                res.body.projects.should.be.instanceOf(Array);
                done();
            });
        });
    });

    it('HTML create project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        projectData.handle = privateProjectHandle + '2';
        this.timeout('5000');
        testUtils.loginUser('demouser1','demouserpassword2015', function (err, agent) {
            testUtils.createNewProject(false, agent, projectData, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(projectData.handle);
                done();
            });
        });
    });


    it('API view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewProject(true, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            JSON.parse(res.text).result.should.equal('error');
            done();
        });
    });

    it('HTML view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewProject(false, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain(privateProjectHandle);
            done();
        });
    });


    it('API view project authenticated', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(true, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(projectData.title);
                done();
            });
        });
    });

    it('HTML view project authenticated', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(false, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(privateProjectHandle);
                done();
            });
        });
    });

    it('API view project authenticated other user', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(true, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                JSON.parse(res.text).result.should.equal('error');
                done();
            });
        });
    });

    it('HTML view project authenticated other user', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(false, agent, privateProjectHandle, function (err, res) {
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
        testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });


    it('HTML, create folder not logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('HTML, create folder logged in not a collab', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('folderName');
                done();
            });
        });
    });


    it('API, create folder logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '1', privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('HTML, create folder logged in again', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName + '2', privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
                done();
            });
        });
    });

    it('API, logged in creator see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.getProjectRootContent(true, agent, privateProjectHandle, function (err, res) {
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
        testUtils.getProjectRootContent(true, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });

    it('API, logged in demouser2 see project root content', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.getProjectRootContent(true, agent, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('API, creator see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(folderName);
                done();
            });
        });
    });

    it('HTML, creator see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('Please sign in');
                done();
            });
        });
    });

    it('API, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            res.text.should.not.contain(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain(folderName);
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                res.text.should.not.contain(folderName);
                done();
            });
        });
    });

    it('HTML, logged in other user see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
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
        testUtils.getMetadataRecomendationsForProject(true, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(401);
            done();
        });
    });

    it('HTML not authenticated get metatada recommendations for project', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.getMetadataRecomendationsForProject(false, agent, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('Please sign in');
            done();
        });
    });


    it('API creator get metatada recommendations for project', function (done) {
        this.timeout(5000);
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, newAgent) {
            testUtils.getMetadataRecomendationsForProject(true, newAgent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                done();
            });
        });
    });

    it('HTML creator get metatada recommendations for project', function (done) {
        this.timeout(5000);
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, newAgent) {
            testUtils.getMetadataRecomendationsForProject(false, newAgent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(privateProjectHandle);
                done();
            });
        });
    });

    it('API demouser2 get metatada recommendations for project', function (done) {
        this.timeout(5000);
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, newAgent) {
            testUtils.getMetadataRecomendationsForProject(true, newAgent, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });
    });

    it('HTML demouser2 get metatada recommendations for project', function (done) {
        this.timeout(5000);
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, newAgent) {
            testUtils.getMetadataRecomendationsForProject(false, newAgent, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain(privateProjectHandle);
                done();
            });
        });
    });

});
