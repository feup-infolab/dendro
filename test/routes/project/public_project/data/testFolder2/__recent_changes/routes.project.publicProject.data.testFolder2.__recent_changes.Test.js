const chai = require("chai");
const path = require("path");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");

const testFolder2 = rlequire("dendro", "test/mockdata/folders/testFolder2.js");
const notFoundFolder = rlequire("dendro", "test/mockdata/folders/notFoundFolder.js");
const folderForDemouser2 = rlequire("dendro", "test/mockdata/folders/folderDemoUser2");
const addMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Public project testFolder2 level recent changes", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        appUtils.newTestRouteLog(path.basename(__filename));
        should.equal(err, null);
        done();
    });

    // GET ITEM RECENT CHANGES TESTS
    describe("[GET] [PUBLIC PROJECT] /project/" + publicProject.handle + "/data/testFolder2?recent_changes", function ()
    {
        // API ONLY
        it("Should give an error if the request is of type HTML", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemRecentChanges(false, agent, publicProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should give the item changes if the user is unauthenticated", function (done)
        {
            const app = Config.tests.app;
            agent = chai.request.agent(app);

            itemUtils.getItemRecentChanges(true, agent, publicProject.handle, testFolder2.name, function (err, res)
            {
                // because it is a public project
                res.statusCode.should.equal(200);
                res.body.should.be.instanceof(Array);
                res.body.length.should.equal(1);
                res.body[0].changes.length.should.equal(3);// The abstract, title and creator descriptors
                done();
            });
        });

        it("Should give an error if the project does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemRecentChanges(true, agent, invalidProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.result.should.equal("not_found");
                    res.body.message.should.be.an("array");
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain("Resource not found at uri ");
                    res.body.message[0].should.contain(testFolder2.name);
                    res.body.message[0].should.contain(invalidProject.handle);
                    done();
                });
            });
        });

        it("Should give an error if the folder does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemRecentChanges(true, agent, publicProject.handle, notFoundFolder.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.getItemRecentChanges(true, agent, publicProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);// because it is a public project
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);
                    res.body[0].changes.should.be.instanceof(Array);
                    res.body[0].changes.length.should.equal(3);// The abstract, title and creator descriptors
                    should.not.exist(res.body[0].ddr.versionCreator.ddr);
                    done();
                });
            });
        });

        it("Should give the folder changes if the user is logged in as demouser1(the creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemRecentChanges(true, agent, publicProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);
                    res.body[0].changes.length.should.equal(3);// The abstract, title and creator descriptors
                    done();
                });
            });
        });

        it("Should give the folder changes if the user is logged in as demouser2(a collaborator on the project)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                // jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemRecentChanges(true, agent, publicProject.handle, folderForDemouser2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(1);
                    res.body[0].changes.length.should.equal(3);// The abstract, title and creator descriptors
                    done();
                });
            });
        });
    });

    after(function (done)
    {
        // destroy graphs

        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done(err);
        });
    });
});
