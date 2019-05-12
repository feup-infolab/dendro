process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

let CreateProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");
const projectsData = CreateProjectsUnit.projectsData;

class DeleteProjects extends CreateProjectsUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(DeleteProjects);
        async.mapSeries(projectsData, function (projectData, cb)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (err)
                {
                    cb(err, agent);
                }
                else
                {
                    projectUtils.deleteProject(true, agent, projectData.handle, function (err, res)
                    {
                        cb(err, res);
                    });
                }
            });
        }, function (err, results)
        {
            unitUtils.endLoad(DeleteProjects, callback);
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

module.exports = DeleteProjects;
