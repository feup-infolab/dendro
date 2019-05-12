process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test//utils/item/itemUtils");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const CreateFoldersUnit = rlequire("dendro", "test/units/folders/createFolders.Unit.js");
const CreateProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");

const projectsData = CreateProjectsUnit.projectsData;
const foldersData = CreateFoldersUnit.foldersData;

class DeleteFolders extends CreateFoldersUnit
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
                async.mapSeries(projectsData, function (projectData, cb)
                {
                    async.mapSeries(foldersData, function (folderData, cb)
                    {
                        itemUtils.deleteItem(true, agent, projectData.handle, folderData.name, function (err, res)
                        {
                            cb(err, res);
                        });
                    }, function (err, results)
                    {
                        cb(err, results);
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


module.exports = DeleteFolders;
