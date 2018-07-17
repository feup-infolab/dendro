process.env.NODE_ENV = "test";

const path = require("path");

const rlequire = require("rlequire");
const ckanTestUtils = rlequire("dendro", "test/utils/repository/ckanTestUtils.js");

const ckan = rlequire("dendro", "test/mockdata/repositories/dataToCreate/ckan");
const ckanOrganizationData = rlequire("dendro", "test/mockdata/repositories/dataToCreate/ckanOrganizationData");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");

let UploadFileToProjectFoldersUnit = rlequire("dendro", "test/units/repositories/uploadFileToProjectFolders.Unit.js");
class ClearCkanOrganizationState extends UploadFileToProjectFoldersUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
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
                            unitUtils.endLoad(self, callback);
                        }
                        else
                        {
                            callback(err, data);
                        }
                    }
                    else
                    {
                        unitUtils.endLoad(self, callback);
                    }
                });
            }
        });
    }
    static init (callback)
    {
        super.init(callback);
    }

    static shutdown (callback)
    {
        super.shutdown(callback);
    }
}

module.exports = ClearCkanOrganizationState;
