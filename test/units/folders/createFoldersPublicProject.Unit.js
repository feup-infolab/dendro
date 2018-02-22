process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const testFolder2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const folderDemoUser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2.js"));
const folderExportCkan = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportCkan.js"));
const folderExportedCkanNoDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanNoDiffs.js"));
const folderExportedCkanDendroDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanDendroDiffs.js"));
const folderExportedCkanCkanDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanCkanDiffs.js"));
const folderMissingDescriptors = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderMissingDescriptors.js"));
const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));

const foldersData = module.exports.foldersData = [folder, testFolder1, testFolder2, folderDemoUser2, folderExportCkan, folderExportedCkanNoDiffs, folderExportedCkanDendroDiffs, folderExportedCkanCkanDiffs, folderMissingDescriptors];

let AddContributorsToProjectsUnit = require(Pathfinder.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));
class CreateFoldersSingleProject extends AddContributorsToProjectsUnit
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
                            itemUtils.createFolder(true, agent, publicProject.handle, folderData.pathInProject, folderData.name, function (err, res)
                            {
                                if (!isNull(err))
                                {
                                    cb(err, results);
                                }
                                else
                                {
                                    cb(null, results);
                                }
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

CreateFoldersSingleProject.foldersData = foldersData;

module.exports = CreateFoldersSingleProject;
