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


var should = chai.should();


describe('/users', function () {
    /*I didn't write this, they are related to the /me if I'm not mistaken, should we change from the 'users' descriptor to the 'me' one???----------------------------------*/
    //TODO
    it('[JSON] /me  with authenticated used', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            userUtils.getLoggedUserDetails(true, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Editing user');
                done();
            });
        })
    });


    it('[HTML] /me  with authenticated used', function (done) {
        var app = GLOBAL.tests.app;
        userUtils.loginUser('demouser1', 'demouserpassword2015', function (err, agent) {
            userUtils.getLoggedUserDetails(false, agent, function (err, res) {
                res.should.have.status(200);
                res.text.should.contain('Editing user');
                done();
            });
        })
    });


    it('[JSON] /me  not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getLoggedUserDetails(true, agent, function (err, res) {
            res.should.have.status(401);
            res.text.should.not.contain('Editing user');
            done();
        });
    });

    it('[HTML] /me  not authenticated', function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.getLoggedUserDetails(false, agent, function (err, res) {
            res.should.have.status(200);
            res.text.should.not.contain('Editing user');
            done();
        });
    });
    /*all the way here----------------------------------------------------------*/

    it('[HTML] should list all users when logged in as demouser1', function (done){
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

    it('[JSON]  should list all users when logged in as demouser1', function (done) {
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


    it('[HTML] should list all users when logged in as demouser1', function (done){
        /*This was just an experiment, to understand the testing mecanism**/
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.listAllUsers(false, agent, function (err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser1');
                done();
            })
        })
    });

    it('[JSON]  should list all users when logged in as demouser1', function (done) {
        /*This was just an experiment, to understand the testing mecanism**/
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            userUtils.listAllUsers(true, agent, function (err, res){
                res.should.have.status(200);
                res.text.should.contain('demouser1');
                done();
            })
        })
    });


    it('[HTML] should list all users when NOT logged in', function (done){
        //TODO
        done(1);
    });

    it('[JSON] should list all users when NOT logged in', function (done) {
        //TODO
        done(1);
    });


});


describe('/users/:username', function () {

    it('[JSON] should NOT acess demouser1 profile when given demouser1 and NOT logged in',function (done) {
        done(1);
    });

    it('[HTML] should NOT acess demouser1 profile when given demouser1 and  NOT logged in',function (done) {
        done(1);
    });

    it('[JSON] should access demouser1 profile when given demouser1 and logged in',function (done) {
        done(1);
    });

    it('[HTML] should access demouser1 profile when given demouser1 and logged in',function (done) {
        done(1);
    });

    it('[JSON] should access demouser2 profile when given demouser2 and logged in ',function (done) {
        done(1);
    });

    it('[HTML] should access demouser2 profile when given demouser2 and logged in ',function (done) {
        done(1);
    });

    it('[JSON] should NOT access demouser1 profile when given non-existent username and logged in',function (done) {
        done(1);
    });

    it('[HTML] should NOT access demouser1 profile when given non-existent username and logged in',function (done) {
        done(1);
    });

    it('[JSON] should NOT access demouser1 profile when given non-existent username and NOT logged in',function (done) {
        done(1);
    });

    it('[HTML] should NOT access demouser1 profile when given non-existent username and NOT logged in',function (done) {
        done(1);
    });

});


describe('/users/loggedUser', function () {

    it('[JSON] should NOT display demouser1 info when NOT logged in',function (done) {
        done(1);
    });

    it('[HTML] should NOT display demouser1 info when NOT logged in',function (done) {
        done(1);
    });

    it('[JSON] should NOT display demouser2 info when NOT logged in',function (done) {
        done(1);
    });

    it('[HTML] should NOT display demouser2 info when NOT logged in',function (done) {
        done(1);
    });

    it('[JSON] should display demouser1 info when logged in as demouser1',function (done) {
        done(1);
    });

    it('[HTML] should display demouser1 info when logged in as demouser1',function (done) {
        done(1);
    });

    it('[JSON] should display demouser2 info when logged in as demouser2',function (done) {
        done(1);
    });

    it('[HTML] should display demouser2 info when logged in as demouser2',function (done) {
        done(1);
    });

    it('[JSON] should NOT display demouser1 info when logged in as demouser2',function (done) {
        done(1);
    });

    it('[HTML] should NOT display demouser1 info when logged in as demouser2',function (done) {
        done(1);
    });

    it('[JSON] should NOT display demouser2 info when logged in as demouser1',function (done) {
        done(1);
    });

    it('[HTML] should NOT display demouser2 info when logged in as demouser1',function (done) {
        done(1);
    });
});


describe('/reset_password', function () {
    //TODO
});

describe('/set_new_password', function () {
    //TODO
});