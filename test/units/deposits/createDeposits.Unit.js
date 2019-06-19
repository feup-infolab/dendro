process.env.NODE_ENV = "test";

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");
const rlequire = require("rlequire");

const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const depositUtils = rlequire("dendro", "test/utils/deposit/depositUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const createFoldersUnit = rlequire("dendro", "test/units/folders/createFolders.Unit.js");
const createProjectsUnit = rlequire("dendro", "test/units/projects/createProjectsB2Drop.Unit.js");
const createFilesUnit = rlequire("dendro", "test/units/files/createFiles.Unit.js");

const projectsData = createProjectsUnit.projectsData;
const foldersData = createFoldersUnit.foldersData;
const filesData = createFilesUnit.filesData;

const B2ShareDepositData = rlequire("dendro", "test/mockdata/deposits/B2ShareDeposit.js");

const start = function ()
{
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".green);
        console.log("[Creating deposits unit] Creating deposit with outside links...".green);
        console.log("**********************************************".green);
    }
};

const end = function ()
{
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".blue);
        console.log("[Creating deposits unit] Complete.".blue);
        console.log("**********************************************".blue);
    }
};

module.exports.setup = function (finish)
{
    start();

    createFoldersUnit.setup(function (err, results)
    {
        if (err)
        {
            finish(err, results);
            end();
        }
        else
        {
            appUtils.registerStartTimeForUnit(path.basename(__filename));
            async.mapSeries(projectsData, function (projectData, cb)
            {
                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                {
                    if (err)
                    {
                        cb(err, agent);
                    }
                    else
                    {
                        projectUtils.getProjectRootContent(true, agent, projectData.handle, function (err, res)
                        {
                            const folders = res.body;
                            B2ShareDepositData.ddr.exportedFromFolder = folders[0].uri;
                            depositUtils.createDeposit(B2ShareDepositData, function (err, res)
                            {
                                cb(err, res);
                            });
                        });
                    }
                });
            }, function (err, results)
            {
                appUtils.registerStopTimeForUnit(path.basename(__filename));
                finish(err, results);
                end();
            });
        }
    });
};
