process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));

const b2dropProjectData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/b2drop_project.js"));

let CreateUsersUnit = require(Pathfinder.absPathInTestsFolder("units/users/createUsers.Unit.js"));
class CreateProjectB2Drop extends CreateUsersUnit
{
    static load (callback)
    {
		        const self = this;
        self.startLoad(__filename);
        super.load(function (err, results)
        {
            // should.equal(err, null);
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
                                self.endLoad(__filename, callback);
                            });
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

module.exports = CreateProjectB2Drop;
