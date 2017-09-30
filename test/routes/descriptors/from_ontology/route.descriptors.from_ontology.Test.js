const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Pathfinder.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const folderForDemouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2.js"));
const ontologyPrefix = "xy";

const addContributorsToProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Descriptors from invalid ontology", function (done) {
    before(function (done) {
        this.timeout(Config.testsTimeout);
        addContributorsToProjectsUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] /descriptors/from_ontology/xy", function () {
        /**
         * PUBLIC PROJECT
         */
        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser1(The creator of the Public project "+publicProject.handle +")", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, publicProject.handle, function (err, res) {
                    res.should.have.status(404);
                    res.body.error_messages.should.contain("Ontology with prefix or uri xy does not exist in this Dendro instance.");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser2 (Collaborator of Public project "+publicProject.handle +")", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, publicProject.handle, function (err, res) {
                    res.should.have.status(404);
                    res.body.error_messages.should.contain("Ontology with prefix or uri xy does not exist in this Dendro instance.");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) (when unauthenticated and accessing Public project "+publicProject.handle +")", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, publicProject.handle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });

        /**
         * METADATA_ONLY PROJECT
         */

        it("[JSON] It should not get descriptors from xy ontology (This ontology does not exist) when logged in as demouser1(The creator of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, metadataOnlyProject.handle, function (err, res) {
                    res.should.have.status(404);
                    res.body.error_messages.should.contain("Ontology with prefix or uri xy does not exist in this Dendro instance.");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology (This ontology does not exist) when logged in as demouser2(Collaborator of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, metadataOnlyProject.handle, function (err, res) {
                    res.should.have.status(404);
                    res.body.error_messages.should.contain("Ontology with prefix or uri xy does not exist in this Dendro instance.");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology (This ontology does not exist) (when unauthenticated trying to access the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, metadataOnlyProject.handle, function (err, res) {
                res.should.have.status(401);
                done();
            });
        });

        /**
         * PRIVATE PROJECT
         */

        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser1 (The creator of the Private project "+privateProject.handle +")", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, privateProject.handle, function (err, res) {
                    res.should.have.status(404);
                    res.body.error_messages.should.contain("Ontology with prefix or uri xy does not exist in this Dendro instance.");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser2 (Collaborator of the Private project "+privateProject.handle +")", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, privateProject.handle, function (err, res) {
                    res.should.have.status(404);
                    res.body.error_messages.should.contain("Ontology with prefix or uri xy does not exist in this Dendro instance.");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) (when unauthenticated trying to access the Private project "+privateProject.handle +")", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, privateProject.handle, function (err, res) {
                res.should.have.status(401);
                done();
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