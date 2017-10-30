process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const chai = require("chai");
chai.use(require('chai-http'));
const async = require("async");
const should = chai.should();
const path = require('path');

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const createProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const testFolder2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const folderDemoUser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2.js"));
const folderExportCkan = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportCkan.js"));
const folderExportedCkanNoDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanNoDiffs.js"));
const folderExportedCkanDendroDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanDendroDiffs.js"));
const folderExportedCkanCkanDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanCkanDiffs.js"));
const folderMissingDescriptors = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderMissingDescriptors.js"));

const projectsData = createProjectsUnit.projectsData;
const foldersData = module.exports.foldersData = [folder, testFolder1, testFolder2, folderDemoUser2, folderExportCkan, folderExportedCkanNoDiffs, folderExportedCkanDendroDiffs, folderExportedCkanCkanDiffs, folderMissingDescriptors];

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

module.exports.setup = function(project, finish)
{
    let addContributorsToProjectsUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));

    addContributorsToProjectsUnit.setup(function (err, results) {
        if(err)
        {
            finish(err, results);
        }
        else
        {
            appUtils.registerStartTimeForUnit(path.basename(__filename));
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                if(err)
                {
                    finish(err, agent);
                }
                else
                {
                    async.mapSeries(foldersData, function (folderData, cb) {
                        itemUtils.createFolder(true, agent, project.handle, folderData.pathInProject, folderData.name, function (err, res) {
                            if (!isNull(err)) {
                                cb(err, results);
                            }
                            else {
                                cb(null, results);
                            }
                        });
                    }, function (err, results) {
                        appUtils.registerStopTimeForUnit(path.basename(__filename));
                        finish(err, results);
                    });
                }
            });
        }
    });
};