const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");

const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const notFoundFolder = rlequire("dendro", "test/mockdata/folders/notFoundFolder.js");
const folderForDemouser2 = rlequire("dendro", "test/mockdata/folders/folderDemoUser2");
const createFoldersUnit = rlequire("dendro", "test/units/folders/createFolders.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Public project testFolder1 level hard delete tests", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        createFoldersUnit.init(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[DELETE] [PUBLIC PROJECT] HARD DELETE /project/" + publicProject.handle + "/data/:foldername", function ()
    {
        // API ONLY
        it("Should give an error if the request type for this route is HTML", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.deleteItem(false, agent, publicProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    done();
                }, true);
            });
        });

        it("Should give an error message when the project does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    done();
                }, true);
            });
        });

        it("Should give an error message when the folder does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, publicProject.handle, notFoundFolder.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.result.should.equal("not_found");
                    res.body.message.should.be.an("array");
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain("Resource not found at uri ");
                    res.body.message[0].should.contain(notFoundFolder.name);
                    res.body.message[0].should.contain(publicProject.handle);
                    done();
                }, true);
            });
        });

        it("Should give an error when the user is not authenticated", function (done)
        {
            const app = Config.tests.app;
            const agent = chai.request.agent(app);
            // jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, publicProject.handle, testFolder1.name, function (err, res)
            {
                res.statusCode.should.equal(401);
                done();
            }, true);
        });

        it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to hard delete a folder created by demouser1", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                // jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, publicProject.handle, folderForDemouser2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.message.should.contain("Successfully deleted");
                    projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, response)
                    {
                        response.statusCode.should.equal(200);
                        response.text.should.not.contain("\"title\":" + "\"" + folderForDemouser2.name + "\"");
                        done();
                    });
                }, true);
            });
        });

        it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to hard delete the folder", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                // jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, publicProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                }, true);
            });
        });

        it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to hard delete the folder", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, publicProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.message.should.contain("Successfully deleted");
                    projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, response)
                    {
                        response.statusCode.should.equal(200);
                        response.text.should.not.contain("\"title\":" + "\"" + testFolder1.name + "\"");
                        done();
                    });
                }, true);
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
