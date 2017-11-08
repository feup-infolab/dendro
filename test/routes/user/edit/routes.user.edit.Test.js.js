var chai = require("chai");
var chaiHttp = require("chai-http");
const should = chai.should();
var _ = require("underscore");

chai.use(chaiHttp);

let path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
var createUserUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/users/createUsers.Unit.js"));

describe("[POST] /user/edit", function (done)
{
    const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
    const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
    const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

    let demouser1BaseData = {
        firstname: "demouser1",
        surname: "demouser1",
        email: "demouser1@gmail.com",
        password: "demouserpassword2015",
        repeat_password: "demouserpassword2015"
    };

    let correctDataToEdit = {
        firstname: "usernameedited",
        surname: "usernameedited",
        email: "usernameedited@gmail.com",
        password: "123456789",
        repeat_password: "123456789"
    };

    let invalidEmailDataToEdit = {
        firstname: "usernameedited",
        surname: "usernameedited",
        email: "usernameedited@gmail",
        password: "123456789",
        repeat_password: "123456789"
    };

    let invalidPasswordLengthDataToEdit = {
        firstname: "usernameedited",
        surname: "usernameedited",
        email: "usernameedited@gmail.com",
        password: "123",
        repeat_password: "123"
    };

    let passwordsNotTheSameDataToEdit = {
        firstname: "usernameedited",
        surname: "usernameedited",
        email: "usernameedited@gmail.com",
        password: "123456789",
        repeat_password: "123456780"
    };

    before(function (done)
    {
        this.timeout(Config.testsTimeout);
        createUserUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    it("[HTML] should give an unauthorized error if the current user is not authenticated", function (done)
    {
        var app = global.tests.app;
        var agent = chai.request.agent(app);

        userUtils.editUser(true, agent, correctDataToEdit, function (err, res)
        {
            res.should.have.status(401);
            res.text.should.contain("You are not logged into the system.");
            done();
        });
    });

    it("[HTML] should not edit demouser2 if the current authenticated user is the demouser1", function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            userUtils.editUser(true, agent, demouser1BaseData, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("User " + demouser1.username + " edited.");
                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                {
                    userUtils.getUserInfo(demouser2.username, true, agent, function (err, res)
                    {
                        res.should.have.status(200);
                        res.body.foaf.mbox.should.not.equal(demouser1BaseData.email);
                        done();
                    });
                });
            });
        });
    });

    it("[HTML] should not edit demouser3 if the current authenticated user is the demouser1", function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            userUtils.editUser(true, agent, demouser1BaseData, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("User " + demouser1.username + " edited.");
                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                {
                    userUtils.getUserInfo(demouser3.username, true, agent, function (err, res)
                    {
                        res.should.have.status(200);
                        res.body.foaf.mbox.should.not.equal(demouser1BaseData.email);
                        done();
                    });
                });
            });
        });
    });

    it("[HTML] should give an error if the password and repeat_password body params are not the same", function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            userUtils.editUser(true, agent, passwordsNotTheSameDataToEdit, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("Passwords fields must be the same and at least 8 characters in length!");
                done();
            });
        });
    });

    it("[HTML] should give an error if the password and repeat_password body params are not above 8 chars long", function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            userUtils.editUser(true, agent, invalidPasswordLengthDataToEdit, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("Passwords fields must be the same and at least 8 characters in length!");
                done();
            });
        });
    });

    it("[HTML] should give an error if the email body param is not in a valid email format", function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            userUtils.editUser(true, agent, invalidEmailDataToEdit, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("Invalid email format!");
                done();
            });
        });
    });

    it("[HTML] should edit demouser1 if the current authenticated user is demouser1 and all fields are complying to the rules", function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            userUtils.editUser(true, agent, correctDataToEdit, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("User " + demouser1.username + " edited.");
                // because the password was changed
                userUtils.loginUser(demouser1.username, correctDataToEdit.password, function (err, agent)
                {
                    userUtils.getUserInfo(demouser1.username, true, agent, function (err, res)
                    {
                        res.should.have.status(200);
                        res.body.foaf.mbox.should.equal(correctDataToEdit.email);
                        res.body.foaf.firstName.should.equal(correctDataToEdit.firstname);
                        res.body.foaf.surname.should.equal(correctDataToEdit.surname);
                        done();
                    });
                });
            });
        });
    });

    it("[HTML] should edit demouser2 if the current authenticated user is demouser2 and all fields are complying to the rules", function (done)
    {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            userUtils.editUser(true, agent, correctDataToEdit, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("User " + demouser2.username + " edited.");
                // because the password was changed
                userUtils.loginUser(demouser2.username, correctDataToEdit.password, function (err, agent)
                {
                    userUtils.getUserInfo(demouser2.username, true, agent, function (err, res)
                    {
                        res.should.have.status(200);
                        res.body.foaf.mbox.should.equal(correctDataToEdit.email);
                        res.body.foaf.firstName.should.equal(correctDataToEdit.firstname);
                        res.body.foaf.surname.should.equal(correctDataToEdit.surname);
                        done();
                    });
                });
            });
        });
    });

    it("[HTML] should edit demouser3 if the current authenticated user is demouser3 and all fields are complying to the rules", function (done)
    {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
        {
            userUtils.editUser(true, agent, correctDataToEdit, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("User " + demouser3.username + " edited.");
                // because the password was changed
                userUtils.loginUser(demouser3.username, correctDataToEdit.password, function (err, agent)
                {
                    userUtils.getUserInfo(demouser3.username, true, agent, function (err, res)
                    {
                        res.should.have.status(200);
                        res.body.foaf.mbox.should.equal(correctDataToEdit.email);
                        res.body.foaf.firstName.should.equal(correctDataToEdit.firstname);
                        res.body.foaf.surname.should.equal(correctDataToEdit.surname);
                        done();
                    });
                });
            });
        });
    });

    after(function (done)
    {
        this.timeout(Config.testsTimeout);
        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done();
        });
    });
});
