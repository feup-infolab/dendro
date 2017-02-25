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
            JSON.parse(res.text).message.should.equal("Error detected. You are not authorized to perform this operation. You must be signed into Dendro.");
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
            res.text.should.contain('You are not authorized to perform this operation. You must be signed into Dendro.');
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

    it('API create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createNewProject(true, agent, projectData, function (err, res) {
            res.should.have.status(401);
            res.body.message.should.equal('Error detected. You are not authorized to perform this operation. You must be signed into Dendro.');
            done();
        });
    });

    it('HTML create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createNewProject(false, agent, projectData, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('You are not authorized to perform this operation. You must be signed into Dendro.');
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


    it('API view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            JSON.parse(res.text).title.should.equal(publicProjectHandle);
            done();
        });
    });

    it('HTML view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain(publicProjectHandle);
            done();
        });
    });


    it('API view project authenticated', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(publicProjectHandle);
                done();
            });
        });
    });

    it('HTML view project authenticated', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(publicProjectHandle);
                done();
            });
        });
    });

     it('API view project authenticated other user', function (done) {
         this.timeout(5000);
         var app = GLOBAL.tests.app;
         testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
             testUtils.viewProject(true, agent, publicProjectHandle, function (err, res) {
                 res.should.have.status(200);
                 JSON.parse(res.text).title.should.equal(publicProjectHandle);
                 done();
             });
         });
     });

    it('HTML view project authenticated other user', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(false, agent, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(publicProjectHandle);
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
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
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
                res.text.should.equal(folderName);
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
                res.text.should.equal(folderName);
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
            res.text.should.equal(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(false, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.equal(folderName);
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(true, agent, targetFolderInProject, folderName, publicProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.equal(folderName);
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
                res.text.should.equal(folderName);
                done();
            });
        });
    });


});

//TODO edit project not logged in -> error
//TODO edit project logged in -> success
//TODO edit project Logged in other user -> error
//TODO view folder inside project not logged in -> error
//TODO view folder inside project logged in -> success
//TODO view folder inside project logged in other user -> error
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
            res.body.message.should.equal('Error detected. You are not authorized to perform this operation. You must be signed into Dendro.');
            done();
        });
    });

    it('HTML create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createNewProject(false, agent, projectData, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('You are not authorized to perform this operation. You must be signed into Dendro.');
            done();
        });
    });


    it('API create project authenticated', function (done) {
        this.timeout(5000);
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
            JSON.parse(res.text).title.should.equal(metadataProjectHandle);
            done();
        });
    });

    it('HTML view project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain(metadataProjectHandle);
            done();
        });
    });


    it('API view project authenticated', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(metadataProjectHandle);
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
                done();
            });
        });
    });


    it('API view project authenticated other user', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(true, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).title.should.equal(metadataProjectHandle);
                done();
            });
        });
    });

    it('HTML view project authenticated other user', function (done) {
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewProject(false, agent, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain(metadataProjectHandle);
                done();
            });
        });
    });

    //FOLDERS HERE

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
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
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
                res.text.should.equal(folderName);
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
                res.text.should.equal(folderName);
                done();
            });
        });
    });

    it('API, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(401);
            res.text.should.not.equal(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(false, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.equal(folderName);
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(true, agent, targetFolderInProject, folderName, metadataProjectHandle, function (err, res) {
                res.should.have.status(401);
                res.text.should.not.equal(folderName);
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
                res.text.should.not.equal(folderName);
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
        testUtils.createNewProject(true, agent, projectData, function (err, res) {
            res.should.have.status(401);
            res.body.message.should.equal('Error detected. You are not authorized to perform this operation. You must be signed into Dendro.');
            done();
        });
    });

    it('HTML create project not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.createNewProject(false, agent, projectData, function (err, res) {
            res.should.have.status(200);
            res.text.should.contain('You are not authorized to perform this operation. You must be signed into Dendro.');
            done();
        });
    });


    it('API create project authenticated', function (done) {
        this.timeout(5000);
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
                JSON.parse(res.text).title.should.equal(privateProjectHandle);
                done();
            });
        });
    });

    it('HTML view project authenticated', function (done) {
        this.timeout(5000);
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
            testUtils.createFolderInProject(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(200);
                JSON.parse(res.text).result.should.equal('ok');
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
                res.text.should.equal(folderName);
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
                res.text.should.equal(folderName);
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
            res.text.should.not.equal(folderName);
            done();
        });
    });

    it('HTML, not logged in see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        testUtils.viewFolder(false, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.equal(folderName);
            done();
        });
    });

    it('API, logged in other user see the created folder', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        testUtils.loginUser('demouser2', 'demouserpassword2015', function (err, agent) {
            testUtils.viewFolder(true, agent, targetFolderInProject, folderName, privateProjectHandle, function (err, res) {
                res.should.have.status(401);
                res.text.should.not.equal(folderName);
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
                res.text.should.not.equal(folderName);
                done();
            });
        });
    });

});
