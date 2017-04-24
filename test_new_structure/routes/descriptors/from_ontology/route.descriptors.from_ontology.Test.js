var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Config.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Config.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Config.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
const folderForDemouser2 = require(Config.absPathInTestsFolder("mockdata/folders/folderDemoUser2.js"));
const ontologyPrefix = "xy";

//require(Config.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js")).setup();
var addContributorsToProjectsUnit = requireUncached(Config.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));
var db = requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

describe("Descriptors from invalid ontology", function (done) {
    this.timeout(20000);
    before(function (done) {
        this.timeout(60000);
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
                    res.should.have.status(500);
                    res.body.error_messages.should.contain("Error retrieving ontology with prefix "  + ontologyPrefix +  " Error reported");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser3(Collaborator of Public project "+publicProject.handle +")", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, publicProject.handle, function (err, res) {
                    res.should.have.status(500);
                    res.body.error_messages.should.contain("Error retrieving ontology with prefix "  + ontologyPrefix +  " Error reported");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) (when unauthenticated and accessing Public project "+publicProject.handle +")", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
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
                    res.should.have.status(500);
                    res.body.error_messages.should.contain("Error retrieving ontology with prefix "  + ontologyPrefix +  " Error reported");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology (This ontology does not exist) when logged in as demouser3(Collaborator of the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, metadataOnlyProject.handle, function (err, res) {
                    res.should.have.status(500);
                    res.body.error_messages.should.contain("Error retrieving ontology with prefix "  + ontologyPrefix +  " Error reported");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology (This ontology does not exist) (when unauthenticated trying to access the Metadata Only project "+metadataOnlyProject.handle +")", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
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
                    res.should.have.status(500);
                    res.body.error_messages.should.contain("Error retrieving ontology with prefix "  + ontologyPrefix +  " Error reported");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) when logged in as demouser3 (Collaborator of the Private project "+privateProject.handle +")", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, privateProject.handle, function (err, res) {
                    res.should.have.status(500);
                    res.body.error_messages.should.contain("Error retrieving ontology with prefix "  + ontologyPrefix +  " Error reported");
                    done();
                });
            });
        });

        it("[JSON] It should not get descriptors from xy ontology(This ontology does not exist) (when unauthenticated trying to access the Private project "+privateProject.handle +")", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            descriptorUtils.getProjectDescriptorsFromOntology(true, agent, ontologyPrefix, privateProject.handle, function (err, res) {
                res.should.have.status(401);
                done();
            });
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