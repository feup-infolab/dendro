process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const createProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));

const projectsData = createProjectsUnit.projectsData;
const foldersData = createFoldersUnit.foldersData;

module.exports.setup = function (finish)
{
    unitUtils.loadCheckpointAndRun(
        path.basename(__filename),
        function (err, restoreMessage)
        {
            unitUtils.start(path.basename(__filename));
            createProjectsUnit.setup(function (err, results)
            {
                if (err)
                {
                    finish(err, results);
                }
                else
                {
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
                                userUtils.addUserAscontributorToProject(true, agent, demouser2.username, projectData.handle, function (err, res)
                                {
                                    cb(err, res);
                                });
                            }
                        });
                    }, function (err, results)
                    {
                        finish(err, results);
                        unitUtils.end(__filename);
                    });
                }
            });
        },
        function ()
        {
            unitUtils.end(__filename);
            finish(err, results);
        });
};
