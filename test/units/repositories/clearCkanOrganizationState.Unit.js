process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const ckanTestUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/ckanTestUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const ckan = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckan"));
const ckanOrganizationData = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckanOrganizationData"));

module.exports.setup = function (project, finish)
{
    console.log("At clearCkanOrganizationStateUnit");
    let uploadFileToProjectFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/uploadFileToProjectFolders.Unit.js"));
    uploadFileToProjectFoldersUnit.setup(project, function (err, results)
    {
        if (err)
        {
            finish(err, results);
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
                    finish(err, data);
                }
                else
                {
                    /* ckanTestUtils.deleteCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
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
                    }) */

                    console.log("Deleted all packages from ckan organization successfully");
                    ckanTestUtils.createCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data)
                    {
                        if (err)
                        {
                            if (data.error.name[0] === "Group name already exists in database")
                            {
                                unitUtils.stop(__filename);
                                finish(null, data);
                            }
                            else
                            {
                                unitUtils.stop(__filename);
                                finish(err, data);
                            }
                        }
                        else
                        {
                            unitUtils.stop(__filename);
                            finish(err, data);
                        }
                    });
                }
            });
        }
    });
};
