process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const ckanTestUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/ckanTestUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const ckan = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckan"));
const ckanOrganizationData = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckanOrganizationData"));

const TestUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/testUnit.js")).TestUnit;
class ClearCkanOrganizationState extends TestUnit
{
    static init (callback)
    {
        console.log("At clearCkanOrganizationStateUnit");
        let uploadFileToProjectFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/uploadFileToProjectFolders.Unit.js"));
        uploadFileToProjectFoldersUnit.init(project, function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                console.log("---------- RUNNING UNIT clearCkanOrganizationState for: " + project.handle + " ----------");
                unitUtils.start(__filename);
                ckanTestUtils.deleteAllPackagesFromOrganization(true, agent, ckan, ckanOrganizationData, function (err, data)
                {
                    if (err)
                    {
                        Logger.log("error", "Error deleting all packages from ckan organization");
                        callback(err, data);
                    }
                    else
                    {
                        /* ckanTestUtils.deleteCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                            if(err)
                            {
                                callback(err, data);
                            }
                            else
                            {
                                ckanTestUtils.createCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                                    callback(err, data);
                                })
                            }
                        }) */

                        console.log("Deleted all packages from ckan organization successfully");
                        ckanTestUtils.createCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data)
                        {
                            if (err)
                            {
                                if (data.error.name[0] === "Group name already exists in database")
                                {
                                    unitUtils.stop(__filename);
                                    callback(null, data);
                                }
                                else
                                {
                                    unitUtils.stop(__filename);
                                    callback(err, data);
                                }
                            }
                            else
                            {
                                unitUtils.stop(__filename);
                                callback(err, data);
                            }
                        });
                    }
                });
            }
        });
    }
}

module.exports = ClearCkanOrganizationState;
