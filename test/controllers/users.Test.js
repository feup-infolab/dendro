process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();
var userUtils = require('./../utils/user/userUtils.js');
var async = require('async');
chai.use(chaiHttp);

var demouser1 = require("../mockdata/users/demouser1");
var demouser2 = require("../mockdata/users/demouser2");
var falseUser = 'demouser404';

var should = chai.should();

describe('/me', function () {
    it('[JSON] should return logged user when authenticated', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getLoggedUserDetails(true, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Editing user');
                done();
            });
        })
    });


    it('[HTML] should return logged user when authenticated', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            userUtils.getLoggedUserDetails(false, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Editing user');
                done();
            });
        })
    });


    it('[JSON] should NOT return logged user when NOT authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getLoggedUserDetails(true, agent, function (err, res) {
            res.should.have.status(401);
            res.text.should.not.contain('Editing user');
            done();
        });
    });

    it('[HTML] should NOT return logged user when NOT authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getLoggedUserDetails(false, agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain('Editing user');
            done();
        });
    });
});

describe('/users', function () {

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
        userUtils.getUserInfo(demouser1.username, true, agent, function(err, res){
            res.should.have.status(401);
            res.text.should.contain('You are not logged into the system.');
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
            res.text.should.contain('no user authenticated in the system');
            done();
        })
    });

    it('[HTML] should NOT display demouser1.username info when NOT logged in',function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getCurrentLoggedUser(false, agent, function (err, res) {
            res.should.have.status(405);
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
    var dummyToken = '123';
    it('[HTML] should return an ERROR when typing an unknown email into the form',function (done) {
        var dummyMail = 'dendro@mail';
        userUtils.sendingPassword(dummyMail, dummyToken, function (err, res) {
            res.text.should.contain('Unknown account with email');
            res.should.have.status(200);
            done();
        })
    });

    it('[HTML] should return an ERROR when the email is NULL',function (done) {
        userUtils.sendingPassword(null, dummyToken, function (err, res) {
            res.text.should.contain('Please specify a valid email address');
            res.should.have.status(200);
            done();
        })
    });

    it('[HTML] should load Reset_Password page correctly',function (done) {
        userUtils.getResetPasswordView( function (err, res) {
            res.text.should.contain('Enter your email');
            res.should.have.status(200);
            done();
        })
    });
});



describe('/set_new_password', function () {

    it('[HTML] should return ERROR user of correspondent email is non-existent',function (done) {
        var email = 'mail@mail';
        var token = '123';
        var query ='?email=' + email + '&token='+token;

        userUtils.newPassword(query, function (err, res) {
            res.text.should.contain('Non-existent user with email '+email);
            res.should.have.status(200);
            done();
        })
    });

    it('[HTML] should return INVALID REQUEST when parameters are NULL',function (done) {
        var query;
        userUtils.newPassword(query, function (err, res) {
            res.text.should.contain('Invalid request');
            res.should.have.status(200);
            done();
        })
    });

    it('[HTML] POST should return ERROR user of correspondent email is non-existent',function (done) {
        var email = 'mail@mail';
        var token = '123';

        userUtils.sendingNewPassword(email,token,'','', function (err, res) {
            res.text.should.contain('Unknown account with email '+email);
            res.should.have.status(200);
            done();
        })
    });

    it('[HTML] POST should return ERROR when parameters are NULL',function (done) {
        var email =  null;
        var token = null;

        userUtils.sendingNewPassword(email,token,'','', function (err, res) {
            res.text.should.contain('Wrong link specified');
            res.should.have.status(200);
            done();
        })
    });

    it('[HTML] POST should return ERROR when passwords mismatch',function (done) {
        var email = 'mail@mail';
        var token = '123';
        var newPassword = '12345';
        var newPassConfirm = '54321';

        userUtils.sendingNewPassword(email,token, newPassword, newPassConfirm, function (err, res) {
            res.text.should.contain('Please make sure that the password and its confirmation match.');
            res.should.have.status(200);
            done();
        })
    });
});
