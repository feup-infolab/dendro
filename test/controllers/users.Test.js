process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const db = function() { return GLOBAL.db.default; }();
const db_social = function() { return GLOBAL.db.social; }();
const db_notifications = function () { return GLOBAL.db.notifications;}();
const async = require('async');
const projectUtils = require('./../utils/project/projectUtils.js');
var userUtils = require('./../utils/user/userUtils.js');

chai.use(chaiHttp);
const should = chai.should();

const demouser1 = require("../mockdata/users/demouser1");
const demouser2 = require("../mockdata/users/demouser2");
const demouser3 = require("../mockdata/users/demouser3");
const falseUser = 'demouser404';

describe('/users', function () {

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
    /*all the way here----------------------------------------------------------*/

    it('[HTML] should list all users when logged in as demouser1.username', function (done){
        /*This was just an experiment, to understand the testing mecanism**/
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.listAllUsers(false, agent, function (err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser1');
                done();
            })
        })
    });

    it('[JSON]  should list all users when logged in as demouser1.username', function (done) {
        /*This was just an experiment, to understand the testing mecanism**/
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.listAllUsers(true, agent, function (err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser1');
                done();
            })
        })
    });


    it('[HTML] should list all users when logged in as demouser2.username', function (done){
        /*This was just an experiment, to understand the testing mecanism**/
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.listAllUsers(false, agent, function (err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser2');
                done();
            })
        })
    });

    it('[JSON]  should list all users when logged in as demouser2.username', function (done) {
        /*This was just an experiment, to understand the testing mecanism**/
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.listAllUsers(true, agent, function (err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser1');
                res.text.should.contain('demouser2');
                res.text.should.contain('demouser3');
                done();
            })
        })
    });


    it('[HTML] should list all users when NOT logged in', function (done){
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.listAllUsers(false, agent, function (err, res){
            res.should.have.status(200);
            res.text.should.contain('demouser1');
            res.text.should.contain('demouser2');
            res.text.should.contain('demouser3');
            done();
        })
    });

    it('[JSON] should list all users when NOT logged in', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.listAllUsers(true, agent, function (err, res){
            res.should.have.status(200);
            res.text.should.contain('demouser1');
            res.text.should.contain('demouser2');
            res.text.should.contain('demouser3');
            done();
        })
    });


});


describe('/user/:username', function () {

    it('[JSON] should NOT access demouser1.username profile when given demouser1.username and NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getUserInfo(demouser1.username, false, agent, function(err, res){
                res.should.have.status(200);
                res.redirects[0].should.contain('/login');
                res.text.should.contain('Please log into the system');
                done();
            })
    });

    it('[HTML] should NOT access demouser1.username profile when given demouser1.username and  NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getUserInfo(demouser1.username, false, agent, function(err, res){
            res.should.have.status(200);
            res.redirects[0].should.contain('/login');
            res.text.should.contain('Please log into the system');
            done();
            })
    });

    it('[JSON] should access demouser1.username profile when given demouser1.username and logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getUserInfo(demouser1.username, true, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('\"username\":\"demouser1\"');
                done();
            })
        })
    });

    it('[HTML] should access demouser1.username profile when given demouser1.username and logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getUserInfo(demouser1.username, false, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Viewing user demouser1');
                done();
            })
        })
    });

    it('[JSON] should access demouser2.username profile when given demouser2.username and logged in ',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getUserInfo(demouser2.username, true, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('\"username\":\"demouser2\"');
                done();
            })
        })
    });

    it('[HTML] should access demouser2.username profile when given demouser2.username and logged in ',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getUserInfo(demouser2.username, false, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('Viewing user demouser2');
                done();
            })
        })
    });

    it('[JSON] should NOT access demouser1.username profile when given non-existent username and logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getUserInfo(falseUser, true, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser404 does not exist');
                done();
            })
        })
    });

    it('[HTML] should NOT access demouser1.username profile when given non-existent username and logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getUserInfo(falseUser, false, agent, function(err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser404 does not exist');
                done();
            })
        })
    });

    it('[JSON] should NOT access demouser1.username profile when given non-existent username and NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
            userUtils.getUserInfo(falseUser, true, agent, function(err, res){
                res.should.have.status(401);
                res.text.should.contain('You are not logged into the system');
                done();
            })
    });

    it('[HTML] should NOT access demouser1.username profile when given non-existent username and NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getUserInfo(falseUser, false, agent, function(err, res){
            res.should.have.status(200);
            res.text.should.contain('Please log into the system');
            done();
        })
    });

});

describe('/users/loggedUser', function () {

    it('[JSON] should NOT display demouser1.username info when NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getCurrentLoggedUser(true, agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain('Editing user');
            res.text.should.contain('no user authenticated in the system');
            done();
        })
    });

    it('[HTML] should NOT display demouser1.username info when NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getCurrentLoggedUser(false, agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain('Logout');
            done();
        })
    });

    it('[JSON] should display demouser1.username info when logged in as demouser1.username',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getCurrentLoggedUser(true, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('\"username\":\"demouser1\"');
                res.text.should.not.contain('no user authenticated in the system');
                done();
            })
        })
    });

    it('[HTML] should display demouser1.username info when logged in as demouser1.username',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getCurrentLoggedUser(false, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Logout');
                res.text.should.not.contain('no user authenticated in the system');
                done();
            })
        })
    });

    it('[JSON] should display demouser2.username info when logged in as demouser2.username',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getCurrentLoggedUser(true, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('\"username\":\"demouser2\"');
                res.text.should.not.contain('no user authenticated in the system');
                done();
            })
        })
    });

    it('[HTML] should display demouser2.username info when logged in as demouser2.username',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getCurrentLoggedUser(false, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Logout');
                done();
            })
        })
    });

    it('[JSON] should NOT display demouser1.username info when logged in as demouser2.username',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getCurrentLoggedUser(true, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('\"username\":\"demouser1\"');
                done();
            })
        })
    });

    it('[HTML] should NOT display demouser1.username info when logged in as demouser2.username',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.getCurrentLoggedUser(false, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Viewing user demouser2');
                res.text.should.not.contain('Viewing user demouser1');
                done();
            })
        })
    });

    it('[JSON] should NOT display demouser2.username info when logged in as demouser1.username',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getCurrentLoggedUser(true, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain('\"username\":\"demouser2\"');
                done();
            })
        })
    });

    it('[HTML] should NOT display demouser2.username info when logged in as demouser1.username',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getCurrentLoggedUser(false, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Viewing user demouser1');
                res.text.should.not.contain('Viewing user demouser2');
                done();
            })
        })
    });
});


describe('/reset_password', function () {
    //TODO
});

describe('/set_new_password', function () {
    //TODO
});
