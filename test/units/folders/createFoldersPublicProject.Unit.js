process.env.NODE_ENV = "test";

const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test//utils/item/itemUtils");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const folder = rlequire("dendro", "test/mockdata/folders/folder.js");
const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const testFolder2 = rlequire("dendro", "test/mockdata/folders/testFolder2.js");
const folderDemoUser2 = rlequire("dendro", "test/mockdata/folders/folderDemoUser2.js");
const folderExportCkan = rlequire("dendro", "test/mockdata/folders/folderExportCkan.js");
const folderExportedCkanNoDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanNoDiffs.js");
const folderExportedCkanDendroDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanDendroDiffs.js");
const folderExportedCkanCkanDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanCkanDiffs.js");
const folderMissingDescriptors = rlequire("dendro", "test/mockdata/folders/folderMissingDescriptors.js");
const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");

const foldersData = module.exports.foldersData = [folder, testFolder1, testFolder2, folderDemoUser2, folderExportCkan, folderExportedCkanNoDiffs, folderExportedCkanDendroDiffs, folderExportedCkanCkanDiffs, folderMissingDescriptors];

let AddContributorsToProjectsUnit = rlequire("dendro", "test/units/projects/addContributorsToProjects.Unit.js");
class CreateFoldersSingleProject extends AddContributorsToProjectsUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(CreateFoldersSingleProject);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            if (err)
            {
                callback(err, agent);
            }
            else
            {
                async.mapSeries(foldersData, function (folderData, cb)
                {
                    itemUtils.createFolder(true, agent, publicProject.handle, folderData.pathInProject, folderData.name, function (err, results)
                    {
                        if (!isNull(err))
                        {
                            cb(err, results);
                        }
                        else
                        {
                            cb(null, results);
                        }
                    });
                }, function (err, results)
                {
                    unitUtils.endLoad(CreateFoldersSingleProject, callback);
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

CreateFoldersSingleProject.foldersData = foldersData;

module.exports = CreateFoldersSingleProject;
