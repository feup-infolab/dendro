process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

let CreateFoldersPublicProject = require(Pathfinder.absPathInTestsFolder("units/folders/createFoldersPublicProject.Unit.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const foldersData = CreateFoldersPublicProject.foldersData;
const project = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));

class AddMetadataToFoldersPublicProject extends CreateFoldersPublicProject
{
    static load (callback)
    {
        const self = this;
        self.startLoad(path.basename(__filename));
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
                        async.mapSeries(foldersData, function (folderData, cb)
                        {
                            itemUtils.updateItemMetadata(true, agent, project.handle, folderData.name, folderData.metadata, function (err, res)
                            {
                                cb(err, res);
                            });
                        }, function (err, results)
                        {
                            self.endLoad(path.basename(__filename));

                            callback(err, results);
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

module.exports = AddMetadataToFoldersPublicProject;
