process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var should = chai.should();

describe('/projects', function () {
    it('lists all projects', function (done) {
        var app = GLOBAL.tests.app;
        chai.request(app)
            .get('/projects')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.contain('Projects');
                done();
            });
    });
});


describe('/createProject public', function () {
    it('create a project', function (done) {
        var projectData = {
            //http://127.0.0.1:3001/user/demouser1
            dcterms : {
                creator : "http://" + Config.host + "/user/demouser1",
                title : 'This is a test project',
                description : 'This is a test project description',
                publisher: 'UP',
                language: 'En',
                coverage: 'Porto'
            },
            ddr : {
                handle : 'testinhofixe1234',
                privacyStatus: 'public'
            }
        };
        var app = GLOBAL.tests.app;
        chai.request(app)
            .post('/projects/new')
            .send(projectData)
            .end((err, res) => {
                //TODO check status
                //console.log(res);
            });
    });
});
