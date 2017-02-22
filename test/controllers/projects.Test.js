process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var async = require('async');
chai.use(chaiHttp);

var should = chai.should();

describe('/projects', function () {
    it('lists all projects', function (done) {
        var agent = GLOBAL.tests.agent;

        agent
            .get('/projects')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.contain('Projects');
                done();
            });
    });
});


describe('/createProject public access', function () {
    var publicProjectHandle = 'testprojectpublichandle';
    var agent;
    before(function (done) {
        //login here
        var app = GLOBAL.tests.app;
        //var agent = chai.request.agent(app);
        agent = chai.request.agent(app);

        //GLOBAL.tests.agent = agent;

        agent
            .post('/login')
            .send({'username': 'demouser1', 'password': 'demouserpassword2015'})
            .end((err, res) => {
                GLOBAL.tests.agent = agent;
                res.should.have.status(200);
                //res.text.should.include('Your projects');
                done();
        });
    });

    /*after(function(done) {
        //var agent = GLOBAL.tests.agent;

        agent
            .get('/logout')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include('Successfully logged out');
                done();
             });
    });*/

    it('create a project', function (done) {
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
        var app = GLOBAL.tests.app;
        //var agent = GLOBAL.tests.agent;
        //chai.request(app)
        agent
            .post('/projects/new')
            .send(projectData)
            .end((err, res) => {
                //TODO check status
                res.should.have.status(200);
                res.text.should.include(publicProjectHandle);
                console.log('project was created');
                done();
            });
    });

    it('Logged in creator View the created public project', function (done) {
        this.timeout(20000);
        //var app = GLOBAL.tests.app;
        var app = GLOBAL.tests.app;
        //var agent = GLOBAL.tests.agent;
        //chai.request(app)
        agent
            .get('/project/' + publicProjectHandle)
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include(publicProjectHandle);
                console.log('trying to view project');
                done();
            });
    });


    it('Not Logged in, View the created public project', function (done) {
        var app = GLOBAL.tests.app;

        //var agent = GLOBAL.tests.agent;

        agent
            .get('/logout')
            .end((err, res) => {
                //chai.request(app)
                agent
                .get('/project/' + publicProjectHandle)
                .end((err, res) => {
                        res.should.have.status(200);
                        res.text.should.include(publicProjectHandle);
                        done();
                });
            });
    });


    it('A user not collaborator is Logged in, View the created public project', function (done) {
        this.timeout(20000);
        var app = GLOBAL.tests.app;

        //var agent = GLOBAL.tests.agent;

        agent
            .post('/login')
            .send({'username': 'demouser2', 'password': 'demouserpassword2015'})
            .end((err, res) => {
                //chai.request(app)
                agent
                .get('/project/' + publicProjectHandle)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.text.should.include(publicProjectHandle);
                    done();
                });
            });
    });

});

describe('/createProject metadata_only access', function () {
    var metadataonlyProjectHandle = 'metadataonlyprojectchandle';
    before(function (done) {
        //login here
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        //GLOBAL.tests.agent = agent;

        agent
            .post('/login')
            .send({'username': 'demouser1', 'password': 'demouserpassword2015'})
            .end((err, res) => {
                res.should.have.status(200);
                //res.text.should.include('Your projects');
                GLOBAL.tests.agent = agent;
                done();
            });
    });

    /*after(function(done) {
        var agent = GLOBAL.tests.agent;

        agent
            .get('/logout')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include('Successfully logged out');
                done();
            });
    });*/

    it('create a project', function (done) {
        this.timeout(20000);
        var projectData = {
            creator : "http://" + Config.host + "/user/demouser1",
            title : 'This is a test project',
            description : 'This is a test project description',
            publisher: 'UP',
            language: 'En',
            coverage: 'Porto',
            handle : metadataonlyProjectHandle,
            privacy: 'metadata_only'
        };
        var app = GLOBAL.tests.app;
        var agent = GLOBAL.tests.agent;
        //chai.request(app)
        agent
            .post('/projects/new')
            .send(projectData)
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include(metadataonlyProjectHandle);
                console.log('project was created');
                done();
            });
    });

    it('Logged in creator View the created metadata_only project', function (done) {
        var app = GLOBAL.tests.app;
        var agent = GLOBAL.tests.agent;
        //chai.request(app)
        agent
            .get('/project/' + metadataonlyProjectHandle)
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include(metadataonlyProjectHandle);
                console.log('trying to view project');
                done();
            });
    });


    it('Not Logged in, View the created metadataonly project', function (done) {
        this.timeout(20000);
        var app = GLOBAL.tests.app;

        var agent = GLOBAL.tests.agent;

        agent
            .get('/logout')
            .end((err, res) => {
                //chai.request(app)
                agent
                .get('/project/' + metadataonlyProjectHandle)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
            });
    });


    it('A user not collaborator is Logged in, View the created metadata_only project', function (done) {
        this.timeout(20000);
        var app = GLOBAL.tests.app;
        //var agent = chai.request.agent(app);
        var agent = GLOBAL.tests.agent;

        //GLOBAL.tests.agent = agent;

        agent
            .post('/login')
            .send({'username': 'demouser2', 'password': 'demouserpassword2015'})
            .end((err, res) => {
                //chai.request(app)
                agent
                .get('/project/' + metadataonlyProjectHandle)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.include(metadataonlyProjectHandle);
                    console.log('Im HERE AT LOGIN');
                    done();
                });
            });
    });

});


describe('/createProject private access', function () {
    var privateProjectHandle = 'privateprojectchandle';
    before(function (done) {
        //login here
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        //GLOBAL.tests.agent = agent;

        agent
            .post('/login')
            .send({'username': 'demouser1', 'password': 'demouserpassword2015'})
            .end((err, res) => {
                res.should.have.status(200);
                GLOBAL.tests.agent = agent;
                //res.text.should.include('Your projects');
                done();
            });
    });

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

    it('create a project', function (done) {
        this.timeout(20000);
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
        var app = GLOBAL.tests.app;
        var agent = GLOBAL.tests.agent;
        //chai.request(app)
        agent
            .post('/projects/new')
            .send(projectData)
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include(privateProjectHandle);
                console.log('project was created');
                done();
            });
    });

    it('Logged in creator View the created private project', function (done) {
        var app = GLOBAL.tests.app;
        var agent = GLOBAL.tests.agent;
        //chai.request(app)
        agent
            .get('/project/' + privateProjectHandle)
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include(privateProjectHandle);
                console.log('trying to view project');
                done();
            });
    });


    it('Not Logged in, View the created private project', function (done) {
        this.timeout(20000);
        var app = GLOBAL.tests.app;

        //var agent = GLOBAL.tests.agent;

        /*
        agent
            .get('/logout')
            .end((err, res) => {
            agent
            .get('/project/' + privateProjectHandle)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.include('Error trying to access a project');
                    done();
                });
            });

        */
        chai.request(app)
            .get('/project/' + privateProjectHandle)
            .end((err, response) => {
                response.should.have.status(200);
                response.text.should.not.include(privateProjectHandle);
                done();
            });
    });


    it('A user not collaborator is Logged in, View the created private project', function (done) {
        this.timeout(20000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        //var agent = GLOBAL.tests.agent;

        //GLOBAL.tests.agent = agent;


        agent
            .post('/login')
            .send({'username': 'demouser2', 'password': 'demouserpassword2015'})
            .end((err, res) => {
                agent
                .get('/project/' + privateProjectHandle)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.text.should.not.include(privateProjectHandle);
                    done();
                });
            });

    });

});
