process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
const path = require("path");
chai.use(require("chai-http"));
const async = require("async");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const socialDendroUtils = rlequire("dendro", "test//utils/social/socialDendroUtils");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

let createProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");
const projectsData = createProjectsUnit.projectsData;

let UploadFilesAndAddMetadataUnit = rlequire("dendro", "test/units/social/uploadFilesAndAddMetadata.Unit.js");
let manualPostMockData = rlequire("dendro", "test/mockdata/social/manualPostMock.js");

class CreateManuaLPostForAllProjectTypes extends UploadFilesAndAddMetadataUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
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

    static setup (callback, forceLoad)
    {
        super.setup(callback, forceLoad);
    }
}

module.exports = CreateManuaLPostForAllProjectTypes;
