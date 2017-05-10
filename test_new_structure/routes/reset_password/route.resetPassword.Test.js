var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
var addBootUpUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/bootup.Unit.js"));

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

const dummyToken = "123";
const dummyMail = 'dendro@mail';

describe('/reset_password', function () {

    before(function (done) {
        this.timeout(60000);
        addBootUpUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    it('[HTML] should return an ERROR when typing an unknown email into the form',function (done) {
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


    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        db.deleteGraphs(function (err, data) {
            should.equal(err, null);
            GLOBAL.tests.server.close();
            done();
        });
    })

});