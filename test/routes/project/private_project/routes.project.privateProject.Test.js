const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const invalidProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const addMetadataToFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Private project root tests", function () {
    before(function (done) {
        this.timeout(Config.testsTimeout);
        addMetadataToFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe('/project/'+privateProject.handle + " (default case where the root of the project is shown, without any query)", function () {

        it("[HTML] should not show the project page if the user is unauthenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.viewProject(false, agent, privateProject.handle, function (err, res) {
                res.should.have.status(200);
                res.text.should.not.contain(privateProject.handle);
                res.text.should.not.contain('Edit mode');
                done();
            });
        });

        it("[HTML] should give the project page html [WITH EDIT MODE] if the user is logged in as demouser1(the project creator)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.viewProject(false, agent, privateProject.handle, function (err, res) {
                    res.should.have.status(200);
                    res.text.should.contain(privateProject.handle);
                    res.text.should.contain('Edit mode');
                    done();
                });
            });
        });

        it("[HTML] should give the project page html [WITH EDIT MODE] if the user is logged in as demouser2(a project contributor)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.viewProject(false, agent, privateProject.handle, function (err, res) {
                    res.should.have.status(200);
                    res.text.should.contain(privateProject.handle);
                    res.text.should.contain('Edit mode');
                    done();
                });
            });
        });

        it("[HTML] should not show the project page if the user is logged in as demouser3(non-creator or non-contributor of the project)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.viewProject(false, agent, privateProject.handle, function (err, res) {
                    res.should.have.status(200);
                    res.text.should.not.contain(privateProject.handle);
                    res.text.should.not.contain('Edit mode');
                    done();
                });
            });
        });

        it("[JSON] should give an unauthorized error if the user is unauthenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.viewProject(true, agent, privateProject.handle, function (err, res) {
                res.should.have.status(401);
                should.not.exist(res.body.descriptors);
                should.not.exist(res.body.title);
                done();
            });
        });

        it("[JSON] should give the project root data if the user is logged in as demouser1(the project creator)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.viewProject(true, agent, privateProject.handle, function (err, res) {
                    res.should.have.status(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.title.should.equal(privateProject.title);
                    done();
                });
            });
        });

        it("[JSON] should give the project root data if the user is logged in as demouser2(a project contributor)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.viewProject(true, agent, privateProject.handle, function (err, res) {
                    res.should.have.status(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.title.should.equal(privateProject.title);
                    done();
                });
            });
        });

        it("[JSON] should give an unauthorized error if the user is logged in as demouser3(non-creator or non-contributor of the project)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.viewProject(true, agent, privateProject.handle, function (err, res) {
                    res.should.have.status(401);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.title);
                    done();
                });
            });
        });
    });

    describe('/project/'+invalidProject.handle + " NON_EXISTENT PROJECT(default case where the root of the project is shown, without any query)", function () {

        it("[HTML] should give the project page html with an error if the user is unauthenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.viewProject(false, agent, invalidProject.handle, function (err, res) {
                res.should.have.status(200);
                //Project http://127.0.0.1:3001/project/unknownProjectHandle not found.
                res.text.should.contain("Project " +  "http://" + Config.host + "/project/"  + invalidProject.handle + " not found.");
                res.text.should.not.contain('Edit mode');
                done();
            });
        });

        it("[HTML] should give the project page html with an error if the user is logged in as demouser1(the project creator)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.viewProject(false, agent, invalidProject.handle, function (err, res) {
                    res.should.have.status(200);
                    //Project http://127.0.0.1:3001/project/unknownProjectHandle not found.
                    res.text.should.contain("Project " +  "http://" + Config.host + "/project/"  + invalidProject.handle + " not found.");
                    res.text.should.not.contain('Edit mode');
                    done();
                });
            });
        });

        it("[HTML] should give the project page html with an error if the user is logged in as demouser2(a project contributor)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.viewProject(false, agent, invalidProject.handle, function (err, res) {
                    res.should.have.status(200);
                    //Project http://127.0.0.1:3001/project/unknownProjectHandle not found.
                    res.text.should.contain("Project " +  "http://" + Config.host + "/project/"  + invalidProject.handle + " not found.");
                    res.text.should.not.contain('Edit mode');
                    done();
                });
            });
        });

        it("[HTML] should give the project page html with an error if the user is logged in as demouser3(non-creator or non-contributor of the project)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.viewProject(false, agent, invalidProject.handle, function (err, res) {
                    res.should.have.status(200);
                    //Project http://127.0.0.1:3001/project/unknownProjectHandle not found.
                    res.text.should.contain("Project " +  "http://" + Config.host + "/project/"  + invalidProject.handle + " not found.");
                    res.text.should.not.contain('Edit mode');
                    done();
                });
            });
        });


        it("[JSON] should give a 404 error if the user is unauthenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.viewProject(true, agent, invalidProject.handle, function (err, res) {
                res.should.have.status(404);//-> At the moment it is responding with an html page saying that the project does not exist
                done();
            });
        });

        it("[JSON] should give a 404 error if the user is logged in as demouser1(the project creator)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.viewProject(true, agent, invalidProject.handle, function (err, res) {
                    res.should.have.status(404);//-> At the moment it is responding with an html page saying that the project does not exist
                    done();
                });
            });
        });

        it("[JSON] should give a 404 error if the user is logged in as demouser2(a project contributor)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.viewProject(true, agent, invalidProject.handle, function (err, res) {
                    res.should.have.status(404);//-> At the moment it is responding with an html page saying that the project does not exist
                    done();
                });
            });
        });

        it("[JSON] should give a 404 error if the user is logged in as demouser3(non-creator or non-contributor of the project)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.viewProject(true, agent, invalidProject.handle, function (err, res) {
                    res.should.have.status(404);//-> At the moment it is responding with an html page saying that the project does not exist
                    done();
                });
            });
        });
    });

    after(function (done) {
        //destroy graphs

        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done(err);
        });
    });
});