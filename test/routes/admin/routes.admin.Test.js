process.env.NODE_ENV = "test";

const rlequire = require("rlequire");
const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const should = chai.should();

const administerUtils = rlequire("dendro", "test/utils/administer/administerUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const admin = rlequire("dendro", "test/mockdata/users/admin");

let createUsersUnit = rlequire("dendro", "test/units/users/createUsers.Unit.js");

let app;
let agent;

describe("Administration panel tests ( /admin )", function (done)
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        app = Config.tests.app;
        agent = chai.request.agent(app);
        done();
    });
    describe("Invalid cases", function ()
    {
        it("Should not access admin panel without being logged in", function (done)
        {
            administerUtils.getAdministerPage(agent, false, function (err, res)
            {
                res.should.have.status(401);
                res.text.should.contain("You are not authorized to perform this operation. You must be a Dendro administrator.");
                res.text.should.not.contain("System administration page");
                done();
            });
        });

        it("Should not access admin panel without being logged in as an administrator", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                administerUtils.getAdministerPage(agent, false, function (err, res)
                {
                    res.should.have.status(401);
                    res.text.should.contain("You are not authorized to perform this operation. You must be a Dendro administrator.");
                    res.text.should.not.contain("System administration page");
                    done();
                });
            });
        });
    });

    describe("Valid cases", function ()
    {
        it("Should access admin panel when the user is logged in as an administrator", function (done)
        {
            userUtils.loginUser(admin.username, admin.password, function (err, agent)
            {
                should.not.exist(err);
                administerUtils.getAdministerPage(agent, false, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.contain("System administration page");
                    done();
                });
            });
        });
    });
});
