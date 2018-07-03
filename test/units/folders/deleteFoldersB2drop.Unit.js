process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test//utils/item/itemUtils");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");
const createProjectsUnit = rlequire("dendro", "test/units/projects/createProjectsB2Drop.Unit.js");

const folder = rlequire("dendro", "test/mockdata/folders/folder.js");
const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const testFolder2 = rlequire("dendro", "test/mockdata/folders/testFolder2.js");
const folderDemoUser2 = rlequire("dendro", "test/mockdata/folders/folderDemoUser2.js");

const projectsData = createProjectsUnit.projectsData;
const foldersData = module.exports.foldersData = [folder, testFolder1, testFolder2, folderDemoUser2];

let AddContributorsToProjectsUnit = rlequire("dendro", "test/units/projects/addContributorsToProjects.Unit.js");
class DeleteFoldersB2Drop extends AddContributorsToProjectsUnit
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

module.exports = DeleteFoldersB2Drop;
