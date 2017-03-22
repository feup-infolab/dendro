process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);

let should = chai.should();

let agent = null;

let demouser1 = require("../mockdata/users/demouser1.js");
let demouser2 = require("../mockdata/users/demouser2.js");

describe('/login', function () {
    it('should show the login page', function (done) {
        const app = GLOBAL.tests.app;
        chai.request(app)
            .get('/login')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.contain('Please sign in');
                done();
            });
    });

    it('should not login the demo user when wrong password is provided', function (done) {
        const app = GLOBAL.tests.app;
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
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);

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
        const agent = GLOBAL.tests.agent;

        agent
            .get('/logout')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.include('Successfully logged out');
                done();
            });
    });

    /**
     * HTML logins and logouts
     */
    
    it('[HTML] should not logout an authenticated user', function (done) {
        //TODO
        done();
    });

    it('[HTML] should login ' + demouser1.username, function (done) {
        //TODO 
        done();
    });

    it('[HTML] logout the ' + demouser1.username + " user if correctly authenticated.", function (done) {
        //TODO
        done();
    });

    it('[HTML] should login ' + demouser1.username + " while " + demouser2.username + " is logged in, replacing it", function (done) {
        //TODO
        done();
    });

    it('[HTML] should login ' + demouser1.username + " while " + demouser2.username + " is logged in, replacing it", function (done) {
        //TODO
        done();
    });

    /**
     * API logins and logouts
     */
    it('[API] should not logout an authenticated user', function (done) {
        //TODO
        done();
    });

    it('[API] should login ' + demouser1.username, function (done) {
        //TODO
        done();
    });

    it('[API] logout the ' + demouser1.username + " user if authenticated as " + demouser1.username, function (done) {
        //TODO
        done();
    });

    it('[API] should login ' + demouser1.username + " while " + demouser2.username + " is logged in, replacing it", function (done) {
        //TODO
        done();
    });

    it('[API] should login ' + demouser1.username + " while " + demouser2.username + " is logged in, replacing it", function (done) {
        //TODO
        done();
    });
});



