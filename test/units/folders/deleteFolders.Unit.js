process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const CreateFoldersUnit = require(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const CreateProjectsUnit = require(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));

const projectsData = CreateProjectsUnit.projectsData;
const foldersData = CreateFoldersUnit.foldersData;

class DeleteFolders extends CreateFoldersUnit
{
    static load (callback)
    {
		        const self = this;
        self.startLoad();
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
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
                            self.endLoad(callback);
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
    static shutdown (callback)
    {
        super.shutdown(callback);
    }
}

module.exports = DeleteFolders;
