const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));

const project = require(Pathfinder.absPathInTestsFolder("mockdata/projects/b2drop_project.js"));
const b2dropProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/b2drop_project.js"));

const createFoldersB2DropUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFoldersB2drop.Unit.js"));

describe("Backup B2Drop-backed project", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createFoldersB2DropUnit.load(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[B2drop backed project PROJECT] [Valid Cases] /project/" + project.handle + "?bagit", function ()
    {
        it("Should backup the b2drop backed project correctly", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.bagit(agent, project.handle, function (err, res)
                {
                    should.equal(err, null);
                    res.statusCode.should.equal(200);
                    projectUtils.contentsMatchBackup(project, res.body, function (err, result)
                    {
                        should.equal(err, null);
                        projectUtils.metadataMatchesBackup(project, res.body, function (err, result)
                        {
                            should.equal(err, null);
                            done();
                        }, "b2droproject");
                    });
                });
            });
        });
    });

    after(function (done)
    {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            projectUtils.deleteProject(false, agent, b2dropProject.handle, function (err, result)
            {
                should.not.exist(err);
                // destroy graphs
                appUtils.clearAppState(function (err, data)
                {
                    should.equal(err, null);
                    done(err);
                });
            });
        });
    });
});
