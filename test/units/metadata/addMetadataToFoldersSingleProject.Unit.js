process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (project, finish)
{
    let createFoldersSingleProjectUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFoldersSingleProject.Unit.js"));
    const foldersData = createFoldersSingleProjectUnit.foldersData;

    createFoldersSingleProjectUnit.setup(project, function (err, results)
    {
        if (err)
        {
            finish(err, results);
        }
        else
        {
            unitUtils.start(__filename);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (err)
                {
                    finish(err, agent);
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
                        unitUtils.end(__filename);
                        finish(err, results);
                    });
                }
            });
        }
    });
};
