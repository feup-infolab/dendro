process.env.NODE_ENV = "test";

const path = require("path");

const Pathfinder = global.Pathfinder;
const ckanTestUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/ckanTestUtils.js"));

const ckan = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckan"));
const ckanOrganizationData = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckanOrganizationData"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));

let UploadFileToProjectFoldersUnit = require(Pathfinder.absPathInTestsFolder("units/repositories/uploadFileToProjectFolders.Unit.js"));
class ClearCkanOrganizationState extends UploadFileToProjectFoldersUnit
{
    static load (callback)
    {
		        const self = this;
        self.markLoadStart(__filename);
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                console.log("---------- RUNNING UNIT clearCkanOrganizationState for: " + publicProject.handle + " ----------");

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
                                    self.markLoadEnd(path.basename(__filename));

                                    callback(null, data);
                                }
                                else
                                {
                                    callback(err, data);
                                }
                            }
                            else
                            {
                                self.markLoadEnd(path.basename(__filename));

                                callback(err, data);
                            }
                        });
                    }
                });
            }
        });
    }
    static init (callback)
    {
        super.init(callback);
    }
}

module.exports = ClearCkanOrganizationState;
