process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const should = chai.should();

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const createProjectB2DropUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjectB2Drop.Unit.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const testFolder2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const folderDemoUser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2.js"));

const b2dropProjectData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/b2drop_project.js"));
const projectsData = [b2dropProjectData];
const foldersData = module.exports.foldersData = [folder, testFolder1, testFolder2, folderDemoUser2];

const TestUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/testUnit.js")).TestUnit;
class CreateFoldersB2Drop extends TestUnit
{
    static init (callback)
    {
        createProjectB2DropUnit.init(function (err, results)
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
                                itemUtils.createFolder(true, agent, projectData.handle, folderData.pathInProject, folderData.name, function (err, res)
                                {
                                    cb(err, res);
                                });
                            }, function (err, results)
                            {
                                cb(err, results);
                            });
                        }, function (err, results)
                        {
                            callback(err, results);
                        });
                    }
                });
            }
        });
    }
}

module.exports = CreateFoldersB2Drop;
