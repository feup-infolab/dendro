var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
var addBootUpUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/bootup.Unit.js"));

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

describe('/set_new_password', function () {

    before(function (done) {
        this.timeout(60000);
        addBootUpUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

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


after(function (done) {
    this.timeout(60000);
    appUtils.clearAppState(function (err, data) {
        should.equal(err, null);
        done();
    });
});