process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));
const createProjectsUnit = require(Pathfinder.absPathInTestsFolder("units/projects/createProjectsB2Drop.Unit.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const testFolder2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const folderDemoUser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2.js"));

const projectsData = createProjectsUnit.projectsData;
const foldersData = module.exports.foldersData = [folder, testFolder1, testFolder2, folderDemoUser2];

let AddContributorsToProjectsUnit = require(Pathfinder.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));
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
