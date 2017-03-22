process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const db = function() { return GLOBAL.db.default; }();
const db_social = function() { return GLOBAL.db.social; }();
const db_notifications = function () { return GLOBAL.db.notifications;}();
const async = require('async');
const projectUtils = require('./../utils/project/projectUtils.js');
chai.use(chaiHttp);
const should = chai.should();

const userUtils = require('./../utils/user/userUtils.js');

const demouser1 = require("../mockdata/users/demouser1");
const demouser2 = require("../mockdata/users/demouser2");
const demouser3 = require("../mockdata/users/demouser3");

describe('/users', function () {

    it('[HTML] should fetch the registration page', function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getRegisterUser(false, agent, function (err, agent) {
            res.should.have.status(200);
            res.text.should.contain('Editing user');
            done();
        });
    });

    it('[HTML] should register the ' + demouser1.username + " user", function (done) {
        //TODO
        done();
    });

    it('[HTML] should not be able to register the ' + demouser1.username + " user because it was already registered", function (done) {
        //TODO
        done();
    });

    it('[HTML] should register the ' + demouser2.username + " user because it does not exist.", function (done) {
        //TODO
        done();
    });

    it('[API] should register the ' + demouser3.username + " user", function (done) {
        //TODO
        done();
    });

    it('[API] should not be able to register the ' + demouser3.username + " user because it was already registered", function (done) {
        //TODO
        done();
    });

    it('API /me  with authenticated used', function (done) {
        const app = GLOBAL.tests.app;
        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            userUtils.getLoggedUserDetails(true, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Editing user');
                done();
            });
        })
    });


    it('HTML /me  with authenticated used', function (done) {
        const app = GLOBAL.tests.app;
        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            userUtils.getLoggedUserDetails(false, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Editing user');
                done();
            });
        })
    });


    it('API /me  not authenticated', function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getLoggedUserDetails(true, agent, function (err, res) {
            res.should.have.status(401);
            res.text.should.not.contain('Editing user');
            done();
        });
    });

    it('HTML /me  not authenticated', function (done) {
        const app = GLOBAL.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getLoggedUserDetails(false, agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain('Editing user');
            done();
        });
    });
});
