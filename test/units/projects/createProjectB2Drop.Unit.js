process.env.NODE_ENV = "test";

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2");

const b2dropProjectData = rlequire("dendro", "test/mockdata/projects/b2drop_project.js");

let CreateUsersUnit = rlequire("dendro", "test/units/users/createUsers.Unit.js");
class CreateProjectB2Drop extends CreateUsersUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(CreateProjectB2Drop);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            if (err)
            {
                callback(err, agent);
            }
            else
            {
                projectUtils.createNewProject(true, agent, b2dropProjectData, function (err, res)
                {
                    async.mapSeries([b2dropProjectData], function (projectData, cb)
                    {
                        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                        {
                            if (err)
                            {
                                cb(err, agent);
                            }
                            else
                            {
                                userUtils.addUserAscontributorToProject(true, agent, demouser2.username, projectData.handle, function (err, res)
                                {
                                    cb(err, res);
                                });
                            }
                        });
                    }, function (err, results)
                    {
                        unitUtils.endLoad(CreateProjectB2Drop, callback);
                    });
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

module.exports = CreateProjectB2Drop;
