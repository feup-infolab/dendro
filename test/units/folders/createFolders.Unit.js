process.env.NODE_ENV = "test";

const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test//utils/item/itemUtils");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const createProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");

const folder = rlequire("dendro", "test/mockdata/folders/folder.js");
const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const testFolder2 = rlequire("dendro", "test/mockdata/folders/testFolder2.js");
const folderDemoUser2 = rlequire("dendro", "test/mockdata/folders/folderDemoUser2.js");
const folderExportCkan = rlequire("dendro", "test/mockdata/folders/folderExportCkan.js");
const folderExportedCkanNoDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanNoDiffs.js");
const folderExportedCkanDendroDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanDendroDiffs.js");
const folderExportedCkanCkanDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanCkanDiffs.js");
const folderMissingDescriptors = rlequire("dendro", "test/mockdata/folders/folderMissingDescriptors.js");

const projectsData = createProjectsUnit.projectsData;
const foldersData = [folder, testFolder1, testFolder2, folderDemoUser2, folderExportCkan, folderExportedCkanNoDiffs, folderExportedCkanDendroDiffs, folderExportedCkanCkanDiffs, folderMissingDescriptors];

let AddContributorsToProjectsUnit = rlequire("dendro", "test/units/projects/addContributorsToProjects.Unit.js");
class CreateFolders extends AddContributorsToProjectsUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(CreateFolders);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            if (err)
            {
                callback(err, agent);
            }
            else
            {
                async.mapSeries(projectsData, function (projectData, cb)
                {
                    async.mapSeries(foldersData, function (folderData, cb)
                    {
                        itemUtils.createFolder(true, agent, projectData.handle, folderData.pathInProject, folderData.name, function (err, res)
                        {
                            if (!isNull(err))
                            {
                                cb(err, res);
                            }
                            else
                            {
                                cb(null, res);
                            }
                        });
                    }, function (err, results)
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
                    if (isNull(err))
                    {
                        unitUtils.endLoad(CreateFolders, function (err, results)
                        {
                            callback(err, results);
                        });
                    }
                    else
                    {
                        callback(err, results);
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

    static setup (callback, forceLoad)
    {
        super.setup(callback, forceLoad);
    }
}

CreateFolders.foldersData = foldersData;


module.exports = CreateFolders;
