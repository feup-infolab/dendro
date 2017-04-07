process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var should = chai.should();

var agent = null;

var demouser1 = require("../mockdata/users/demouser1.js");

describe('/login', function () {
    it('should show the login page', function (done) {
        var app = GLOBAL.tests.app;
        chai.request(app)
            .get('/login')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.contain('Please sign in');
                done();
            });
    });

    it('should not login the demo user when wrong password is provided', function (done) {
        var app = GLOBAL.tests.app;
        chai.request(app)
            .post('/login')
            .send({'username': demouser1.username, 'password': 'WRONG_PASSWORD'})
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.contain('Please sign in');
                done();
            });
    });

    it('should login the demo user with correct password', function (done) {
        this.timeout(5000);
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);

        GLOBAL.tests.agent = agent;

        agent
            .post('/login')
            .send({'username': demouser1.username, 'password':  demouser1.password })
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include('Your projects');
                done();
            });
    });

    it('should logout the demo user', function (done) {
        var agent = GLOBAL.tests.agent;

        agent
            .get('/logout')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include('Successfully logged out');
                done();
            });
    });
});



