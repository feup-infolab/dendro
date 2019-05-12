process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test//utils/item/itemUtils");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

let CreateProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");
const projectsData = CreateProjectsUnit.projectsData;

let CreateFoldersUnit = rlequire("dendro", "test/units/folders/createFolders.Unit.js");
const foldersData = CreateFoldersUnit.foldersData;

const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

class AddMetadataToFolders extends CreateFoldersUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(AddMetadataToFolders);
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
                        itemUtils.updateItemMetadata(true, agent, projectData.handle, folderData.name, folderData.metadata, function (err, res)
                        {
                            cb(err, res);
                        });
                    }, function (err, results)
                    {
                        cb(err, results);
                    });
                }, function (err, results)
                {
                    if (isNull(err))
                    {
                        unitUtils.endLoad(AddMetadataToFolders, function (err, results)
                        {
                            callback(err, results);
                        });
                    }
                    else
                    {
                        Logger.log("error", "Error adding metadata to folders in addMetadataToFolders.Unit.");
                        Logger.log("error", err);
                        Logger.log("error", results);
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

AddMetadataToFolders.foldersData = foldersData;
AddMetadataToFolders.projectsData = projectsData;


module.exports = AddMetadataToFolders;
