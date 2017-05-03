var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));


const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

var addBootUpUnit = requireUncached(Config.absPathInTestsFolder("units/bootup.Unit.js"));
var db = requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}


describe("/users", function (done) {
    before(function (done) {
        this.timeout(60000);
        addBootUpUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });


    describe("[POST] /users/loggedUser ", function () {

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

    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        db.deleteGraphs(function (err, data) {
            should.equal(err, null);
            GLOBAL.tests.server.close();
            done();
        });
    });

});



