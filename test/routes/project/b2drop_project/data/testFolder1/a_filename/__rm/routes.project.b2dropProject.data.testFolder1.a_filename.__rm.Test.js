const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const b2dropProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/b2drop_project.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const folderForDemouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));

const createFoldersB2DropUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFoldersB2drop.Unit.js"));
const createFilesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/files/createFiles.Unit.js"));

const allFiles = createFilesUnit.filesData;

describe("B2Drop project testFolder1 ?rename", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createFoldersB2DropUnit.init(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[POST] [FOLDER] [B2Drop PROJECT] [Invalid Cases] /project/" + b2dropProject.handle + "/data/:foldername?rename", function ()
    {
        it("Should give an error if the request is of type HTML even if the user is logged in as demouser1(the creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.createFolder(false, agent, b2dropProject.handle, testFolder1.name, folder.name, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.text.should.equal("HTML Request not valid for this route.");
                    done();
                });
            });
        });

        it("Should give an error when the user is unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.createFolder(true, agent, b2dropProject.handle, testFolder1.name, folder.name, function (err, res)
            {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error when the user is logged in as demouser3(not a collaborador nor creator in a project by demouser1)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, b2dropProject.handle, testFolder1.name, folder.name, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give an error if an invalid name is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, b2dropProject.handle, testFolder1.name, "*aRandomFolder", function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("invalid file name specified");
                    done();
                });
            });
        });

        it("Should give an error if we try to rename a folder that does not exist, even if the user is logged in as a creator or collaborator on the project", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, b2dropProject.handle, "*invalidFolder", folder.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should give an error if we try to rename a project instead of a folder, even if the user is logged in as a creator or collaborator on the project", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, b2dropProject.handle, "*invalidFolder", folder.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });
    });

    describe("[POST] [FILE] [B2Drop PROJECT] [Valid Cases] /project/" + b2dropProject.handle + "/data/testFolder1/:filename?rename", function ()
    {
        it("Should rename files with success if the user is logged in as demouser1(the creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                async.mapSeries(allFiles, function (file, callback)
                {
                    const newName = "RenamedFile";
                    fileUtils.renameFile(agent, b2dropProject.handle, testFolder1.name, file.name, newName, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        callback(err, res);
                    });
                }, function (err, result)
                {
                    done(err);
                });
            });
        });

        it("Should rename files with success if the user is logged in as demouser2(a collaborator of the project)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, b2dropProject.handle, testFolder1.name, folderForDemouser2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });

    describe("Clean up /project/" + b2dropProject.handle, function ()
    {
        it("Should delete project " + b2dropProject.handle, function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.deleteProject(false, agent, b2dropProject.handle, function (err, result)
                {
                    should.not.exist(err);
                    // destroy graphs
                    done();
                });
            });
        });
    });

    after(function (done)
    {
        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done(err);
        });
    });
});
