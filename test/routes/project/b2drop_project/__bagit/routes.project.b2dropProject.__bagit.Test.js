const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");

const project = rlequire("dendro", "test/mockdata/projects/b2drop_project.js");
const b2dropProject = rlequire("dendro", "test/mockdata/projects/b2drop_project.js");

const createFoldersB2DropUnit = rlequire("dendro", "test/units/folders/createFoldersB2drop.Unit.js");

describe("Backup B2Drop-backed project", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        createFoldersB2DropUnit.setup(function (err, results)
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
