process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test//utils/item/itemUtils");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

let CreateFoldersPublicProject = rlequire("dendro", "test/units/folders/createFoldersPublicProject.Unit.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const foldersData = CreateFoldersPublicProject.foldersData;
const project = rlequire("dendro", "test/mockdata/projects/public_project.js");

class AddMetadataToFoldersPublicProject extends CreateFoldersPublicProject
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
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
                    itemUtils.updateItemMetadata(true, agent, project.handle, folderData.name, folderData.metadata, function (err, res)
                    {
                        cb(err, res);
                    });
                }, function (err, results)
                {
                    unitUtils.endLoad(self, callback);
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


module.exports = AddMetadataToFoldersPublicProject;
