process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const txtMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/txtMockFile.js"));
const filesData = [txtMockFile];

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (finish)
{
    let createProjectsUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
    const projectsData = createProjectsUnit.projectsData;

    let addMetadataToFoldersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
    let createFoldersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
    const foldersData = createFoldersUnit.foldersData;

    addMetadataToFoldersUnit.setup(function (err, results)
    {
        if (err)
        {
            finish(err, results);
        }
        else
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (err)
                {
                    finish(err, agent);
                }
                else
                {
                    async.mapSeries(projectsData, function (projectData, cb)
                    {
                        async.mapSeries(foldersData, function (folderData, cb)
                        {
                            async.mapSeries(filesData, function (fileData, cb)
                            {
                                fileUtils.uploadFile(true, agent, projectData.handle, folderData.name, fileData, function (err, res)
                                {
                                    if (isNull(err))
                                    {
                                        itemUtils.updateItemMetadata(true, agent, projectData.handle, folderData.name, fileData.metadata, function (err, res)
                                        {
                                            cb(err, res);
                                        });
                                    }
                                    else
                                    {
                                        cb(err, res);
                                    }
                                });
                            }, function (err, results)
                            {
                                cb(err, results);
                            });
                        }, function (err, results)
                        {
                            cb(err, results);
                        });
                    }, function (err, results)
                    {
                        finish(err, results);
                    });
                }
            });
        }
    });
};
