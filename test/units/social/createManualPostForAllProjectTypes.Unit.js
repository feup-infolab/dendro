process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
const path = require("path");
chai.use(require("chai-http"));
const async = require("async");
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

let createProjectsUnit = require(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const projectsData = createProjectsUnit.projectsData;

let UploadFilesAndAddMetadataUnit = require(Pathfinder.absPathInTestsFolder("units/social/uploadFilesAndAddMetadata.Unit.js"));
let manualPostMockData = require(Pathfinder.absPathInTestsFolder("mockdata/social/manualPostMock.js"));

class CreateManuaLPostForAllProjectTypes extends UploadFilesAndAddMetadataUnit
{
    static load (callback)
    {
		        const self = this;
        self.startLoad(path.basename(__filename));
        super.load(function (err, results)
        {
            if (!isNull(err))
            {
                callback(err, results);
            }
            else
            {
                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                {
                    if (!isNull(err))
                    {
                        callback(err, agent);
                    }
                    else
                    {
                        async.mapSeries(projectsData, function (projectData, cb)
                        {
                            projectUtils.getProjectUriFromHandle(agent, projectData.handle, function (err, res)
                            {
                                if (isNull(err))
                                {
                                    let projectUri = res;
                                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
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

module.exports = CreateManuaLPostForAllProjectTypes;
