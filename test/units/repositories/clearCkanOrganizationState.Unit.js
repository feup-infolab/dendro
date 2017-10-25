process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const async = require("async");
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const path = require('path');
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const ckanTestUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/ckanTestUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const ckan = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckan"));
const ckanOrganizationData = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckanOrganizationData"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

module.exports.setup = function (project, finish) {
    console.log("At clearCkanOrganizationStateUnit");
    let uploadFileToProjectFoldersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/uploadFileToProjectFolders.Unit.js"));
    uploadFileToProjectFoldersUnit.setup(project, function (err, results) {
        if (err) {
            finish(err, results);
        }
        else {
            console.log("---------- RUNNING UNIT clearCkanOrganizationState for: "  + project.handle + " ----------");
            appUtils.registerStartTimeForUnit(path.basename(__filename));
            ckanTestUtils.deleteAllPackagesFromOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                if(err)
                {
                    console.error("Error deleting all packages from ckan organization");
                    finish(err, data);
                }
                else
                {
                    /*ckanTestUtils.deleteCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                        if(err)
                        {
                            finish(err, data);
                        }
                        else
                        {
                            ckanTestUtils.createCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                                finish(err, data);
                            })
                        }
                    })*/

                    console.log("Deleted all packages from ckan organization successfully");
                    ckanTestUtils.createCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                        if(err)
                        {
                            if(data.error.name[0] === "Group name already exists in database")
                            {
                                appUtils.registerStopTimeForUnit(path.basename(__filename));
                                finish(null, data);
                            }
                            else
                            {
                                appUtils.registerStopTimeForUnit(path.basename(__filename));
                                finish(err, data);
                            }
                        }
                        else
                        {
                            appUtils.registerStopTimeForUnit(path.basename(__filename));
                            finish(err, data);
                        }
                    })
                }
            });
        }
    });
};
