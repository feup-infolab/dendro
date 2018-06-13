const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const expect = chai.expect;
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const metadataProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));

const createFoldersForLsByName = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFoldersForLsByName.Unit.js"));

let testFolder1Data;

describe("Metadata only project testFolder1 level ls_by_name tests", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createFoldersForLsByName.setup(function (err, results)
        {
            done(err, results);
        });
    });

    describe("[GET] [FOLDER LEVEL] [METADATA ONLY PROJECT] /project/" + metadataProject.handle + "/data/:foldername?ls&title='folderA'", function ()
    {
        it("Should give an error if the request is of type HTML even if the user is logged in as demouser1(the creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                folderUtils.ls_by_name(false, agent, testFolder1Data.uri, "folderA", function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("HTML Request not valid for this route.");
                    done();
                });
            });
        });

        it("Should give an unauthorized error when the user is unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);

            folderUtils.getFolderContentsByUri(true, agent, testFolder1Data.uri, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.result.should.equal("error");
                res.body.message.should.equal("Permission denied : cannot list the contents of this resource because you do not have permissions to access its project.");
                folderUtils.ls_by_name(true, agent, testFolder1Data.uri, "folderA", function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.result.should.equal("error");
                    res.body.message.should.equal("Permission denied : cannot list the contents of this resource because you do not have permissions to access its project.");
                    done();
                });
            });
        });

        it("Should give an unauthorized error when logged in as demouser3(not a collaborador nor creator in a project by demouser1)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                folderUtils.ls_by_name(true, agent, testFolder1Data.uri, "folderA", function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.result.should.equal("error");
                    res.body.message.should.equal("Permission denied : cannot list the contents of this resource because you do not have permissions to access its project.");
                    done();
                });
            });
        });

        it("Should list only the folder folderA if the user is logged in as demouser1(the creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                folderUtils.ls_by_name(true, agent, testFolder1Data.uri, "folderA", function (err, res)
                {
                    res.statusCode.should.equal(200);
                    expect(res.body).to.not.be.an.instanceof(Array);
                    expect(res.body).to.be.an.instanceof(Object);
                    res.body.nie.title.should.equal("folderA");
                    done();
                });
            });
        });

        it("Should list only the folder folderA if the user is logged in as demouser2(a collaborator of the project)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                folderUtils.ls_by_name(true, agent, testFolder1Data.uri, "folderA", function (err, res)
                {
                    res.statusCode.should.equal(200);
                    expect(res.body).to.not.be.an.instanceof(Array);
                    expect(res.body).to.be.an.instanceof(Object);
                    res.body.nie.title.should.equal("folderA");
                    done();
                });
            });
        });

        it("Should give an error if an invalid folder uri is specified for parent folder, even if the user is logged in as a creator or collaborator on the project", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                folderUtils.ls_by_name(true, agent, "invalidUri", "folderA", function (err, res)
                {
                    should.exist(err);
                    should.not.exist(res);
                    err.code.should.equal("ECONNREFUSED");
                    done();
                });
            });
        });

        it("Should give a not found error if the child folder specified does not exist inside the parent folder, even if the user is logged in as a creator or collaborator on the project", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                folderUtils.ls_by_name(true, agent, testFolder1Data.uri, "folderB", function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Child with name : folderB is not a children of " + testFolder1Data.uri);
                    done();
                });
            });
        });

        it("Should give an error if the title for the child folder is not specified even if the user is logged in as a creator or collaborator on the project", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                folderUtils.ls_by_name(true, agent, testFolder1Data.uri, null, function (err, res)
                {
                    res.statusCode.should.equal(404);
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
